# SpyNet AR – Tech Stack & Architecture

## Philosophy: Start Simple, Scale Smart

This document describes our **Lean MVP architecture** - a minimal, cost-effective stack that validates gameplay before investing in complex infrastructure.

**See [LEAN_MVP_PLAN.md](../LEAN_MVP_PLAN.md) for implementation roadmap.**

---

## Phase 1: Lean MVP (Weeks 1-6)

**Budget**: $25 (QR codes + domain)
**Goal**: Playable prototype with 5 missions

### Frontend Stack

#### Web-Only (No Native Apps)
- **Framework**: Vanilla JavaScript + Web Components
- **Why**: Zero build step = instant iteration
- **Architecture**: LARC pattern (event-driven web components)
- **Bundle Size**: ~10KB unminified
- **Browser Support**: Modern browsers only (Chrome 90+, Safari 14+)

#### Key Libraries
```javascript
// Maps
import L from 'https://esm.sh/leaflet@1.9.4';

// QR Scanning
import jsQR from 'https://esm.sh/jsqr@1.4.0';

// HTTP Client
fetch() // Native browser API

// State Management
localStorage // Browser API
PanClient // LARC event bus
```

#### No Build Tools
- No webpack, no vite, no rollup
- No transpilation, no bundling
- ES6 modules loaded directly
- Faster development, simpler debugging

### Backend Stack

#### Single Monolithic API
- **Server**: Fastify (Node.js 22)
- **Why Fastify**: Fast, low overhead, good TypeScript support
- **Pattern**: Dynamic controller routing (no manual route definitions)
- **Request Flow**:
  ```
  GET /players/123 → PlayersController.get(ctx)
  POST /qr/scan → QrController.scan(ctx)
  ```

#### Auth
- **Strategy**: JWT tokens (HS256)
- **Storage**: Redis for session blacklist
- **Flow**:
  1. POST /auth/register → Create account
  2. POST /auth/login → Return JWT + refresh token
  3. Include `Authorization: Bearer <token>` in requests
- **No OAuth yet** (add in Phase 2 if needed)

#### AI Integration (Minimal)
- **Purpose**: Generate mission briefing variations only
- **Model**: OpenAI GPT-3.5 or local Ollama
- **Cost Control**:
  - Heavy caching (1 hour TTL)
  - Fallback to templates if API fails
  - Max 100 tokens per generation
  - Target: <$20/month
- **Example**:
  ```javascript
  const briefing = await llm.chat({
    model: 'gpt-3.5-turbo',
    messages: [{
      role: 'system',
      content: 'Write a 2-sentence spy mission briefing. Terse and urgent.'
    }, {
      role: 'user',
      content: `Mission: Retrieve intel from ${location}`
    }],
    max_tokens: 100,
    temperature: 0.8
  });
  ```

### Database Stack

#### PostgreSQL 16 (Primary)
- **Extensions**: PostGIS for geospatial
- **Schema**: Already defined (see `scripts/db/schema.sql`)
- **Key Tables**: players, zones, missions, qr_codes, mission_completions
- **Hosting**: Docker Compose locally, DigitalOcean managed DB in production

#### Geospatial Queries
```sql
-- Find zone containing a point
SELECT * FROM zones
WHERE ST_Contains(
  polygon,
  ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography
);

-- Check if player is within 100m of QR code
SELECT ST_Distance(
  qr_codes.location,
  ST_SetSRID(ST_MakePoint(player_lon, player_lat), 4326)::geography
) < 100;
```

#### Redis 7 (Caching)
- **Purpose**:
  - Session storage
  - Rate limiting
  - AI response cache
  - Temporary game state
- **Data Structures**:
  - `session:{token}` → Player ID (TTL: 7 days)
  - `ratelimit:{ip}:{endpoint}` → Request count (TTL: 1 minute)
  - `llm:briefing:{mission_id}:{faction}` → Cached briefing (TTL: 1 hour)

### Infrastructure (Development)

#### Local Development
```yaml
# docker-compose.yml
services:
  postgres:
    image: postgis/postgis:16-3.4
    ports: [5432:5432]
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports: [6379:6379]
```

#### Production (Phase 1)
- **Hosting**: Single VPS ($20/month)
  - DigitalOcean Droplet (4GB RAM, 2 vCPU)
  - OR Hetzner Cloud (cheaper)
- **Database**: Managed PostgreSQL ($15/month)
- **Process Management**: PM2 (not Docker/K8s)
- **SSL**: Let's Encrypt (free)
- **Domain**: Cloudflare DNS (free tier)
- **Total**: ~$40/month

### What We're NOT Building (Phase 1)

