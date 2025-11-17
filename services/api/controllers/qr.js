/**
 * QR Controller
 * Handles QR code generation, scanning, validation
 */

import BaseController from './_base.js';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import QRCode from 'qrcode';

export default class Qr extends BaseController {
  /**
   * Generate a new QR code
   * POST /qr/generate
   * Body: { qr_type, mission_id?, zone_id?, location?, expires_in? }
   */
  async generate(ctx) {
    const user = await ctx.requireAuth();
    const { qr_type, mission_id, zone_id, location, expires_in, payload = {} } = ctx.body;

    if (!['mission', 'item', 'intel', 'faction'].includes(qr_type)) {
      this.badRequest('Invalid qr_type');
    }

    // Generate short code
    const code = nanoid(6).toUpperCase();

    // Create JWT payload
    const jwtPayload = {
      code,
      type: qr_type,
      mission_id,
      zone_id,
      payload,
      created_by: user.id,
      created_at: new Date().toISOString()
    };

    // Sign JWT
    const signed_jwt = jwt.sign(jwtPayload, process.env.JWT_SECRET, {
      expiresIn: expires_in || '7d'
    });

    // Calculate expiry
    const expires_at = expires_in
      ? new Date(Date.now() + this.parseExpiry(expires_in))
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days default

    // Insert QR code
    const qrCode = await this.queryOne(
      `INSERT INTO qr_codes (code, signed_jwt, qr_type, zone_id, location, creator_player_id, mission_id, payload, expires_at, active)
       VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326)::geography, $7, $8, $9, $10, true)
       RETURNING id, code, qr_type, expires_at, created_at`,
      [
        code,
        signed_jwt,
        qr_type,
        zone_id,
        location?.lon,
        location?.lat,
        user.id,
        mission_id,
        JSON.stringify(payload),
        expires_at
      ]
    );

    // Generate QR code image (data URL)
    const qrImageUrl = await QRCode.toDataURL(signed_jwt, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 512,
      margin: 2
    });

    // Log event
    await this.logEvent('qr.generated', {
      qr_id: qrCode.id,
      code,
      type: qr_type
    }, {
      playerId: user.id,
      zoneId: zone_id
    });

