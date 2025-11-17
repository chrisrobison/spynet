# SpyNet AR - Getting Started (Lean MVP)

> **Important**: We've pivoted to a Lean MVP approach. This means building a focused, web-first prototype to validate core gameplay before investing in mobile apps or complex features. See [LEAN_MVP_PLAN.md](LEAN_MVP_PLAN.md) for the full strategy.

## Current Status

### ✅ Foundation (Complete)
- **Database Schema**: Full PostgreSQL schema with PostGIS
- **API Server**: Dynamic routing with Fastify
- **Basic Controllers**: Auth, Players, QR codes
- **Admin Dashboard**: UI complete (needs backend connection)
- **LLM Config**: Multi-provider support
- **Docker Setup**: Local development environment

### 🚧 Phase 1: Playable Prototype (In Progress)
**Goal**: One person can play the full game loop in 30 minutes

**What We're Building Next (6 weeks)**:
1. Web frontend with QR scanner
2. Map view with 5 zones (Leaflet.js)
3. 5 pre-written missions
4. Basic faction system
5. Simple progression (XP, ranks)
6. Test with 3 friends

### 📋 Quick Start: Week 1 Tasks

Create these files in `public/components/`:

## Component 1: API Connector
**File**: `public/components/connectors/spynet-api-connector.mjs`

```javascript
import { PanClient } from '/larc/src/components/pan-client.mjs';

class SpynetApiConnector extends HTMLElement {
  pc = new PanClient(this);
  baseUrl = 'http://localhost:3000';

  connectedCallback() {
    // Listen for player.profile.get
    this.pc.subscribe('player.profile.get', async () => {
      const token = localStorage.getItem('spynet_token');
      const res = await fetch(`${this.baseUrl}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success) {
        this.pc.publish({
          topic: 'player.state',
          data: data.data.player,
          retain: true
        });
      }
    });

    // Listen for auth.login requests
    this.pc.subscribe('auth.login.request', async (msg) => {
      const { email, password } = msg.data;
      const res = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('spynet_token', data.data.token);
        localStorage.setItem('spynet_refresh', data.data.refreshToken);

        this.pc.publish({
          topic: 'auth.login.success',
          data: data.data.player
        });
      } else {
        this.pc.publish({
          topic: 'auth.login.error',
          data: data.error
        });
      }
    });

    // Add more API endpoints as needed...
  }
}

customElements.define('spynet-api-connector', SpynetApiConnector);
```

## Component 2: Player HUD
**File**: `public/components/player/spynet-player-hud.mjs`

```javascript
import { PanClient } from '/larc/src/components/pan-client.mjs';

class SpynetPlayerHud extends HTMLElement {
  pc = new PanClient(this);
  player = null;

  connectedCallback() {
    this.attachShadow({ mode: 'open' });

    // Subscribe to player state
    this.pc.subscribe('player.state', (msg) => {
      this.player = msg.data;
      this.render();
    }, { retained: true });

    // Request player data
    this.pc.publish({ topic: 'player.profile.get', data: {} });
  }

