# SpyNet AR – Tech Stack & Architecture (MVP→V1)

This is an actionable, opinionated stack for building the first playable in San Francisco and scaling to multi-city. Choices bias toward fast iteration, battle-tested infrastructure, and low unit cost.

## 0. Product Scope (MVP)

- WebAR client with camera overlay, item discovery, and nearby-agent scan
- QR mission flow (scan → validate → reward → narrative payload)
- Faction + control zones (read-only in MVP; capture in V1)
- Remote operations (cipher/puzzle missions) and basic LLM director issuing missions
- BLE proximity ping + privacy-preserving presence

## 1. Client Stack

### Primary: React Native (iOS/Android)
- **Framework**: React Native with Expo + native modules
- **AR**: `react-native-vision-camera` + WebXR bridge or ViroReact (fallback)
  - Native ARKit/ARCore bridges in V1 for performance
- **BLE**: `react-native-ble-plx` for scanning/advertising ephemeral service UUIDs
- **QR**: `react-native-vision-camera` barcode plugin; fallback to ZXing on Android
- **Map**: Mapbox SDK (offline tiles optional later)
- **State**: Zustand for light global store; React Query for server sync
- **Auth**: Sign in with Apple/Google + email-magic; device-bound key pair
- **Config/Feature Flags**: `react-native-config` + remote flags from Config Service

### Secondary: Web Companion
- **Framework**: Next.js 15 + WebXR
- **Purpose**: Browser demos, dashboards, and puzzle missions

## 2. Backend & Runtime

### API Gateway
- **Server**: Fastify (Node 22) with TypeScript, Zod validation, rate limiting
- **Alternative**: uWebSockets.js behind Nginx for high-qps endpoints

### Mission/State Services
- **Framework**: NestJS (TypeScript) microservices
- **Services by bounded context**:
  - Auth
  - Players
  - Missions
  - Factions
  - Zones
  - Proximity
  - QR
  - Inventory
  - Events

### Realtime
- **Protocol**: WebSocket over Socket.IO 4 or native `ws`
- **Organization**: Rooms keyed by zone/faction

### LLM Orchestrator
- **Framework**: Python (FastAPI) tools-first agent service
- **LLM**: OpenAI-compatible endpoint (switchable to local)
- **Integration**: Tool functions exposed over gRPC/HTTP

### Workers
- **Queue**: BullMQ (Redis)
- **Workflows**: Temporal (V1) for long-running mission workflows (expirations, retries, hedging)

### Databases

#### PostgreSQL 16 (Primary)
- **Purpose**: Players, missions, items, QR, factions, zones, audit
- **Extensions**: PostGIS for geospatial queries

#### Redis 7
- **Purpose**: Presence, control meters, rate limits, ephemeral tokens
- **Data structures**: Sets, sorted sets, TTL keys

#### S3-Compatible Object Store
- **Purpose**: Mission media, signed payload archives

#### ClickHouse
- **Purpose**: Event analytics, player behavior analysis

### Infrastructure
- **Container Orchestration**: Kubernetes (GKE Autopilot)
- **Managed Services**: Cloud SQL (Postgres) + MemoryStore (Redis)
- **IaC**: Terraform + Terragrunt
- **CDN/WAF**: Cloudflare for CDN/WAF/Workers (edge token checks)

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
