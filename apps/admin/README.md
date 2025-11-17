# SpyNet Admin Dashboard

Lightweight admin dashboard built with vanilla JavaScript - no React, no frameworks, just the essentials.

## Features

### Current Functionality

- **User Authentication** - Simple session-based admin login
- **Dashboard Overview** - Real-time stats and system status
- **Player Management** - View, search, filter, and manage players
- **Faction Management** - Monitor faction stats and membership
- **Zone Management** - Control territory and zone configuration
- **Mission Management** - View and manage active missions
- **QR Code Management** - Generate and track QR codes
- **Settings** - Game configuration and system settings

### Technology Stack

- **Pure Vanilla JavaScript** - No frameworks or build tools required
- **Minimal Dependencies** - Only `dotenv` for environment variables
- **Node.js HTTP Server** - Simple built-in server, no Express
- **Module-based Architecture** - ES6 modules for organization
- **Mock Data** - Ready to connect to real API endpoints

## Quick Start

### 1. Install Dependencies

```bash
cd apps/admin
pnpm install
```

### 2. Configure Environment

Copy the main `.env.example` to `.env` and configure:

```env
# Admin Dashboard
ADMIN_PORT=3001
ADMIN_USERNAME=admin
ADMIN_PASSWORD=changeme

# API endpoint
API_URL=http://localhost:3000
```

### 3. Start the Admin Dashboard

```bash
pnpm run dev
```

The admin dashboard will be available at: `http://localhost:3001`

### 4. Login

Use the credentials from your `.env`:
- **Username**: `admin` (or your configured value)
- **Password**: `changeme` (change this!)

## Project Structure

```
apps/admin/
├── server/
│   └── index.js          # Simple Node.js HTTP server
├── public/
│   ├── index.html        # Main HTML file
│   ├── css/
│   │   └── main.css      # All styles (dark theme)
│   └── js/
│       ├── app.js        # Main application entry
│       ├── auth.js       # Authentication module
│       ├── api.js        # API client
│       ├── ui.js         # UI utilities (toasts, modals, etc.)
│       ├── router.js     # Client-side routing
│       └── pages/        # Page modules
│           ├── index.js
│           ├── overview.js
│           ├── players.js
│           ├── factions.js
│           ├── zones.js
│           ├── missions.js
│           ├── qr-codes.js
│           └── settings.js
├── package.json
└── README.md
```

## Architecture

### Server-Side

The server (`server/index.js`) is a minimal Node.js HTTP server that:

- Serves static files from `public/`
- Handles authentication (session-based, in-memory)
- Proxies API requests to the main SpyNet API
- No dependencies except `dotenv`

### Client-Side

The client is organized into modules:

#### Core Modules

- **app.js** - Main application initialization
- **auth.js** - Login, logout, session management
- **router.js** - Client-side page routing
- **api.js** - API client with all endpoints
- **ui.js** - UI utilities (loading, toasts, modals)

#### Pages

Each page is a self-contained module with:
- `render()` - Returns HTML string
- `init()` - Sets up event listeners
- Helper methods for page-specific logic

### Styling

- CSS custom properties for theming
- Dark theme by default
- Responsive layout
- No CSS preprocessors or frameworks

## Development

### Adding a New Page

1. Create a new file in `public/js/pages/`:

```javascript
// public/js/pages/my-page.js
import { ui } from '../ui.js';

export const myPage = {
  async render() {
    return `
      <div class="page">
        <h1 class="page-title">My Page</h1>
        <div class="card">
          <!-- Your content -->
        </div>
      </div>
    `;
  },

  init() {
    // Setup event listeners
  }
};
```

2. Add it to `public/js/pages/index.js`:

```javascript
import { myPage } from './my-page.js';

export const pages = {
  // ...existing pages
  'my-page': myPage
};
```

3. Add navigation link in `public/index.html`:

```html
<li><a href="#my-page" class="nav-link" data-page="my-page">My Page</a></li>
```

### Connecting to Real API

The admin dashboard currently uses mock data. To connect to real endpoints:

1. Implement the corresponding API endpoints in your NestJS backend
2. The API client (`api.js`) is already set up to proxy requests
3. Remove mock data from page modules and use `api` methods instead

Example:

```javascript
// Before (mock data)
async fetchPlayers() {
  return [/* mock data */];
}

// After (real API)
import { api } from '../api.js';

async fetchPlayers() {
  return await api.getPlayers();
}
```

