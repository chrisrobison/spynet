# SpyNet AR - Project Summary

## Project Overview

SpyNet AR is a location-based espionage game that transforms your city into a living spy thriller. Players become secret agents, completing missions, scanning QR codes at real-world locations, and battling for control of territory through a web-based interface.

**Current Focus: Lean MVP** - We're building a web-first, focused prototype to validate core gameplay before investing in mobile apps, AR, and complex AI systems.

## Core Innovation

The game combines **physical QR code treasure hunting** with **territory control mechanics** and **narrative-driven espionage missions**. An AI assistant helps generate mission briefings and flavor text, but the core gameplay loop is designed to be fun without requiring expensive real-time AI generation.

## Lean MVP Features (Current Focus)

### 1. Core Gameplay Loop
- **QR Code Missions**: Print and place QR codes at 5-10 locations in your city
- **Web-Based Scanner**: Use browser to scan QR codes (no app needed)
- **Territory Control**: Capture zones by completing missions in that area
- **Simple Progression**: XP, ranks, and credits earned through missions

### 2. Faction System (Simplified)
- **Three Rival Agencies**:
  - **The Obsidian Order** - Deception specialists
  - **The Aurora Syndicate** - Tech hackers
  - **The Citadel Directorate** - Military tacticians
- **Choose Your Side**: Players pick one faction to support
- **Zone Control**: Factions compete for control of city zones
- **Leaderboards**: Track top agents per faction

### 3. Mission Types (MVP)
- **QR Scan Missions**: Find and scan codes at specific locations
- **Territory Surveillance**: Spend time in a zone to claim it
- **Intel Collection**: Complete simple cipher puzzles (web-based)
- **Faction Objectives**: Help your faction capture key zones

### 4. AI-Assisted Content (Limited)
- **Mission Briefings**: AI generates narrative flavor text
- **Player Profiles**: AI creates spy codenames and bios
- **Faction Updates**: AI writes faction status reports
- **Cost-Controlled**: Pre-cache content, not real-time generation

## Future Vision (Post-MVP)

*The following features are planned for after MVP validation:*
- Mobile apps (iOS/Android) with native QR scanning
- AR overlay for item discovery
- BLE proximity detection for player encounters
- Real-time AI mission generation
- Player-deployed QR codes
- Voice missions and advanced narrative

## Technical Architecture (Lean MVP)

### Frontend (Web-Only)
- **Framework**: Vanilla JavaScript + Web Components (LARC)
- **QR Scanning**: Browser WebRTC + jsQR library
- **Maps**: Leaflet.js (open source, no API costs)
- **PWA**: Installable web app with offline support
- **No Build Step**: Direct browser execution for fast iteration

### Backend (Simplified)
- **API**: Node.js + Fastify (dynamic routing)
- **Single Service**: Monolithic to start, split later if needed
- **AI Helper**: OpenAI/local LLM for text generation only
- **No Real-time**: Polling-based updates (WebSocket later)
- **No Workers**: Direct execution (job queues post-MVP)

### Data Layer (Minimal)
- **PostgreSQL 16**: Primary database with PostGIS
- **Redis 7**: Session storage and rate limiting
- **Local Storage**: Browser storage for offline capability
- **No Analytics DB**: Use PostgreSQL for MVP metrics

### Infrastructure (Development-Friendly)
- **Docker Compose**: Local development stack
- **Single VPS**: Deploy to DigitalOcean/Hetzner (~$20/mo)
- **No Kubernetes**: Simple Node.js process manager (PM2)
- **No CDN**: Direct serving (Cloudflare free tier later)
- **No IaC**: Manual setup initially, automate later

### Future Architecture (Post-MVP)
*After validation, scale up to:*
- React Native mobile apps
- Microservices architecture (NestJS)
- Kubernetes orchestration
- Real-time WebSocket system
- Dedicated analytics database
- Multi-region deployment

## Game Mechanics

### Mission Types

**Field Missions** (require physical presence):
- QR code scanning
- Territory surveillance
- Agent encounters
- Dead drops

**Remote Missions** (accessible from anywhere):
- Cipher decryption
- Intelligence analysis
- Social engineering
- Strategic planning

**Hybrid Missions** (coordination required):
- Triangulation operations
- Multi-agent raids
- Intelligence relay

### Progression System