❌ **No Mobile Apps** - Web-first validation
❌ **No AR** - Map-based gameplay
❌ **No BLE** - Manual player encounters
❌ **No Microservices** - Monolith is simpler
❌ **No Kubernetes** - Overkill for <100 users
❌ **No Real-time WebSockets** - Polling is fine
❌ **No Analytics DB** - Postgres is enough
❌ **No Object Storage** - No uploaded content yet
❌ **No CI/CD** - Manual deploy is fine for MVP

---

## Phase 2: Multiplayer Beta (Weeks 7-12)

**Budget**: $150/month
**Goal**: 10-20 active players with faction competition

### New Requirements
- Higher availability (uptime monitoring)
- Better performance (CDN for static assets)
- Social features (see other players)
- More content (20 missions, 10 zones)

### Infrastructure Upgrades
- **CDN**: Cloudflare (free tier) for `public/` assets
- **Monitoring**: UptimeRobot (free tier)
- **Logging**: Papertrail or Loki (free tier)
- **Backups**: Automated daily DB backups to S3 ($5/month)

### Still No Need For:
- Kubernetes
- Microservices
- Dedicated analytics DB
- Mobile apps

---

## Phase 3: Public Launch (Weeks 13-20)

**Budget**: $200-300/month
**Goal**: 50-100 active players

### Infrastructure Scaling
- **Horizontal Scaling**: 2x app servers behind load balancer
- **Database**: Read replicas for leaderboards
- **CDN**: Cloudflare Pro ($20/month) for better caching
- **Monitoring**: DataDog or New Relic ($50/month)
- **LLM**: Increase budget to $100/month
- **Total**: ~$250/month

### Optional Additions
- **WebSockets**: For real-time leaderboard updates
- **Job Queue**: BullMQ for async tasks
- **Analytics**: Plausible or Simple Analytics ($10/month)

### Still Deferring:
- Native mobile apps (until validated)
- AR features (until validated)
- Microservices (monolith working fine)
- Kubernetes (not needed yet)

---

## Future Architecture (Post-MVP Success)

Only pursue if Phase 3 succeeds (50+ WAU, 40% D7 retention).

### When to Scale Up

**Mobile Apps** - If web UX becomes limiting
- React Native + Expo
- Native QR scanning (better than browser)
- Push notifications
- Offline gameplay

**AR Features** - If players ask for it
- ARKit/ARCore integration
- 3D item visualization
- Spatial anchors

**Microservices** - If monolith becomes bottleneck (>1000 DAU)
- Split by domain: Auth, Players, Missions, Zones
- Use NestJS for consistency
- Deploy to Kubernetes (GKE)

**Real-time Systems** - If competition demands it
- WebSocket with Socket.IO
- Redis Pub/Sub
- Zone update broadcasts

**Advanced AI** - If it adds significant value
- Procedural mission generation
- Adaptive difficulty
- Dynamic narrative
- Voice missions

**Multi-City** - If one city is saturated
- Database sharding by geography
- Regional deployments
- City-specific content

### Cost at Scale (1000 DAU)
- Infrastructure: $500-1000/month
- LLM API: $200-500/month
- Monitoring/Logging: $100/month
- CDN/Bandwidth: $100/month
- **Total**: ~$1000-2000/month

Still far cheaper than original plan ($10-30K/month).

## 3. Data Model (Core Tables)