    return this.created({
      qr: qrCode,
      jwt: signed_jwt,
      image: qrImageUrl,
      printable_url: `${process.env.PUBLIC_URL}/qr/${code}`
    });
  }

  /**
   * Scan a QR code
   * POST /qr/scan
   * Body: { code?, jwt, location, wifi_hash? }
   */
  async scan(ctx) {
    const user = await ctx.requireAuth();
    const { code, jwt: scannedJwt, location, wifi_hash } = ctx.body;

    if (!scannedJwt || !location) {
      this.badRequest('Missing jwt or location');
    }

    // Verify JWT
    let jwtPayload;
    try {
      jwtPayload = jwt.verify(scannedJwt, process.env.JWT_SECRET);
    } catch (error) {
      return ctx.reply.code(400).send({
        success: false,
        error: {
          code: 'INVALID_QR',
          message: 'QR code is invalid or expired'
        }
      });
    }

    // Find QR code in database
    const qrCode = await this.queryOne(
      `SELECT qc.*, m.title as mission_title, m.description as mission_description,
              m.difficulty, m.kind as mission_kind
       FROM qr_codes qc
       LEFT JOIN missions m ON qc.mission_id = m.id
       WHERE qc.code = $1 AND qc.active = true`,
      [jwtPayload.code || code]
    );

    if (!qrCode) {
      this.notFound('QR code');
    }

    // Check if expired
    if (qrCode.expires_at && new Date(qrCode.expires_at) < new Date()) {
      return ctx.reply.code(400).send({
        success: false,
        error: {
          code: 'QR_EXPIRED',
          message: 'QR code has expired'
        }
      });
    }

    // Check scan limit
    if (qrCode.max_scans && qrCode.scan_count >= qrCode.max_scans) {
      return ctx.reply.code(400).send({
        success: false,
        error: {
          code: 'MAX_SCANS_REACHED',
          message: 'QR code has reached maximum scans'
        }
      });
    }

    // Verify location proximity (if QR has a location)
    if (qrCode.location) {
      const distance = await this.queryOne(
        `SELECT ST_Distance(
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
          location
        ) as distance
        FROM qr_codes WHERE id = $3`,
        [location.lon, location.lat, qrCode.id]
      );

      // Must be within 100 meters
      if (distance.distance > 100) {
        return ctx.reply.code(400).send({
          success: false,
          error: {
            code: 'LOCATION_TOO_FAR',
            message: 'You must be within 100m of the QR code location',
            distance: Math.round(distance.distance)
          }
        });
      }
    }

    // Calculate rewards based on QR type and difficulty
    const rewards = this.calculateRewards(qrCode);

    // Award rewards to player
    await this.query(
      'UPDATE players SET xp = xp + $1, credits = credits + $2 WHERE id = $3',
      [rewards.xp, rewards.credits, user.id]
    );

    // Log scan
    const scan = await this.queryOne(
      `INSERT INTO qr_scans (qr_code_id, player_id, mission_id, location, wifi_hash, reward_xp, reward_credits, success)
       VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography, $6, $7, $8, true)
       RETURNING id, scanned_at`,
      [
        qrCode.id,
        user.id,
        qrCode.mission_id,
        location.lon,
        location.lat,
        wifi_hash,
        rewards.xp,
        rewards.credits
      ]
    );

    // Increment scan count
    await this.query(
      'UPDATE qr_codes SET scan_count = scan_count + 1 WHERE id = $1',
      [qrCode.id]
    );

    // If this is a mission QR, accept or progress the mission
    let missionUpdate = null;
    if (qrCode.mission_id) {
      missionUpdate = await this.handleMissionQR(user.id, qrCode.mission_id);
    }

    // Log event
    await this.logEvent('qr.scanned', {
      qr_id: qrCode.id,
      scan_id: scan.id,
      rewards
    }, {
      playerId: user.id,
      zoneId: qrCode.zone_id
    });

    return this.success({
      scan: {
        id: scan.id,
        scanned_at: scan.scanned_at
      },
      qr: {
        code: qrCode.code,
        type: qrCode.qr_type,
        mission: qrCode.mission_id ? {
          id: qrCode.mission_id,
          title: qrCode.mission_title,
          description: qrCode.mission_description,
          kind: qrCode.mission_kind,
          difficulty: qrCode.difficulty
        } : null
      },
      rewards,
      mission: missionUpdate,
      narrative: this.generateNarrative(qrCode, rewards)
    });
  }

  /**
   * Get QR code details (for admin/creator)
   * GET /qr/:code
   */
  async get(ctx) {
    const [code] = ctx.params;

    const qrCode = await this.queryOne(
      `SELECT qc.*, COUNT(qs.id) as total_scans,
              m.title as mission_title
       FROM qr_codes qc
       LEFT JOIN qr_scans qs ON qc.id = qs.qr_code_id
       LEFT JOIN missions m ON qc.mission_id = m.id
       WHERE qc.code = $1
       GROUP BY qc.id, m.title`,
      [code]
    );

    if (!qrCode) {
      this.notFound('QR code');
    }

    return this.success({ qr: qrCode });
  }

  /**
   * Calculate rewards for scanning QR
   */
  calculateRewards(qrCode) {
    const baseXP = 25;
    const baseCredits = 10;

    let multiplier = 1;

    // Type multipliers
    const typeMultipliers = {
      mission: 2,
      intel: 1.5,
      faction: 1.2,
      item: 1
    };

    multiplier *= typeMultipliers[qrCode.qr_type] || 1;

    // Difficulty multiplier (if mission)
    if (qrCode.difficulty) {
      multiplier *= qrCode.difficulty;
    }

    return {
      xp: Math.floor(baseXP * multiplier),
      credits: Math.floor(baseCredits * multiplier)
    };
  }

  /**
   * Handle mission QR code scan
   */
  async handleMissionQR(playerId, missionId) {
    // Check if player has this mission
    const assignment = await this.queryOne(
      'SELECT * FROM mission_assignments WHERE player_id = $1 AND mission_id = $2',
      [playerId, missionId]
    );

    if (!assignment) {
      // Auto-accept mission
      await this.query(
        `INSERT INTO mission_assignments (mission_id, player_id, status, started_at)
         VALUES ($1, $2, 'in_progress', now())`,
        [missionId, playerId]
      );

      return { action: 'accepted', status: 'in_progress' };
    } else if (assignment.status === 'in_progress') {
      // Complete mission
      await this.query(
        `UPDATE mission_assignments
         SET status = 'succeeded', completed_at = now()
         WHERE mission_id = $1 AND player_id = $2`,
        [missionId, playerId]
      );

      return { action: 'completed', status: 'succeeded' };
    }

    return { action: 'none', status: assignment.status };
  }

  /**
   * Generate scan narrative
   */
  generateNarrative(qrCode, rewards) {
    const narratives = {
      mission: 'Dead drop retrieved. Mission parameters downloaded to your device.',
      intel: 'Classified intel acquired. Your faction will be notified.',
      faction: 'Faction beacon scanned. Loyalty points awarded.',
      item: 'Item cache discovered. Check your inventory.'
    };

    return {
      title: 'QR Code Scanned',
      message: narratives[qrCode.qr_type] || 'QR code scanned successfully.',
      rewards: `+${rewards.xp} XP, +${rewards.credits} credits`
    };
  }

  /**
   * Parse expiry string to milliseconds
   */
  parseExpiry(str) {
    const units = {
      's': 1000,
      'm': 60 * 1000,
      'h': 60 * 60 * 1000,
      'd': 24 * 60 * 60 * 1000
    };

    const match = str.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000; // Default 7 days

    const [, num, unit] = match;
    return parseInt(num) * units[unit];
  }
}