1. **Ranks**: Rookie Operative → Field Agent → Handler → Ghost Agent
2. **Experience**: Earned through missions and interactions
3. **Reputation**: Community-driven rating system
4. **Unlocks**: Advanced missions, QR deployment, faction recruitment

### Control Zones

- **Micro Zones**: Individual landmarks (parks, buildings)
- **Meso Zones**: Neighborhoods (Mission District, SoMa)
- **Macro Zones**: City sectors (Downtown SF, East Bay)

Control determined by:
- Active player presence
- Mission completions
- QR scans
- Agent encounters
- Remote support operations

## AI Orchestration

### LLM as Game Master

The AI system uses GPT-4 (or equivalent) with tool-calling capabilities to:

1. **Generate Missions**: Create contextual missions based on player profile and location
2. **Craft Narratives**: Write immersive briefings and story content
3. **Manage Factions**: Orchestrate faction wars and strategic operations
4. **Adapt Difficulty**: Tune challenges to maintain engagement
5. **Create Events**: Generate city-wide events and global operations

### RAG Knowledge Base

Game design documents are embedded in pgvector, allowing the AI to:
- Stay consistent with game lore
- Generate lore-appropriate content
- Reference established mechanics
- Maintain narrative continuity

### Safety & Guardrails

- No missions on private property
- Blacklisted safety zones (schools, hospitals)
- Time-based restrictions (curfews)
- Content policy enforcement
- Anti-cheating validation

## Development Roadmap (Lean MVP)

### Phase 1: Playable Prototype (4-6 weeks, 1-2 people)
**Goal**: Single-player experience with 5 QR codes in one neighborhood

- [x] Database schema complete
- [x] Basic API server with auth
- [ ] Web frontend with QR scanner
- [ ] Map view with zones (Leaflet.js)
- [ ] Player profile and progression
- [ ] 5 pre-written missions with QR codes
- [ ] Simple zone capture mechanic
- [ ] AI-generated mission briefings

**Success Metric**: One person can play the game for 30 minutes and have fun

### Phase 2: Multiplayer Beta (6-10 weeks)
**Goal**: 10-20 testers playing in one city with faction competition

- [ ] Faction selection on signup
- [ ] Faction leaderboards
- [ ] 15-20 QR codes across 3-5 zones
- [ ] Basic social features (see other players on map)
- [ ] Mission progress tracking
- [ ] Faction territory control visualization
- [ ] Admin dashboard connected to real data

**Success Metric**: 10+ active players, 50% return next day

### Phase 3: Public Launch (10-14 weeks)
**Goal**: 50-100 active players, sustainable gameplay

- [ ] 30+ missions across full city
- [ ] Weekly faction challenges
- [ ] Player onboarding flow
- [ ] Mobile-responsive PWA
- [ ] Basic anti-cheat (location verification)
- [ ] Community features (chat, faction feed)
- [ ] Analytics and retention tracking

**Success Metric**: 50+ weekly active players, viable unit economics

### Post-MVP Expansion (If Validated)
**Only pursue if Phase 3 succeeds:**
- Native mobile apps (iOS/Android)
- AR item discovery
- Player-generated content (deploy QR codes)
- Real-time AI mission generation
- Multi-city expansion
- Advanced social features (BLE encounters)
- Monetization (season pass, cosmetics)

## Business Model (MVP Focus)

### MVP: Completely Free
- No monetization during MVP phase
- Focus 100% on proving the gameplay is fun
- All features available to all players
- Goal: Validate retention before worrying about revenue

### Post-MVP Monetization (If Validated)
Only implement if we achieve 50+ weekly active players:

- **Tip Jar**: Optional supporter donations
- **Faction Boost**: $2.99/month for cosmetic perks
- **Physical QR Kits**: Sell printed QR code packs ($19.99)
- **Local Business Partnerships**: Sponsored missions at venues

### Cost Structure (MVP)
**Total Monthly Burn: $50-150**
- VPS hosting: $20-40/month
- Domain + SSL: $10/month
- LLM API costs: $20-50/month (caching-heavy)
- Database backup storage: $5/month

**Sustainable at zero revenue during validation phase**

## Target Launch (Revised)

### Phase 1 Launch (Prototype)
- **Location**: Single neighborhood (your city)
- **Timeline**: 6 weeks from today
- **Initial Scale**: You + 2-3 friends
- **Venue Partners**: 0 (place QR codes yourself)