  render() {
    if (!this.player) {
      this.shadowRoot.innerHTML = '<div>Loading...</div>';
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          background: var(--color-bg-secondary);
          border-bottom: 1px solid var(--color-border);
        }
        .stat {
          display: flex;
          flex-direction: column;
        }
        .label {
          font-size: 0.75rem;
          color: var(--color-text-secondary);
          text-transform: uppercase;
        }
        .value {
          font-size: 1.25rem;
          font-weight: bold;
        }
      </style>
      <div class="stat">
        <span class="label">Agent</span>
        <span class="value">${this.player.handle}</span>
      </div>
      <div class="stat">
        <span class="label">XP</span>
        <span class="value">${this.player.xp}</span>
      </div>
      <div class="stat">
        <span class="label">Rank</span>
        <span class="value">${this.player.rank}</span>
      </div>
      <div class="stat">
        <span class="label">Credits</span>
        <span class="value">${this.player.credits}</span>
      </div>
    `;
  }
}

customElements.define('spynet-player-hud', SpynetPlayerHud);
```

## Component 3: Main Game Container
**File**: `public/components/core/spynet-game.mjs`

```javascript
import { PanClient } from '/larc/src/components/pan-client.mjs';

class SpynetGame extends HTMLElement {
  pc = new PanClient(this);
  currentView = 'map';

  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.render();

    // Load API connector
    const connector = document.createElement('spynet-api-connector');
    document.body.appendChild(connector);
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
        }
        nav {
          display: flex;
          background: var(--color-bg-secondary);
          border-bottom: 1px solid var(--color-border);
        }
        nav button {
          flex: 1;
          padding: 1rem;
          background: none;
          border: none;
          color: var(--color-text-secondary);
          cursor: pointer;
        }
        nav button.active {
          color: var(--color-text-primary);
          border-bottom: 2px solid var(--color-info);
        }
        main {
          flex: 1;
          overflow-y: auto;
        }
      </style>

      <spynet-player-hud></spynet-player-hud>

      <nav>
        <button class="active" data-view="map">🗺️ Map</button>
        <button data-view="missions">🎯 Missions</button>
        <button data-view="scan">📷 Scan</button>
        <button data-view="profile">👤 Profile</button>
      </nav>

      <main>
        <div class="view-map">
          <spynet-zone-map></spynet-zone-map>
        </div>
        <div class="view-missions" style="display:none">
          <spynet-mission-list></spynet-mission-list>
        </div>
        <div class="view-scan" style="display:none">
          <spynet-qr-scanner></spynet-qr-scanner>
        </div>
        <div class="view-profile" style="display:none">
          <spynet-player-profile></spynet-player-profile>
        </div>
      </main>
    `;

    // Add navigation handlers
    this.shadowRoot.querySelectorAll('nav button').forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        this.switchView(view);
      });
    });
  }

  switchView(view) {
    this.currentView = view;

    // Update active button
    this.shadowRoot.querySelectorAll('nav button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });

    // Show/hide views
    this.shadowRoot.querySelectorAll('main > div').forEach(div => {
      div.style.display = div.classList.contains(`view-${view}`) ? 'block' : 'none';
    });
  }
}

customElements.define('spynet-game', SpynetGame);
```

## Component 4: QR Scanner
**File**: `public/components/qr/spynet-qr-scanner.mjs`

```javascript
import { PanClient } from '/larc/src/components/pan-client.mjs';

class SpynetQrScanner extends HTMLElement {
  pc = new PanClient(this);
  stream = null;
  scanning = false;

  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  async startScan() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      const video = this.shadowRoot.querySelector('video');
      video.srcObject = this.stream;
      this.scanning = true;

      // Use jsQR library to decode
      // Import dynamically: const jsQR = await import('https://esm.sh/jsqr');
      // this.scanFrame(video);

    } catch (error) {
      alert('Camera access denied');
    }
  }

  stopScan() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.scanning = false;
    }
  }

  async handleScan(qrData) {
    // Send to API for validation
    const position = await new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(resolve);
    });

    this.pc.publish({
      topic: 'qr.scan.validate',
      data: {
        jwt: qrData,
        location: {
          lat: position.coords.latitude,
          lon: position.coords.longitude
        }
      }
    });

    this.stopScan();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; padding: 1rem; }
        video { width: 100%; max-width: 500px; border-radius: 0.5rem; }
        button { margin-top: 1rem; padding: 0.75rem 1.5rem; }
      </style>

      <div>
        <h2>QR Scanner</h2>
        <video autoplay playsinline></video>
        <button id="start-btn">Start Scanning</button>
        <button id="stop-btn" style="display:none">Stop</button>
      </div>
    `;

    this.shadowRoot.querySelector('#start-btn').onclick = () => this.startScan();
    this.shadowRoot.querySelector('#stop-btn').onclick = () => this.stopScan();
  }
}

customElements.define('spynet-qr-scanner', SpynetQrScanner);
```

## Local Development Setup

### 1. Prerequisites
```bash
# Required
- Node.js 22+
- PostgreSQL 16 (or use Docker)
- pnpm 9+

# Optional (for local AI)
- Ollama (for local LLM)
```

### 2. Clone and Install
```bash
cd /home/cdr/domains/cdr2.com/www/spynet
cp .env.example .env
# Edit .env with your settings

pnpm install
```

