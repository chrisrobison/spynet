#!/usr/bin/env node
/**
 * SpyNet AR - Dynamic API Server
 *
 * Routes HTTP requests dynamically to controller classes:
 * - GET /auth/login → controllers/auth.js → Auth.login()
 * - POST /players → controllers/players.js → Players.create()
 * - GET /players/:id → controllers/players.js → Players.get()
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../../.env' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    }
  }
});

// ============================================================================
// PLUGINS
// ============================================================================

await fastify.register(cors, {
  origin: true,
  credentials: true
});

await fastify.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute'
});

await fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'change-this-secret'
});

// ============================================================================
// DYNAMIC ROUTER
// ============================================================================

/**
 * Parse URL path to extract controller and method
 * Examples:
 *   /auth/login → { controller: 'auth', method: 'login', params: [] }
 *   /players/123 → { controller: 'players', method: 'get', params: ['123'] }
 *   /zones/nearby → { controller: 'zones', method: 'nearby', params: [] }
 */
function parseRoute(path, httpMethod) {
  const parts = path.split('/').filter(Boolean);

  if (parts.length === 0) {
    return { controller: 'health', method: 'check', params: [] };
  }

  const [controllerName, ...rest] = parts;

  // Determine method name from HTTP method and URL structure
  let method;
  let params = [];

  if (rest.length === 0) {
    // /players → GET=list, POST=create, etc.
    const methodMap = {
      GET: 'list',
      POST: 'create',
      PUT: 'update',
      DELETE: 'delete',
      PATCH: 'patch'
    };
    method = methodMap[httpMethod] || 'index';
  } else if (rest.length === 1 && !isNaN(rest[0].replace(/-/g, ''))) {
    // /players/123 → GET=get, PUT=update, DELETE=delete
    params = [rest[0]];
    const methodMap = {
      GET: 'get',
      PUT: 'update',
      DELETE: 'delete',
      PATCH: 'patch'
    };
    method = methodMap[httpMethod] || 'get';
  } else {
    // /players/123/missions or /zones/nearby
    const lastPart = rest[rest.length - 1];
    if (!isNaN(lastPart.replace(/-/g, ''))) {
      // Has ID in path
      params = rest;
      method = 'get';
    } else {
      // Custom action
      method = lastPart;
      params = rest.slice(0, -1);
    }
  }

  return { controller: controllerName, method, params };
}

/**
 * Load and instantiate controller
 */
async function loadController(controllerName) {
  const controllerPath = join(__dirname, 'controllers', `${controllerName}.js`);

  if (!existsSync(controllerPath)) {
    throw new Error(`Controller not found: ${controllerName}`);
  }

  const module = await import(controllerPath);
  const ControllerClass = module.default || module[capitalizeFirst(controllerName)];

  if (!ControllerClass) {
    throw new Error(`Controller class not exported: ${controllerName}`);
  }

  return new ControllerClass();
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ============================================================================
// CATCH-ALL ROUTE HANDLER
// ============================================================================

fastify.all('/*', async (request, reply) => {
  try {
    const { controller: controllerName, method, params } = parseRoute(
      request.url.split('?')[0],
      request.method
    );

    request.log.info(`Route: ${request.method} ${request.url} → ${controllerName}.${method}()`);

    // Load controller
    const controller = await loadController(controllerName);

    // Check if method exists
    if (typeof controller[method] !== 'function') {
      return reply.code(404).send({
        error: {
          code: 'METHOD_NOT_FOUND',
          message: `Method ${method} not found on controller ${controllerName}`,
          available: Object.getOwnPropertyNames(Object.getPrototypeOf(controller))
            .filter(name => name !== 'constructor' && typeof controller[name] === 'function')
        }
      });
    }

    // Build context object
    const ctx = {
      request,
      reply,
      params,
      body: request.body,
      query: request.query,
      headers: request.headers,
      log: request.log,
      // Helper to get authenticated user
      getUser: async () => {
        try {
          const token = request.headers.authorization?.replace('Bearer ', '');
          if (!token) return null;
          return await request.jwtVerify();
        } catch (err) {
          return null;
        }
      },
      // Helper to require authentication
      requireAuth: async () => {
        try {
          await request.jwtVerify();
          return request.user;
        } catch (err) {
          throw reply.code(401).send({
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required'
            }
          });
        }
      }
    };

    // Call controller method
    const result = await controller[method](ctx);

    // Send response if not already sent
    if (!reply.sent) {
      return reply.send(result);
    }
  } catch (error) {
    request.log.error(error);

    if (!reply.sent) {
      return reply.code(error.statusCode || 500).send({
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message || 'An unexpected error occurred',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }
      });
    }
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

fastify.get('/health', async (request, reply) => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  };
});

// ============================================================================
// START SERVER
// ============================================================================

const PORT = process.env.API_PORT || 3000;
const HOST = process.env.API_HOST || '0.0.0.0';

try {
  await fastify.listen({ port: PORT, host: HOST });
  console.log(`
╔═══════════════════════════════════════════════════════╗
║           SpyNet AR - API Server Started              ║
╠═══════════════════════════════════════════════════════╣
║  URL:     http://${HOST}:${PORT}                    ║
║  Env:     ${process.env.NODE_ENV || 'development'}           ║
║  Routing: Dynamic controller-based                    ║
╚═══════════════════════════════════════════════════════╝
  `);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}

// Graceful shutdown
const signals = ['SIGINT', 'SIGTERM'];
signals.forEach(signal => {
  process.on(signal, async () => {
    console.log(`\n${signal} received, shutting down gracefully...`);
    await fastify.close();
    process.exit(0);
  });
});