### Phase 2 Launch (Beta)
- **Location**: Full city (one metro area)
- **Timeline**: 12 weeks from today
- **Initial Scale**: 10-20 active testers
- **Venue Partners**: 1-2 friendly cafes/bars

### Phase 3 Launch (Public)
- **Location**: Same city, expanded zones
- **Timeline**: 20 weeks from today
- **Initial Scale**: 50-100 active players
- **Venue Partners**: 5-10 local businesses

## Success Metrics (Lean)

### Phase 1 Success Criteria
- [ ] You personally find the game fun
- [ ] 3 friends try it and 2 come back
- [ ] Zero critical bugs in core loop
- [ ] Core loop playable in 30 minutes

### Phase 2 Success Criteria
- [ ] 10+ players recruited
- [ ] 50% D1 retention (return next day)
- [ ] 30% D7 retention (return next week)
- [ ] 3+ missions completed per player
- [ ] All three factions have players

### Phase 3 Success Criteria
- [ ] 50+ weekly active users
- [ ] 40% D7 retention
- [ ] 20% D30 retention
- [ ] 10+ missions completed per active player
- [ ] Organic word-of-mouth growth
- [ ] Clear path to 100+ players

**If Phase 3 fails, pivot or sunset project. Don't keep building without validation.**

## Competitive Landscape

### Inspiration
- **Pokémon GO**: Location-based AR gameplay
- **Ingress**: Faction-based territory control
- **Geocaching**: Hidden real-world objectives
- **ARGs**: Immersive narrative experiences

### Differentiation
1. **AI-Generated Content**: Dynamic missions vs static spawns
2. **Dual Gameplay**: Field + remote operations
3. **Deep Narrative**: Spy thriller storyline vs casual collection
4. **Player Agency**: Community-driven content via QR deployment
5. **Accessibility**: Full participation without requiring mobility

## Risk Assessment

### Technical Risks
- **LLM costs**: Mitigation via caching and local models
- **Location spoofing**: Anti-cheat with multi-factor verification
- **Scale**: Start small, validate before expanding

### Gameplay Risks
- **Player density**: Focus on SF first to ensure encounters
- **Engagement**: AI adaptation to maintain interest
- **Toxicity**: Strong community moderation and reporting

### Legal Risks
- **Trespassing**: Strict mission validation and blacklists
- **Privacy**: GDPR/CCPA compliance, location coarsening
- **Safety**: Curfews, safety zones, player guidelines

## Next Steps

1. **Environment Setup**: Run `docker-compose up -d` to start services
2. **Database Init**: Run `pnpm db:setup` to create schema
3. **Service Development**: Begin with auth + player services
4. **AI Prototype**: Build mission director with sample tools
5. **Mobile Prototype**: Basic AR scanning and mission display
6. **Testing**: Internal playtest with 10-20 people in SF

## Team Requirements

### Engineering
- 2x Backend Engineers (Node.js/TypeScript)
- 1x Mobile Engineer (React Native)
- 1x AI/ML Engineer (Python/LLM)
- 1x DevOps Engineer (K8s/Infrastructure)

### Product & Design
- 1x Product Manager
- 1x Game Designer
- 1x UX/UI Designer
- 1x Narrative Writer

### Operations
- 1x Community Manager
- 1x QA/Test Coordinator

## Resources

### Documentation
- [README.md](../README.md) - Project overview
- [SETUP.md](SETUP.md) - Development environment setup
- [gameplay.md](gameplay.md) - Complete game design document
- [tech-stack.md](tech-stack.md) - Technical architecture
- [api/README.md](api/README.md) - API documentation
- [schemas/database.md](schemas/database.md) - Database schema
- [ai-orchestration.md](ai-orchestration.md) - AI system details

### External Links
- [React Native Docs](https://reactnative.dev/)
- [NestJS Docs](https://nestjs.com/)
- [PostGIS Docs](https://postgis.net/)
- [LangChain Docs](https://python.langchain.com/)
- [Mapbox Docs](https://docs.mapbox.com/)

## Contact

- **GitHub**: [github.com/yourusername/spynet-ar](https://github.com/yourusername/spynet-ar)
- **Email**: team@spynet.ar
- **Discord**: [Join our server]

---

**SpyNet AR** - Transform your city into a living spy thriller.
