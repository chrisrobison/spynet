# Admin Dashboard Setup Guide

Quick guide to get the SpyNet admin dashboard up and running.

## Prerequisites

- Node.js 22+ installed
- PostgreSQL running (for admin user storage)
- Main SpyNet API (optional, for live data)

## Quick Start (5 minutes)

### 1. Configure Environment

```bash
# From project root
cp .env.example .env
```

Edit `.env` and set admin credentials:

```env
# Admin Dashboard
ADMIN_PORT=3001
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password-here
API_URL=http://localhost:3000
```

### 2. Install Dependencies

```bash
cd apps/admin
pnpm install
```

### 3. Set Up Admin Database (Optional)

For production, set up admin user database:

```bash
psql -U spynet -d spynet -f ../../scripts/db/admin-schema.sql
```

This creates:
- `admin_users` - Admin accounts
- `admin_sessions` - Session management
- `admin_audit_log` - Audit trail
- `admin_permissions` - Fine-grained permissions

Default admin user:
- Username: `admin`
- Password: `changeme`
- Role: `super_admin`

**⚠️ IMPORTANT: Change the default password immediately!**

### 4. Start the Dashboard

```bash
pnpm run dev
```

Dashboard will be available at: `http://localhost:3001`

### 5. Login

Navigate to `http://localhost:3001` and login with:
- Username: `admin` (or your configured username)
- Password: Your configured password

## Features

### Current Pages

1. **📊 Overview** - Dashboard with stats and system status
2. **👥 Players** - User management, search, filter, suspend/ban
3. **⚔️ Factions** - Faction stats and configuration
4. **🗺️ Zones** - Territory control management
5. **🎯 Missions** - Mission oversight and creation
6. **📱 QR Codes** - QR code generation and tracking
7. **⚙️ Settings** - System configuration

### Data Status

**Current**: Using mock data for demonstration
**Next Step**: Connect to real API endpoints

## Connecting to Real API

The admin dashboard is ready to connect to your NestJS API. The client is configured to proxy requests through the admin server to your main API.

### API Endpoints Needed

See `apps/admin/README.md` for full list of required endpoints.

Key endpoints:
- `GET /v1/stats` - Dashboard statistics
- `GET /v1/players` - List players
- `GET /v1/factions` - List factions
- `GET /v1/zones` - List zones
- `GET /v1/missions` - List missions

### Updating Pages

To use real data instead of mocks, update the fetch methods in each page:

```javascript
// Before (mock)
async fetchPlayers() {
  return [/* mock data */];
}

// After (real API)
import { api } from '../api.js';

async fetchPlayers() {
  try {
    return await api.getPlayers();
  } catch (error) {
    ui.showToast('Failed to load players', 'error');
    return [];
  }
}
```

## Architecture

### Simple & Lightweight

- **No React, No Frameworks**: Pure vanilla JavaScript
- **No Build Step**: Runs directly in browser
- **Minimal Dependencies**: Only `dotenv` for server
- **Fast**: ~10KB total JavaScript

### How It Works

1. **Server** (`server/index.js`):
   - Serves static files
   - Handles authentication
   - Proxies API requests

2. **Client** (vanilla JS modules):
   - `app.js` - Main app
   - `auth.js` - Authentication
   - `router.js` - Page routing
   - `api.js` - API client
   - `ui.js` - UI utilities
   - `pages/*` - Individual pages

## Security

### Current Implementation

✅ Session-based authentication
✅ HttpOnly cookies
✅ Password protection
✅ Simple access control

### Production Recommendations

Implement before going to production:

1. **HTTPS**: Enable TLS encryption
2. **Password Hashing**: Use bcrypt (see admin-schema.sql)
3. **Redis Sessions**: Replace in-memory sessions
4. **CSRF Protection**: Add CSRF tokens
5. **Rate Limiting**: Prevent brute force
6. **Audit Logging**: Track all admin actions
7. **2FA**: Add two-factor authentication
8. **IP Whitelist**: Restrict admin access by IP

