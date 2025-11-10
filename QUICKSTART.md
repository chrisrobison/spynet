# SpyNet AR - Quick Start Guide

Get your SpyNet AR development environment running in under 10 minutes.

## Prerequisites

Make sure you have installed:
- Node.js 22+ ([download](https://nodejs.org/))
- pnpm 9+ (`npm install -g pnpm`)
- Docker Desktop ([download](https://www.docker.com/))
- Python 3.11+ ([download](https://python.org/))

## 1. Clone and Setup (2 min)

```bash
# If not already in the directory
cd /home/cdr/domains/cdr2.com/www/spynet

# Copy environment variables
cp .env.example .env

# Edit .env and add your API keys:
# - OPENAI_API_KEY (for AI orchestrator)
# - MAPBOX_TOKEN (for maps)
```

## 2. Start Services (3 min)

```bash
# Start PostgreSQL, Redis, ClickHouse, and MinIO
pnpm run dev:stack

# Wait for services to be healthy (check with)
docker compose ps

# All services should show "healthy" status
```

## 3. Initialize Database (2 min)

```bash
# Install dependencies (if not already done)
pnpm install

# Setup database and run migrations
pnpm run db:setup
pnpm run db:migrate

# Seed with initial data (factions, sample zones)
pnpm run seed:sf
```

## 4. Start Development Servers (3 min)

### Terminal 1 - Backend Services
```bash
pnpm run dev:api
```

### Terminal 2 - AI Orchestrator
```bash
cd services/orchestrator
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn orchestrator.app:app --reload
```

### Terminal 3 - Mobile App (Optional)
```bash
cd apps/mobile
pnpm install
pnpm run start
```

## 5. Verify Installation

### Check API
```bash
curl http://localhost:3000/health
# Should return: {"status":"ok"}
```

### Check Database
```bash
psql -h localhost -U spynet -d spynet -c "SELECT name FROM factions;"
# Should show: Obsidian Order, Aurora Syndicate, Citadel Directorate
```

### Check Redis
```bash
docker compose exec redis redis-cli ping
# Should return: PONG
```

## Access Points

- **API**: http://localhost:3000
- **AI Orchestrator**: http://localhost:8000
- **PostgreSQL**: localhost:5432 (user: spynet, pass: spynet)
- **Redis**: localhost:6379
- **MinIO Console**: http://localhost:9001 (user: minioadmin, pass: minioadmin)
- **ClickHouse**: http://localhost:8123

## Next Steps

1. **Read the docs**: Start with [docs/PROJECT_SUMMARY.md](docs/PROJECT_SUMMARY.md)
2. **Try the API**: Import Postman collection from `docs/api/`
3. **Explore the code**: Check out `services/` for backend services
4. **Run tests**: `pnpm test`

## Troubleshooting

### Ports Already in Use
```bash
# Check what's using a port (e.g., 5432)
lsof -i :5432

# Or kill all Docker containers
docker compose down
```

### Database Connection Failed
```bash
# Restart PostgreSQL
docker compose restart postgres

# Check logs
docker compose logs postgres
```

### Can't Install Dependencies
```bash
# Clear cache and reinstall
rm -rf node_modules
pnpm install --force
```

## Common Commands

```bash
# View all running services
docker compose ps

# View logs
pnpm run dev:stack:logs

# Stop services
pnpm run dev:stack:down

# Clean everything (removes volumes!)
pnpm run dev:stack:clean

# Run linting
pnpm run lint

# Run tests
pnpm run test
```

## Development Workflow

1. **Create a branch**: `git checkout -b feature/my-feature`
2. **Make changes**: Edit code in `services/`, `apps/`, or `packages/`
3. **Test**: `pnpm test`
4. **Lint**: `pnpm run lint:fix`
5. **Commit**: `git commit -m "feat: add my feature"`
6. **Push**: `git push origin feature/my-feature`

## Getting Help

- **Documentation**: Check the `/docs` folder
- **GitHub Issues**: Report bugs or request features
- **Discord**: Join our community (link TBD)

---

**You're ready to build SpyNet AR!** 🕵️‍♂️

Start by exploring the game design in [docs/gameplay.md](docs/gameplay.md) or dive into the technical architecture in [docs/tech-stack.md](docs/tech-stack.md).
