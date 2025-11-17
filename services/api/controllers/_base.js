/**
 * Base Controller
 * All controllers extend this class to get common functionality
 */

import pg from 'pg';
import { createClient } from 'redis';

const { Pool } = pg;

export default class BaseController {
  constructor() {
    // Initialize database pool (shared across all instances)
    if (!BaseController.db) {
      BaseController.db = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
    }

    // Initialize Redis client (shared)
    if (!BaseController.redis) {
      BaseController.redis = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });
      BaseController.redis.connect().catch(console.error);
    }
  }

  /**
   * Get database pool
   */
  get db() {
    return BaseController.db;
  }

  /**
   * Get Redis client
   */
  get redis() {
    return BaseController.redis;
  }

  /**
   * Execute a database query
   */
  async query(sql, params = []) {
    const client = await this.db.connect();
    try {
      const result = await client.query(sql, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Execute a query and return first row
   */
  async queryOne(sql, params = []) {
    const rows = await this.query(sql, params);
    return rows[0] || null;
  }

  /**
   * Execute a query in a transaction
   */
  async transaction(callback) {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Log event to events table
   */
  async logEvent(eventType, payload, { playerId, zoneId, factionId } = {}) {
    await this.query(
      `INSERT INTO events (event_type, player_id, zone_id, faction_id, payload)
       VALUES ($1, $2, $3, $4, $5)`,
      [eventType, playerId, zoneId, factionId, JSON.stringify(payload)]
    );
  }

  /**
   * Error helpers
   */
  badRequest(message, details = {}) {
    const error = new Error(message);
    error.statusCode = 400;
    error.code = 'BAD_REQUEST';
    error.details = details;
    throw error;
  }

  unauthorized(message = 'Authentication required') {
    const error = new Error(message);
    error.statusCode = 401;
    error.code = 'UNAUTHORIZED';
    throw error;
  }

  forbidden(message = 'Access forbidden') {
    const error = new Error(message);
    error.statusCode = 403;
    error.code = 'FORBIDDEN';
    throw error;
  }

  notFound(resource = 'Resource') {
    const error = new Error(`${resource} not found`);
    error.statusCode = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  conflict(message, details = {}) {
    const error = new Error(message);
    error.statusCode = 409;
    error.code = 'CONFLICT';
    error.details = details;
    throw error;
  }

  /**
   * Pagination helper
   */
  paginate(query, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    return {
      limit,
      offset,
      page
    };
  }

  /**
   * Success response helpers
   */
  success(data, meta = {}) {
    return { success: true, data, ...meta };
  }

  created(data) {
    return { success: true, data, created: true };
  }
}