### Players
```sql
CREATE TABLE players (
  id UUID PRIMARY KEY,
  handle TEXT UNIQUE NOT NULL,
  auth_user_id TEXT UNIQUE NOT NULL,
  public_key BYTEA NOT NULL,
  faction_id UUID NULL,
  rank SMALLINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Factions
```sql
CREATE TABLE factions (
  id UUID PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  lore JSONB NOT NULL DEFAULT '{}'
);
```

### Zones (Geofenced Control Areas)
```sql
CREATE TABLE zones (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  polygon GEOGRAPHY(POLYGON, 4326) NOT NULL,
  control_faction_id UUID NULL,
  control_score JSONB NOT NULL DEFAULT '{"obsidian":0,"aurora":0,"citadel":0}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX zones_polygon_idx ON zones USING GIST(polygon);
```

### Missions
```sql
CREATE TABLE missions (
  id UUID PRIMARY KEY,
  kind TEXT NOT NULL, -- qr_scan|surveillance|cipher|raid|drop|remote_analysis
  payload JSONB NOT NULL,
  zone_id UUID NULL,
  issuer TEXT NOT NULL, -- ai|system|player
  expires_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Mission Assignments
```sql
CREATE TABLE mission_assignments (
  mission_id UUID REFERENCES missions(id),
  player_id UUID REFERENCES players(id),
  status TEXT NOT NULL DEFAULT 'assigned',
  -- assigned|in_progress|succeeded|failed|expired
  progress JSONB NOT NULL DEFAULT '{}',
  PRIMARY KEY (mission_id, player_id)
);
```

### QR Codes
```sql
CREATE TABLE qr_codes (
  id UUID PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, -- base32/qr string id
  signed_jwt TEXT NOT NULL,
  zone_id UUID NULL,
  creator_player_id UUID NULL,
  active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ NULL
);
```

### Events (Append-Only Analytics)
```sql
CREATE TABLE events (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  player_id UUID NULL,
  zone_id UUID NULL,
  payload JSONB NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- Note: Consider migrating this to ClickHouse for better analytics performance
```

### Redis Keys (Examples)

```
presence:<zoneId>          → set of ephemeral player ids
ble:token:<playerId>       → rolling beacon token (ttl 120s)
zone:meter:<zoneId>        → {obsidian: int, aurora: int, citadel: int}
qr:rate:<playerId>         → sliding window for rate limiting
```

## 4. Security, Anti-Cheat, Privacy

### Device Keys
- Generate device ECC key pair
- Server issues device-bound session (DPoP-style proof-of-possession) for sensitive calls

### Location Attestation
- Require both GPS + Wi-Fi SSID fingerprints (hashed locally) for high-stakes actions
- Optional Android SafetyNet/Play Integrity + iOS DeviceCheck

### BLE Privacy
- Ephemeral rotating beacon identifiers (EIDs) derived from `HMAC(device_secret, epoch)`
- Never broadcast PII

### QR Integrity
- Signed JWT payloads (ES256) with nonce, zone, mission, issuer, exp
- Server replays blocked by Redis bloom filter

### Transport
- mTLS between services
- TLS 1.3 to clients
- All JWTs short-lived (15m) + refresh with rotating key set (JWKS)

### Abuse/Detection
- Anomaly rules in ClickHouse (speed hacks, impossible zone hops, scan bursts)
- Shadow-ban pipeline and challenge missions (e.g., camera AR verification) for flagged accounts

### Privacy
- Differential privacy for public leaderboards
- Coarse location (100-300m) outside live missions
- Data retention policy by event type

## 5. Proximity & Control Zones

### BLE Presence

**Advertise**:
- Ephemeral 16-byte service data `(eph_id, ts)`
- Rotate every 60s

**Scan**:
- Collect nearby `eph_ids`
- Send hashed batch to Proximity Service
- Server resolves to player ids for mutual consented encounters

### Control Meter Update Rule

Per zone, every 30s:

```
score_delta = w_agents * agents_present +
              w_missions * missions_completed +
              w_qr * qr_scans +
              w_pvp * encounter_outcomes +
              w_remote * remote_ops
```

Weights tuned by season; stored in Config Service.

### Capture Rule
Maintain leading score > threshold for `capture_window` (e.g., 24h) → set `control_faction_id` and emit narrative event.

## 6. QR Payload Spec

```json
{
  "qr_id": "Q7MX93",
  "zone": "mission-dolores",
  "type": "mission",
  "mission_id": "3f7f...",
  "issuer": "ai",
  "nonce": "b64-16",
  "exp": 1730947200,
  "sig": "(JWT ES256 over header.payload)"
}
```

### Verification Flow
1. Check JWT signature
2. Verify nonce not seen (Redis bloom filter)
3. Validate zone policy
4. Execute mission state mutation

## 7. API (Selected Endpoints)

```
POST /v1/auth/magic/start        { email }
POST /v1/auth/magic/verify       { token } → { access_token, refresh_token }
GET  /v1/player/me               → profile, inventory, dossier
POST /v1/presence/beacon         { eph_ids:[] } → { nearby:[{player_id, strength}], missions:[] }
GET  /v1/zones/near?lat&lon      → zones + control meters
POST /v1/qr/scan                 { qr_id, jwt, lat, lon, wifi_hash } → mission result
POST /v1/missions/accept         { mission_id }
POST /v1/missions/progress       { mission_id, patch }
POST /v1/missions/complete       { mission_id }
GET  /v1/factions/state          → global + city snapshot
```

All responses signed with response MAC header for tamper evidence (optional).

## 8. LLM Orchestrator (Agents & Tools)

### Runtime
- **Framework**: FastAPI + LangGraph/TaskWeaver-style tool graph

### Core Tools

```python
get_player_context(player_id) → skill profile, recent actions
get_zone_snapshot(city|zone) → control meters, heatmap
issue_mission(player_id, spec) → writes mission + assignment
message_players(list, payload) → narrative briefs/broadcasts
score_event(event) → updates weights for adaptive tuning
query_kb(query_text) → RAG retrieval from game docs
simulate_player_action(sim_id, action) → sandbox only
create_agent(profile) / schedule_agent(agent_id, plan) → spawner
```

### Mission Spec Schema

```json
{
  "kind": "cipher|qr_scan|surveillance|raid|drop|remote_analysis",
  "difficulty": 1,
  "zone": "mission-dolores",
  "objectives": [
    { "type": "qr_scan", "qr_id": "Q7MX93" },
    { "type": "time_window", "between": ["17:00","20:00","America/Los_Angeles"] }
  ],
  "rewards": {
    "xp": 120,
    "credits": 30,
    "faction": {"aurora": 10}
  },
  "expires_in": 14400
}
```

### Guardrails
- JSON schema validation
- Policy sandbox (no unsafe content, no real-world trespass)
- Time-of-day constraints
- Safety zones blacklist

## 9. Observability & Ops

### Logging
- **Stack**: OpenTelemetry → Grafana Loki

### Metrics
- **Stack**: Prometheus → Grafana dashboards

### Tracing
- **Stack**: OTLP → Tempo

### Error Tracking
- **Tool**: Sentry (client + server) for crash/error tracking

### Alerting
- **Tool**: Grafana OnCall + Slack webhook

### Feature Flags/Config
- **Store**: Config Service (Postgres) + CDN edge cache
- **Propagation**: Changes emit to clients via WebSocket

## 10. CI/CD & Environments

### CI
- **Platform**: GitHub Actions
- **Tests**:
  - Typecheck
  - Unit tests
  - Integration tests (Testcontainers)
  - Mobile E2E (Detox)
  - Web E2E (Playwright)

### CD
- **K8s**: ArgoCD to GKE
- **Mobile**: Fastlane/TestFlight + Internal App Sharing

### Environments
- **dev**: Ephemeral preview environments
- **staging**: SF seed data
- **prod**: Production

### Secrets Management
- **Tool**: SOPS + GCP KMS
- **K8s**: Sealed secrets in cluster

## 11. Content & Puzzle Pipeline

1. Author puzzles as JSON + media
2. Validate via CLI: `spynet-puzzle lint`
3. Build stego/cipher bundles (PNG + hint JSON)
4. Store on S3 with signed GET URLs
5. Localization via ICU MessageFormat
6. Optional: Crowdin/POEditor for community translations

## 12. Monetization Hooks (V1+)

- **Cosmetic Shop**: Skins, scanner shaders, dossier frames
- **Agent Kits**: Thermal QR printers + sticker rolls shipped; code claims via SKU QR
- **Season Pass**: Access to elite missions, faction briefings, double-agent storylines

## 13. Legal/Safety

### Mission Restrictions
- No missions requiring entry to paid/secure/private spaces
- Blacklist polygons (schools, hospitals, transit tracks)
- Curfew windows for minors

### Privacy Compliance
- GDPR/CCPA: Data export/delete functionality
- Privacy mode (no precise location outside active mission)

### Venue Partner Program
- Opt-in QR placement agreements with auto-expiry
- Business partnerships for legitimate placement
- Community reporting for inappropriate locations

## 14. Roadmap

### Milestone A (4-6 weeks)
- Auth, players, QR scan flow, inventory, basic missions (qr_scan, cipher)
- BLE presence prototype
- Zone read-only map
- WebAR overlay demo

### Milestone B (6-10 weeks)
- Control meters + capture rule
- Faction join
- LLM director issuing missions
- Anti-cheat v1 (attestation + anomaly)
- Analytics dashboards

### Milestone C (10-14 weeks)
- Double-agent mechanics
- City event ops
- Narrative broadcasts
- iOS/Android store prep
- SF pilot with 3-5 partner venues

## 15. Developer Bootstrap

### Backend
```bash
pnpm i
pnpm -w run dev:stack  # docker compose: postgres, redis, clickhouse, minio
pnpm -w run dev:api
```

### Orchestrator
```bash
uv venv && uv pip install -r requirements.txt
uv run uvicorn orchestrator.app:app --reload
```

### Mobile
```bash
bun i
bun run start  # expo
```

### Seed Data
```bash
pnpm seed:sf  # zones (BART, Embarcadero, Mission Dolores), sample QR missions, three factions
```

## 16. Open Questions

1. **WebAR vs Native AR**: Lock on native for V1 performance?
2. **BLE Adjacencies**: Add ultrasonic chirp fallback in crowded stations?
3. **Player Safety Heuristics**: Dynamic crowd detection to reduce on-screen prompts in congested areas?
4. **Scaling**: When to split services? Monolith → microservices transition plan?
5. **Real-time Performance**: WebSocket vs SSE vs long polling trade-offs?
