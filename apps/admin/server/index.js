import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../../.env' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, '../public');

const PORT = process.env.ADMIN_PORT || 3001;
const API_URL = process.env.API_URL || 'http://localhost:3000';

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Simple session store (in-memory, replace with Redis in production)
const sessions = new Map();

// Admin credentials (TODO: move to database)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme';

function generateSessionId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function getSession(req) {
  const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {});

  const sessionId = cookies?.session;
  return sessionId ? sessions.get(sessionId) : null;
}

function setSession(res, sessionId) {
  res.setHeader('Set-Cookie', `session=${sessionId}; HttpOnly; Path=/; Max-Age=86400`);
}

function requireAuth(req, res) {
  const session = getSession(req);
  if (!session) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return false;
  }
  return true;
}

// API proxy handler
async function proxyToAPI(req, res, endpoint) {
  if (!requireAuth(req, res)) return;

  try {
    const url = `${API_URL}${endpoint}`;
    const options = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      let body = '';
      req.on('data', chunk => body += chunk);
      await new Promise(resolve => req.on('end', resolve));
      options.body = body;
    }

    const apiRes = await fetch(url, options);
    const data = await apiRes.text();

    res.writeHead(apiRes.status, { 'Content-Type': 'application/json' });
    res.end(data);
  } catch (error) {
    console.error('API proxy error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}

// Request handler
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  console.log(`${req.method} ${pathname}`);

  // API routes
  if (pathname.startsWith('/api/')) {
    const endpoint = pathname.replace('/api', '');

    // Auth endpoints (no auth required)
    if (pathname === '/api/auth/login' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const { username, password } = JSON.parse(body);

          if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            const sessionId = generateSessionId();
            sessions.set(sessionId, { username, createdAt: Date.now() });

            setSession(res, sessionId);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, username }));
          } else {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid credentials' }));
          }
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid request' }));
        }
      });
      return;
    }

    if (pathname === '/api/auth/logout' && req.method === 'POST') {
      const session = getSession(req);
      if (session) {
        const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          acc[key] = value;
          return acc;
        }, {});
        sessions.delete(cookies.session);
      }

      res.setHeader('Set-Cookie', 'session=; HttpOnly; Path=/; Max-Age=0');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
      return;
    }

    if (pathname === '/api/auth/check' && req.method === 'GET') {
      const session = getSession(req);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ authenticated: !!session, username: session?.username }));
      return;
    }

    // Protected API endpoints - proxy to main API
    await proxyToAPI(req, res, endpoint);
    return;
  }

  // Static file serving
  let filePath = pathname === '/' ? '/index.html' : pathname;
  filePath = path.join(publicDir, filePath);

  // Security: prevent directory traversal
  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  const extname = path.extname(filePath);
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`SpyNet Admin Dashboard running on http://localhost:${PORT}`);
  console.log(`API proxy target: ${API_URL}`);
  console.log(`Admin username: ${ADMIN_USERNAME}`);
});
