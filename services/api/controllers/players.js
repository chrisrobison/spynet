/**
 * Players Controller
 * Handles player profile, inventory, stats
 */

import BaseController from './_base.js';

export default class Players extends BaseController {
  /**
   * Get player profile
   * GET /players/:id
   */
  async get(ctx) {
    const [playerId] = ctx.params;

    const player = await this.queryOne(
      `SELECT p.id, p.handle, p.xp, p.rank, p.credits, p.reputation,
              p.profile_data, p.created_at, p.last_seen,
              f.id as faction_id, f.name as faction_name, f.code as faction_code,
              f.color_primary, f.color_secondary
       FROM players p
       LEFT JOIN factions f ON p.faction_id = f.id
       WHERE p.id = $1 AND p.status = 'active'`,
      [playerId]
    );

    if (!player) {
      this.notFound('Player');
    }

    return this.success({ player });
  }

  /**
   * Get player inventory
   * GET /players/:id/inventory
   */
  async inventory(ctx) {
    const [playerId] = ctx.params;
    const user = await ctx.getUser();

    // Only player themselves or admins can see inventory
    if (!user || (user.id !== playerId && !user.isAdmin)) {
      this.forbidden('Cannot view other players inventory');
    }

    const items = await this.query(
      `SELECT pi.id, pi.quantity, pi.acquired_at,
              i.item_type, i.name, i.description, i.rarity, i.value_credits, i.metadata
       FROM player_inventory pi
       JOIN items i ON pi.item_id = i.id
       WHERE pi.player_id = $1
       ORDER BY pi.acquired_at DESC`,
      [playerId]
    );

    return this.success({ items });
  }

  /**
   * Get player stats
   * GET /players/:id/stats
   */
  async stats(ctx) {
    const [playerId] = ctx.params;

    // Get mission stats
    const missionStats = await this.queryOne(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'succeeded') as missions_completed,
         COUNT(*) FILTER (WHERE status = 'failed') as missions_failed,
         COUNT(*) FILTER (WHERE status = 'in_progress') as missions_active
       FROM mission_assignments
       WHERE player_id = $1`,
      [playerId]
    );

    // Get QR scan stats
    const qrStats = await this.queryOne(
      `SELECT
         COUNT(*) as total_scans,
         SUM(reward_xp) as total_xp_from_qr,
         SUM(reward_credits) as total_credits_from_qr
       FROM qr_scans
       WHERE player_id = $1`,
      [playerId]
    );

    // Get encounter stats
    const encounterStats = await this.queryOne(
      `SELECT COUNT(*) as total_encounters
       FROM encounters
       WHERE player1_id = $1 OR player2_id = $1`,
      [playerId]
    );

    // Get zone stats
    const zoneStats = await this.queryOne(
      `SELECT COUNT(DISTINCT zone_id) as zones_visited
       FROM events
       WHERE player_id = $1 AND event_type = 'zone.entered'`,
      [playerId]
    );

    return this.success({
      stats: {
        ...missionStats,
        ...qrStats,
        ...encounterStats,
        ...zoneStats
      }
    });
  }

  /**
   * Update player profile
   * PATCH /players/:id
   */
  async patch(ctx) {
    const [playerId] = ctx.params;
    const user = await ctx.requireAuth();

    // Only player themselves can update profile
    if (user.id !== playerId) {
      this.forbidden('Cannot update other players profile');
    }

    const { profile_data } = ctx.body;

    if (!profile_data) {
      this.badRequest('Missing profile_data');
    }

    // Merge with existing profile_data
    const current = await this.queryOne(
      'SELECT profile_data FROM players WHERE id = $1',
      [playerId]
    );

    const merged = { ...current.profile_data, ...profile_data };

    await this.query(
      'UPDATE players SET profile_data = $1, updated_at = now() WHERE id = $2',
      [JSON.stringify(merged), playerId]
    );

    return this.success({ message: 'Profile updated', profile_data: merged });
  }

  /**
   * Get player leaderboard
   * GET /players/leaderboard
   */
  async leaderboard(ctx) {
    const { page = 1, limit = 50 } = ctx.query;
    const { offset } = this.paginate(ctx.query, { page, limit });

    const players = await this.query(
      `SELECT p.id, p.handle, p.xp, p.rank, p.reputation,
              f.name as faction_name, f.code as faction_code, f.color_primary,
              COUNT(DISTINCT ma.mission_id) FILTER (WHERE ma.status = 'succeeded') as missions_completed
       FROM players p
       LEFT JOIN factions f ON p.faction_id = f.id
       LEFT JOIN mission_assignments ma ON p.id = ma.player_id
       WHERE p.status = 'active'
       GROUP BY p.id, p.handle, p.xp, p.rank, p.reputation, f.name, f.code, f.color_primary
       ORDER BY p.xp DESC, p.reputation DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const total = await this.queryOne(
      'SELECT COUNT(*) as count FROM players WHERE status = \'active\''
    );

    return this.success({
      players,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total.count),
        pages: Math.ceil(total.count / limit)
      }
    });
  }

  /**
   * Update player location
   * POST /players/:id/location
   */
  async location(ctx) {
    const [playerId] = ctx.params;
    const user = await ctx.requireAuth();

    if (user.id !== playerId) {
      this.forbidden();
    }

    const { lat, lon } = ctx.body;

    if (!lat || !lon) {
      this.badRequest('Missing lat or lon');
    }

    // Update player location
    await this.query(
      `UPDATE players
       SET last_location = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
           last_seen = now()
       WHERE id = $3`,
      [lon, lat, playerId]
    );

    // Check if player entered a new zone
    const zone = await this.queryOne(
      'SELECT * FROM get_zone_for_location($1, $2)',
      [lat, lon]
    );

    if (zone) {
      // Log zone entry event
      await this.logEvent('zone.entered', { zone_id: zone.zone_id, zone_name: zone.zone_name }, {
        playerId,
        zoneId: zone.zone_id
      });

      return this.success({
        location: { lat, lon },
        zone: {
          id: zone.zone_id,
          name: zone.zone_name,
          type: zone.zone_type
        }
      });
    }

    return this.success({ location: { lat, lon } });
  }
}