### Changing Admin Password

#### Method 1: Environment Variable (Development)

Edit `.env`:
```env
ADMIN_PASSWORD=new-secure-password
```

Restart server.

#### Method 2: Database (Production)

```sql
-- Generate bcrypt hash for your password
-- (use bcrypt library in Node.js or online tool)

UPDATE admin_users
SET password_hash = '$2b$10$YOUR_BCRYPT_HASH_HERE'
WHERE username = 'admin';
```

## Customization

### Changing Theme

Edit `public/css/main.css`:

```css
:root {
  --color-primary: #your-color;
  --color-bg: #your-bg-color;
  /* ...more variables */
}
```

### Adding Admin Users

In production with database:

```sql
INSERT INTO admin_users (username, password_hash, email, role)
VALUES (
  'newadmin',
  '$2b$10$...', -- bcrypt hash
  'newadmin@example.com',
  'admin' -- or 'moderator', 'viewer'
);
```

### Admin Roles

- **super_admin**: Full access, can manage other admins
- **admin**: Manage game content and players
- **moderator**: View and moderate content, limited edits
- **viewer**: Read-only access

## Development

### File Structure

```
apps/admin/
├── server/index.js       # HTTP server
├── public/
│   ├── index.html        # Main page
│   ├── css/main.css      # Styles
│   └── js/
│       ├── app.js        # App entry
│       ├── auth.js       # Auth module
│       ├── api.js        # API client
│       ├── ui.js         # UI utilities
│       ├── router.js     # Routing
│       └── pages/        # Page modules
└── package.json
```

### Adding a New Page

1. Create `public/js/pages/your-page.js`
2. Export page object with `render()` and `init()`
3. Add to `public/js/pages/index.js`
4. Add nav link in `public/index.html`

See `apps/admin/README.md` for detailed instructions.

## Deployment

### Development

```bash
cd apps/admin
pnpm run dev
```

### Production

```bash
NODE_ENV=production pnpm start
```

### Docker

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY apps/admin/package*.json ./
RUN npm install --production
COPY apps/admin/ ./
EXPOSE 3001
CMD ["node", "server/index.js"]
```

### Environment Variables

Required:
- `ADMIN_USERNAME` - Admin username
- `ADMIN_PASSWORD` - Admin password
- `API_URL` - Main API endpoint

Optional:
- `ADMIN_PORT` - Port (default: 3001)
- `NODE_ENV` - Environment (development/production)

## Troubleshooting

### Can't Login

**Issue**: Invalid credentials

**Solution**:
1. Check `.env` file in project root
2. Verify `ADMIN_USERNAME` and `ADMIN_PASSWORD`
3. Restart admin server after changing `.env`

### API Requests Fail

**Issue**: 401/500 errors on API calls

**Solution**:
1. Verify `API_URL` in `.env`
2. Ensure main API server is running
3. Check browser DevTools Network tab
4. Verify API endpoints exist

### Port Already in Use

**Issue**: Port 3001 is already taken

**Solution**:
Change port in `.env`:
```env
ADMIN_PORT=3002
```

### Sessions Not Persisting

**Issue**: Logged out after refresh

**Solution**:
- Current implementation uses in-memory sessions
- For production, implement Redis session store
- See "Production Recommendations" above

## Next Steps

1. ✅ Get admin dashboard running
2. ⬜ Change default admin password
3. ⬜ Implement API endpoints in NestJS
4. ⬜ Connect pages to real API
5. ⬜ Set up admin database schema
6. ⬜ Implement proper authentication
7. ⬜ Add audit logging
8. ⬜ Deploy to production

## Support

- **Documentation**: `apps/admin/README.md`
- **API Reference**: Check `public/js/api.js` for endpoint list
- **Issues**: GitHub Issues

## Resources

- [Admin Dashboard README](../apps/admin/README.md)
- [Database Schema](../scripts/db/admin-schema.sql)
- [Main Project Docs](../docs/)

---

**Remember**: The default password is `changeme` - change it immediately!