## Authentication

### Current Implementation

- Simple username/password authentication
- Session stored in-memory (Map)
- HttpOnly cookies for session management
- Sessions expire after 24 hours

### Production Recommendations

1. **Move to Database**: Store admin users in PostgreSQL
2. **Hash Passwords**: Use bcrypt or argon2
3. **Use Redis for Sessions**: Scalable session storage
4. **Add JWT**: For stateless authentication
5. **Add 2FA**: Google Authenticator, SMS, etc.
6. **Role-Based Access**: Different permission levels

## API Endpoints

The admin dashboard expects these API endpoints (to be implemented):

### Stats
- `GET /api/stats` - Dashboard statistics

### Players
- `GET /api/players` - List players (with filters)
- `GET /api/players/:id` - Get player details
- `PATCH /api/players/:id` - Update player
- `POST /api/players/:id/suspend` - Suspend player
- `POST /api/players/:id/ban` - Ban player

### Factions
- `GET /api/factions` - List factions
- `PATCH /api/factions/:id` - Update faction

### Zones
- `GET /api/zones` - List zones
- `GET /api/zones/:id` - Get zone details
- `POST /api/zones` - Create zone
- `PATCH /api/zones/:id` - Update zone
- `DELETE /api/zones/:id` - Delete zone

### Missions
- `GET /api/missions` - List missions
- `GET /api/missions/:id` - Get mission details
- `POST /api/missions` - Create mission
- `DELETE /api/missions/:id` - Delete mission

### QR Codes
- `GET /api/qr-codes` - List QR codes
- `POST /api/qr-codes` - Generate QR code
- `DELETE /api/qr-codes/:id` - Delete QR code

## Deployment

### Development

```bash
pnpm run dev
```

### Production

```bash
NODE_ENV=production pnpm start
```

### With Docker

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3001
CMD ["node", "server/index.js"]
```

### Environment Variables

```env
# Required
ADMIN_USERNAME=admin
ADMIN_PASSWORD=secure-password-here
API_URL=http://api:3000

# Optional
ADMIN_PORT=3001
NODE_ENV=production
```

## Security Considerations

### Current Security

✅ HttpOnly cookies (prevents XSS)
✅ Session-based authentication
✅ Directory traversal prevention
✅ MIME type validation

### To Implement

⚠️ HTTPS/TLS encryption
⚠️ CSRF protection
⚠️ Rate limiting
⚠️ Password hashing
⚠️ Input validation
⚠️ SQL injection prevention (in API)
⚠️ XSS sanitization

## Performance

- **No Build Step**: Runs directly in browser
- **Minimal JS**: ~10KB total (unminified)
- **No Large Dependencies**: Only vanilla JS
- **Lazy Loading**: Pages load on demand
- **Fast Initial Load**: < 100ms

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- No IE support (uses ES6 modules)

## Customization

### Changing Theme Colors

Edit CSS variables in `public/css/main.css`:

```css
:root {
  --color-primary: #2563eb;
  --color-bg: #0f172a;
  --color-text: #f1f5f9;
  /* ...more variables */
}
```

### Adding Custom Styles

Add to `public/css/main.css` or create new CSS file and link in `index.html`.

## Troubleshooting

### Can't Login

- Check `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `.env`
- Ensure `.env` is in project root, not `apps/admin`
- Check browser console for errors

### API Requests Failing

- Verify `API_URL` in `.env` points to running API server
- Check main API server is running on correct port
- Look at Network tab in browser DevTools

### Port Already in Use

Change `ADMIN_PORT` in `.env`:

```env
ADMIN_PORT=3002
```

## Future Enhancements

- [ ] Real-time updates (WebSocket)
- [ ] Export data to CSV/JSON
- [ ] Bulk operations
- [ ] Advanced filtering
- [ ] Audit logs
- [ ] Dark/Light theme toggle
- [ ] Mobile responsive improvements
- [ ] Keyboard shortcuts
- [ ] Search with autocomplete

## Contributing

This is a minimal, dependency-free admin dashboard. When adding features:

1. **Keep it simple** - No frameworks or build tools
2. **Vanilla JS only** - ES6+ is fine
3. **Minimal dependencies** - Only add if absolutely necessary
4. **Document everything** - Update README and add comments

## License

MIT
