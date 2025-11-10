# SpyNet AR - Development Environment Setup

This guide will help you set up your local development environment for SpyNet AR.

## Prerequisites

### Required Software

- **Node.js**: v22.x or later ([Download](https://nodejs.org/))
- **pnpm**: v9.x or later (install: `npm install -g pnpm`)
- **Python**: 3.11 or later ([Download](https://www.python.org/))
- **uv**: Python package manager ([Install](https://github.com/astral-sh/uv))
- **Docker**: For running local services ([Download](https://www.docker.com/))
- **Docker Compose**: v2.x or later (included with Docker Desktop)
- **PostgreSQL Client**: psql command-line tool
- **Git**: For version control

### Recommended Software

- **bun**: Fast JavaScript runtime (optional, for mobile dev)
- **VS Code**: With recommended extensions (see below)
- **Postman** or **Insomnia**: For API testing
- **TablePlus** or **pgAdmin**: For database management

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/spynet-ar.git
cd spynet-ar
```

### 2. Install Dependencies

#### Backend (Node.js services)
```bash
pnpm install
```

#### AI Orchestrator (Python)
```bash
cd services/orchestrator
uv venv
uv pip install -r requirements.txt
```

#### Mobile App
```bash
cd apps/mobile
bun install  # or pnpm install
```

### 3. Environment Variables

Create `.env` files for each service:

#### Root `.env`
```bash
cp .env.example .env
```

Edit `.env`:
```env
# Database
DATABASE_URL=postgresql://spynet:spynet@localhost:5432/spynet
POSTGRES_USER=spynet
POSTGRES_PASSWORD=spynet
POSTGRES_DB=spynet

# Redis
REDIS_URL=redis://localhost:6379

# ClickHouse
CLICKHOUSE_URL=http://localhost:8123
CLICKHOUSE_DATABASE=spynet

# MinIO (S3-compatible)
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=spynet

# Auth
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=30d

# LLM
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4
LLM_ORCHESTRATOR_URL=http://localhost:8000

# Environment
NODE_ENV=development
LOG_LEVEL=debug
```

#### Orchestrator `.env`
```bash
cd services/orchestrator
cp .env.example .env
```

Edit `services/orchestrator/.env`:
```env
OPENAI_API_KEY=your-openai-api-key
DATABASE_URL=postgresql://spynet:spynet@localhost:5432/spynet
REDIS_URL=redis://localhost:6379
ENVIRONMENT=development
LOG_LEVEL=DEBUG
```

#### Mobile `.env`
```bash
cd apps/mobile
cp .env.example .env
```

Edit `apps/mobile/.env`:
```env
API_URL=http://localhost:3000
MAPBOX_TOKEN=your-mapbox-token
ENVIRONMENT=development
```

### 4. Start Local Services

Use Docker Compose to start PostgreSQL, Redis, ClickHouse, and MinIO:

```bash
pnpm run dev:stack
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379
- ClickHouse on port 8123
- MinIO on port 9000 (console: 9001)

Verify services are running:
```bash
docker compose ps
```

### 5. Database Setup

#### Create database and extensions
```bash
pnpm run db:setup
```

Or manually:
```bash
psql -h localhost -U spynet -d spynet -f scripts/db/init.sql
```

#### Run migrations
```bash
pnpm run db:migrate
```

#### Seed initial data
```bash
pnpm run db:seed
```

This creates:
- Three factions (Obsidian Order, Aurora Syndicate, Citadel Directorate)
- Sample zones in San Francisco
- Test QR codes
- Sample missions

### 6. Verify Database Setup

```bash
psql -h localhost -U spynet -d spynet -c "SELECT name FROM factions;"
```

You should see the three factions listed.

## Running the Services

### Start All Services

From the root directory:
```bash
pnpm run dev
```

This starts:
- API Gateway on port 3000
- Mission Service on port 3001
- Player Service on port 3002
- Faction Service on port 3003
- Zone Service on port 3004

### Start Individual Services

#### API Gateway
```bash
cd services/api
pnpm run dev
```

#### AI Orchestrator (Python)
```bash
cd services/orchestrator
uv run uvicorn orchestrator.app:app --reload --port 8000
```

#### Mobile App
```bash
cd apps/mobile
bun run start  # Expo dev server
```

For iOS:
```bash
bun run ios
```

For Android:
```bash
bun run android
```

#### Web App
```bash
cd apps/web
pnpm run dev
```

Access at: http://localhost:3000

## Development Workflow

### Database Migrations

Create a new migration:
```bash
pnpm run db:migration:create "add_player_stats"
```

Run pending migrations:
```bash
pnpm run db:migrate
```

Rollback last migration:
```bash
pnpm run db:migrate:rollback
```

### Testing

Run all tests:
```bash
pnpm run test
```

Run tests for specific service:
```bash
cd services/missions
pnpm run test
```

Run integration tests:
```bash
pnpm run test:integration
```

Run E2E tests:
```bash
pnpm run test:e2e
```

### Code Quality

Run linting:
```bash
pnpm run lint
```

Run type checking:
```bash
pnpm run typecheck
```

Format code:
```bash
pnpm run format
```

### Debugging

#### API Services
Use VS Code's built-in debugger. Launch configurations are in `.vscode/launch.json`.

#### Database Queries
Enable query logging in PostgreSQL:
```bash
# Add to docker-compose.yml postgres service
command: postgres -c log_statement=all
```

View logs:
```bash
docker compose logs -f postgres
```

#### Redis
Monitor Redis commands:
```bash
docker compose exec redis redis-cli MONITOR
```

## VS Code Setup

### Recommended Extensions

Install these extensions for the best development experience:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-python.python",
    "ms-python.vscode-pylance",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "ms-azuretools.vscode-docker",
    "streetsidesoftware.code-spell-checker",
    "eamodio.gitlens"
  ]
}
```

### Workspace Settings

Create `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "[python]": {
    "editor.defaultFormatter": "ms-python.black-formatter",
    "editor.formatOnSave": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "files.exclude": {
    "**/.git": true,
    "**/.DS_Store": true,
    "**/node_modules": true,
    "**/__pycache__": true
  }
}
```

## Troubleshooting

### PostgreSQL Connection Issues

```bash
# Check if PostgreSQL is running
docker compose ps postgres

# Check logs
docker compose logs postgres

# Restart PostgreSQL
docker compose restart postgres
```

### Redis Connection Issues

```bash
# Test Redis connection
docker compose exec redis redis-cli ping
# Should return: PONG
```

### Port Conflicts

If ports are already in use, modify `docker-compose.yml`:
```yaml
services:
  postgres:
    ports:
      - "5433:5432"  # Change 5432 to 5433
```

Update `DATABASE_URL` in `.env` accordingly.

### Node Modules Issues

```bash
# Clear and reinstall
rm -rf node_modules
pnpm install
```

### Python Virtual Environment Issues

```bash
# Recreate virtual environment
cd services/orchestrator
rm -rf .venv
uv venv
uv pip install -r requirements.txt
```

### Docker Issues

```bash
# Clean up Docker resources
docker compose down -v
docker system prune -a

# Rebuild images
docker compose build --no-cache
docker compose up -d
```

## Mobile Development Setup

### iOS Setup (macOS only)

1. Install Xcode from the Mac App Store
2. Install Xcode Command Line Tools:
```bash
xcode-select --install
```
3. Install CocoaPods:
```bash
sudo gem install cocoapods
```
4. Install pods:
```bash
cd apps/mobile/ios
pod install
```

### Android Setup

1. Install [Android Studio](https://developer.android.com/studio)
2. Install Android SDK (API 33 or higher)
3. Set environment variables:
```bash
# Add to ~/.bashrc or ~/.zshrc
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### Expo Setup

```bash
# Install Expo CLI globally
npm install -g expo-cli

# Login to Expo
expo login
```

## API Testing

### Using curl

```bash
# Health check
curl http://localhost:3000/health

# Create player (requires auth)
curl -X POST http://localhost:3000/v1/players \
  -H "Content-Type: application/json" \
  -d '{"handle": "agent007", "email": "agent@spynet.com"}'
```

### Using Postman

Import the Postman collection:
```bash
open docs/api/spynet-ar.postman_collection.json
```

## Next Steps

1. Read [docs/gameplay.md](gameplay.md) for game mechanics
2. Review [docs/tech-stack.md](tech-stack.md) for architecture details
3. Check [docs/api/README.md](api/README.md) for API documentation
4. Explore [docs/schemas/database.md](schemas/database.md) for database schema
5. Review [docs/ai-orchestration.md](ai-orchestration.md) for AI system details

## Getting Help

- **Documentation**: Check the `/docs` folder
- **Issues**: Create an issue on GitHub
- **Team Chat**: Join our Slack/Discord (link TBD)
- **Code Review**: Submit PRs for review

## Production Deployment

For production deployment instructions, see [docs/DEPLOYMENT.md](DEPLOYMENT.md).
