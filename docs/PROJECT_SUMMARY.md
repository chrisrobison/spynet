# SpyNet AR - Project Summary

## Project Overview

SpyNet AR is an ambitious location-based augmented reality espionage game that merges the digital and physical worlds. Players become secret agents, completing missions, scanning QR codes, spotting other operatives, and battling for control of real-world territory through their mobile devices.

## Core Innovation

The game's primary innovation is its **AI-orchestrated mission system**. A Large Language Model (LLM) acts as the "SpyNet Intelligence Network," dynamically generating personalized missions, crafting emergent narratives, and adapting gameplay based on player behavior and real-world events. This creates a living, breathing spy thriller where every player's actions influence the global story.

## Key Features

### 1. Hybrid Physical-Digital Gameplay
- **AR Exploration**: Discover virtual items overlaid on real environments
- **QR Code Missions**: Scan codes hidden at real-world locations
- **Proximity Detection**: Use Bluetooth to detect nearby players
- **Territory Control**: Capture and defend geographic zones

### 2. AI-Driven Dynamic Content
- **Personalized Missions**: LLM generates missions tailored to player skill and location
- **Emergent Narrative**: Stories evolve based on collective player actions
- **Adaptive Difficulty**: AI adjusts challenges based on performance
- **Real-time Events**: Dynamic world events respond to faction wars

### 3. Faction Warfare
- **Three Rival Agencies**:
  - **The Obsidian Order** - Deception and psychological warfare
  - **The Aurora Syndicate** - Tech anarchists and hackers
  - **The Citadel Directorate** - Military precision and control
- **Double Agent System**: Players can switch sides or operate as moles
- **Territory Control**: Factions battle for control of city zones
- **Strategic Objectives**: Long-term faction goals and seasonal campaigns

### 4. Inclusive Gameplay
- **Field Operations**: Physical exploration for mobile players
- **Remote Missions**: Cipher puzzles and intel analysis from home
- **Command Roles**: Strategic coordination for high-ranking agents
- **Hybrid Operations**: Coordination between field and remote agents

## Technical Architecture

### Frontend
- **Mobile**: React Native + Expo (iOS/Android)
- **Web**: Next.js for companion app and remote missions
- **AR**: ARKit/ARCore with WebXR fallback
- **Maps**: Mapbox for location services

### Backend
- **API**: NestJS microservices (Node.js 22 + TypeScript)
- **AI Orchestrator**: Python FastAPI with LLM integration
- **Real-time**: WebSocket with Socket.IO
- **Workers**: BullMQ + Temporal for async operations

### Data Layer
- **PostgreSQL 16**: Primary database with PostGIS for geospatial
- **Redis 7**: Presence tracking, rate limiting, caching
- **ClickHouse**: Analytics and event streaming
- **MinIO**: S3-compatible object storage

### Infrastructure
- **Kubernetes**: GKE Autopilot for container orchestration
- **Cloudflare**: CDN, WAF, and edge computing
- **Terraform**: Infrastructure as Code
- **GitHub Actions**: CI/CD pipeline

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

## Development Roadmap

### Milestone A (4-6 weeks) - Core Systems
- [ ] Player authentication and profiles
- [ ] QR code scanning and validation
- [ ] Basic mission system
- [ ] BLE proximity detection
- [ ] Zone definitions and mapping
- [ ] WebAR overlay prototype

### Milestone B (6-10 weeks) - Faction Wars
- [ ] Control zone mechanics
- [ ] Faction recruitment system
- [ ] LLM mission director integration
- [ ] Real-time zone updates via WebSocket
- [ ] Anti-cheat v1 (location verification)
- [ ] Analytics dashboards

### Milestone C (10-14 weeks) - Launch Prep
- [ ] Double-agent mechanics
- [ ] City-wide faction events
- [ ] Narrative broadcast system
- [ ] iOS/Android app store release
- [ ] San Francisco pilot launch
- [ ] Venue partner program

### Post-Launch
- Multi-city expansion (Oakland, Berkeley, San Jose)
- Advanced AI features (voice missions, image analysis)
- Monetization (cosmetics, agent kits, season pass)
- Community content creation tools

## Business Model

### Free-to-Play Core
All essential gameplay is free:
- Mission participation
- Faction membership
- Territory control
- Basic progression

### Premium Offerings
- **Cosmetics**: Scanner skins, avatar customization
- **Agent Kits**: Physical QR printer bundles ($49-99)
- **Season Pass**: Exclusive missions and storylines ($9.99/season)
- **Venue Partnerships**: Sponsored missions at bars/venues

### Partnerships
- **Local Businesses**: QR placement agreements
- **Tourism Boards**: Historical mission content
- **Tech Companies**: AR hardware partnerships

## Target Launch

**Location**: San Francisco, CA
**Timeline**: Q3 2025 (Milestone C completion)
**Initial Scale**: 100-500 active players
**Venue Partners**: 3-5 bars/cafes/tourist spots

## Success Metrics

### Engagement
- Daily Active Users (DAU)
- Session length
- Missions completed per player
- Retention (D1, D7, D30)

### Social
- Agent encounters per day
- Faction participation rate
- Drop discovery rate
- Community QR deployments

### Revenue
- Conversion rate to paid features
- Average revenue per user (ARPU)
- Agent kit sales
- Season pass subscriptions

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
