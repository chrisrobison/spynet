/**
 * Auth Controller
 * Handles authentication: login, register, refresh tokens
 */

import BaseController from './_base.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';

export default class Auth extends BaseController {
  /**
   * Register a new player
   * POST /auth/register
   * Body: { handle, email, password }
   */
  async register(ctx) {
    const { handle, email, password } = ctx.body;

    // Validation
    if (!handle || !email || !password) {
      this.badRequest('Missing required fields: handle, email, password');
    }

    if (handle.length < 3 || handle.length > 20) {
      this.badRequest('Handle must be 3-20 characters');
    }

    if (!/^[a-zA-Z0-9_]+$/.test(handle)) {
      this.badRequest('Handle can only contain letters, numbers, and underscores');
    }

    if (!email.includes('@')) {
      this.badRequest('Invalid email format');
    }

    if (password.length < 8) {
      this.badRequest('Password must be at least 8 characters');
    }

    // Check if handle or email already exists
    const existing = await this.queryOne(
      'SELECT id FROM players WHERE handle = $1 OR email = $2',
      [handle, email]
    );

    if (existing) {
      this.conflict('Handle or email already taken');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create player
    const player = await this.queryOne(
      `INSERT INTO players (handle, email, password_hash, profile_data)
       VALUES ($1, $2, $3, $4)
       RETURNING id, handle, email, xp, rank, credits, created_at`,
      [handle, email, passwordHash, JSON.stringify({ avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${handle}` })]
    );

    // Generate JWT
    const token = this.generateToken(player);
    const refreshToken = this.generateRefreshToken(player);

    // Store refresh token in Redis
    await this.redis.set(`refresh:${refreshToken}`, player.id, { EX: 30 * 24 * 60 * 60 }); // 30 days

    // Log event
    await this.logEvent('player.registered', { player_id: player.id, handle }, { playerId: player.id });

    return this.created({
      player,
      token,
      refreshToken,
      expiresIn: 15 * 60 // 15 minutes
    });
  }

  /**
   * Login with email/password
   * POST /auth/login
   * Body: { email, password }
   */
  async login(ctx) {
    const { email, password } = ctx.body;

    if (!email || !password) {
      this.badRequest('Missing email or password');
    }

    // Find player
    const player = await this.queryOne(
      `SELECT id, handle, email, password_hash, faction_id, xp, rank, credits, reputation, profile_data, status
       FROM players
       WHERE email = $1`,
      [email]
    );

    if (!player) {
      this.unauthorized('Invalid email or password');
    }

    // Check status
    if (player.status !== 'active') {
      this.forbidden(`Account is ${player.status}`);
    }

    // Verify password
    const valid = await bcrypt.compare(password, player.password_hash);
    if (!valid) {
      this.unauthorized('Invalid email or password');
    }

    // Generate tokens
    const token = this.generateToken(player);
    const refreshToken = this.generateRefreshToken(player);

    // Store refresh token in Redis
    await this.redis.set(`refresh:${refreshToken}`, player.id, { EX: 30 * 24 * 60 * 60 });

    // Update last_seen
    await this.query('UPDATE players SET last_seen = now() WHERE id = $1', [player.id]);

    // Log event
    await this.logEvent('player.logged_in', { player_id: player.id }, { playerId: player.id });

    // Remove password hash from response
    delete player.password_hash;

    return this.success({
      player,
      token,
      refreshToken,
      expiresIn: 15 * 60
    });
  }

  /**
   * Refresh access token
   * POST /auth/refresh
   * Body: { refreshToken }
   */
  async refresh(ctx) {
    const { refreshToken } = ctx.body;

    if (!refreshToken) {
      this.badRequest('Missing refresh token');
    }

    // Check if refresh token exists in Redis
    const playerId = await this.redis.get(`refresh:${refreshToken}`);
    if (!playerId) {
      this.unauthorized('Invalid or expired refresh token');
    }

    // Get player
    const player = await this.queryOne(
      `SELECT id, handle, email, faction_id, xp, rank, credits, reputation, profile_data, status
       FROM players
       WHERE id = $1`,
      [playerId]
    );

    if (!player || player.status !== 'active') {
      this.unauthorized('Invalid player account');
    }

    // Generate new access token
    const token = this.generateToken(player);

    return this.success({
      token,
      expiresIn: 15 * 60
    });
  }

  /**
   * Logout (invalidate refresh token)
   * POST /auth/logout
   * Body: { refreshToken }
   */
  async logout(ctx) {
    const { refreshToken } = ctx.body;

    if (refreshToken) {
      await this.redis.del(`refresh:${refreshToken}`);
    }

    return this.success({ message: 'Logged out successfully' });
  }

  /**
   * Get current user profile
   * GET /auth/me
   * Requires: Authentication
   */
  async me(ctx) {
    const user = await ctx.requireAuth();

    const player = await this.queryOne(
      `SELECT p.id, p.handle, p.email, p.xp, p.rank, p.credits, p.reputation,
              p.profile_data, p.created_at, p.last_seen,
              f.id as faction_id, f.name as faction_name, f.code as faction_code, f.color_primary
       FROM players p
       LEFT JOIN factions f ON p.faction_id = f.id
       WHERE p.id = $1`,
      [user.id]
    );

    if (!player) {
      this.notFound('Player');
    }

    return this.success({ player });
  }

  /**
   * Generate JWT access token
   */
  generateToken(player) {
    return jwt.sign(
      {
        id: player.id,
        handle: player.handle,
        email: player.email,
        faction: player.faction_id
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(player) {
    return nanoid(64);
  }
}
