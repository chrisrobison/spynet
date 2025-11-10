# SpyNet AR

**A real-world espionage game powered by AR, AI, and geolocation**

## Overview

SpyNet AR transforms daily life into a living espionage simulation where players become secret agents, completing missions, scanning QR codes, spotting other operatives, and battling for control of real-world territory. The game features:

- **Augmented Reality exploration** - Discover virtual items like gold coins and diamonds in your environment
- **QR code missions** - Scan codes hidden in the real world to unlock rewards and advance storylines
- **Agent proximity detection** - Use Bluetooth to detect and interact with nearby players
- **AI-orchestrated missions** - An LLM-powered director issues dynamic, personalized missions
- **Faction warfare** - Join rival agencies and compete for control of geographic zones
- **Remote operations** - Participate through cipher puzzles and intel analysis from anywhere

## Game Concept

Players start as **Independent Operatives**, completing missions to build reputation. As they progress, rival factions recruit them into a persistent shadow war:

- **The Obsidian Order** - Masters of deception and psychological warfare
- **The Aurora Syndicate** - Tech-forward anarchists specializing in digital infiltration
- **The Citadel Directorate** - Military-precision loyalists focused on tactical operations

Players can become **double agents**, switching sides or feeding false intel. The AI mission director creates emergent narratives where every action influences the global story.

## Key Features

### Location-Based Gameplay
- AR overlay for discovering virtual items
- GPS-tracked control zones at landmarks and neighborhoods
- Real-world QR codes at bars, tourist spots, and hidden locations

### Social & Competitive
- Spot nearby agents using BLE proximity detection
- Faction-based territory control wars
- Cooperative and adversarial missions
- Player-deployed QR codes for community-driven content

### AI-Driven Narrative
- LLM orchestrates dynamic mission generation
- Personalized objectives based on player style
- Emergent storylines from player actions
- Real-time faction war adaptation

### Accessibility
- Field missions requiring physical exploration
- Remote cyber missions (decryption, analysis, puzzles)
- Strategic command roles for high-ranking agents
- Full participation regardless of mobility

## Tech Stack

- **Frontend**: React Native + Expo (iOS/Android), Next.js (web companion)
- **Backend**: Node.js (NestJS/Fastify), Python FastAPI for AI orchestration
- **Database**: PostgreSQL 16 with PostGIS, Redis 7
- **AI**: LLM-based mission director with tool functions
- **Infrastructure**: Kubernetes (GKE), Cloudflare CDN/WAF
- **Analytics**: ClickHouse for events

## Project Structure

```
spynet/
├── docs/               # Documentation
│   ├── gameplay.md     # Game design document
│   ├── tech-stack.md   # Technical architecture
│   ├── api/            # API documentation
│   └── schemas/        # Database and data schemas
├── services/           # Backend microservices
│   ├── api/            # Main API gateway
│   ├── missions/       # Mission management
│   ├── players/        # Player profiles and auth
│   ├── factions/       # Faction system
│   ├── zones/          # Control zone logic
│   └── orchestrator/   # AI mission director (Python)
├── apps/               # Frontend applications
│   ├── mobile/         # React Native app
│   └── web/            # Next.js web companion
├── packages/           # Shared libraries
├── infra/              # Infrastructure as code
└── scripts/            # Utility scripts
```

## Getting Started

See [docs/SETUP.md](docs/SETUP.md) for development environment setup.

## Documentation

- [Game Design Document](docs/gameplay.md)
- [Technical Architecture](docs/tech-stack.md)
- [API Reference](docs/api/README.md)
- [Database Schema](docs/schemas/database.md)
- [Mission System](docs/mission-system.md)
- [AI Orchestration](docs/ai-orchestration.md)

## Roadmap

### Milestone A (4-6 weeks)
- Auth, player profiles, inventory
- QR scan flow and basic missions
- BLE presence prototype
- WebAR overlay demo

### Milestone B (6-10 weeks)
- Control zone meters and capture mechanics
- Faction system and recruitment
- LLM mission director integration
- Anti-cheat v1 and analytics

### Milestone C (10-14 weeks)
- Double-agent mechanics
- City-wide faction wars
- iOS/Android store release
- SF pilot launch with venue partners

## License

TBD

## Contact

For questions or partnership inquiries, contact: [TBD]