### 3. Start Database
```bash
# Option A: Use Docker Compose
docker compose up -d

# Option B: Use local PostgreSQL
createdb spynet
psql spynet < scripts/db/init.sql
psql spynet < scripts/db/schema.sql
```

### 4. Start API Server
```bash
cd services/api
pnpm install
pnpm run dev

# Should see:
# ╔═══════════════════════════════════════════╗
# ║   SpyNet AR - API Server Started          ║
# ║   URL: http://0.0.0.0:3000                ║
# ╚═══════════════════════════════════════════╝
```

### 5. Start Frontend (Development)
```bash
# Option A: Simple HTTP server
cd public
python3 -m http.server 8080

# Option B: Use live-server (with auto-reload)
cd public
npx live-server --port=8080

# Open: http://localhost:8080
```

## Creating a Symlink to LARC

```bash
cd /home/cdr/domains/cdr2.com/www/spynet/public
ln -s /home/cdr/cdr2/larc larc
```

## Testing the API

```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"handle":"testuser","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get Profile (use token from login)
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Phase 1 Implementation Guide

**See [LEAN_MVP_PLAN.md](LEAN_MVP_PLAN.md) for the complete 20-week roadmap.**

### Week 1: Authentication (Current)
- [ ] Complete auth endpoints (register, login, me)
- [ ] Build login/signup UI components
- [ ] Test JWT token flow
- [ ] Implement session persistence

### Week 2: Map & Zones
- [ ] Integrate Leaflet.js map
- [ ] Define 5 zones in your city
- [ ] Insert zones into database
- [ ] Display zones on map with faction colors
- [ ] Show player location

### Week 3: QR System
- [ ] Generate 5 QR codes (signed JWTs)
- [ ] Build QR scanner component (jsQR)
- [ ] Implement scan validation endpoint
- [ ] Test location proximity (100m radius)
- [ ] Print and place QR codes physically

### Week 4: Missions & Rewards
- [ ] Create 5 mission records in database
- [ ] Display mission briefing after scan
- [ ] Award XP and credits
- [ ] Update zone contribution
- [ ] Show reward confirmation

### Week 5: Progression & Social
- [ ] Build player profile page
- [ ] Implement leaderboard
- [ ] Add faction selector on signup
- [ ] Display faction comparison
- [ ] Show zone control visualization

### Week 6: Polish & Test
- [ ] Mobile responsive design
- [ ] Error handling throughout
- [ ] Loading states
- [ ] PWA manifest and service worker
- [ ] **Test with 3 friends**
- [ ] Fix bugs based on feedback

### Success Metrics (End of Week 6)
- [ ] You personally enjoy playing it
- [ ] 3 friends try it and 2 return
- [ ] Average 3+ missions completed
- [ ] Zero critical bugs in core loop

**If successful, proceed to Phase 2 (Weeks 7-12)**

## Architecture Flow

```
User Action → Web Component → PAN Bus Topic → API Connector → HTTP Request → Backend Controller → Database

Example: Scanning QR Code
1. User clicks "Scan" button
2. spynet-qr-scanner captures QR code
3. Publishes: qr.scan.validate { jwt, location }
4. spynet-api-connector listens
5. Sends: POST /qr/scan
6. Qr controller validates
7. Returns rewards
8. Publishes: qr.scan.success { rewards }
9. UI updates with rewards
```

## File Structure Summary

```
spynet/
├── services/api/          ✅ Backend API
│   ├── index.js          ✅ Dynamic router
│   ├── controllers/      ✅ Auth, Players, QR
│   └── package.json      ✅
├── scripts/db/           ✅ Database
│   ├── init.sql          ✅
│   └── schema.sql        ✅
├── public/               ✅ Frontend
│   ├── index.html        ✅ Main HTML
│   ├── manifest.json     ✅ PWA manifest
│   ├── sw.js             ✅ Service worker
│   ├── assets/css/       ✅ Theme CSS
│   └── components/       ⏳ Web components (build these!)
├── docker-compose.yml    ✅ PostgreSQL + Redis
└── .env.local            ✅ Configuration
```

You now have a solid foundation! Start by creating the web components listed above and test the complete flow.
