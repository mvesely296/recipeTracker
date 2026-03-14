# Recipe Tracker

A cross-platform application for recipe planning, pantry management, and grocery automation.

## Tech Stack

- **Frontend**: Next.js (web), Expo/React Native (mobile)
- **Backend**: Next.js API Routes, BullMQ workers
- **Database**: PostgreSQL with pgvector (Supabase)
- **Queue**: Redis + BullMQ
- **Monorepo**: pnpm + Turborepo

## Project Structure

```
recipe-tracker/
├── apps/
│   ├── api/          # Next.js API server (port 3001)
│   ├── web/          # Next.js web app (port 3000)
│   ├── mobile/       # Expo React Native app
│   └── mcp-server/   # MCP server for LLM integration
├── packages/
│   ├── db/           # Database schema and migrations
│   ├── types/        # Shared TypeScript types
│   ├── ui/           # Shared React components
│   ├── recipe-engine/    # Recipe parsing and scaling
│   ├── shopping-engine/  # Shopping list generation
│   ├── eslint-config/    # Shared ESLint config
│   └── typescript-config/ # Shared TypeScript config
├── services/
│   ├── domain-worker/    # TypeScript BullMQ worker
│   └── ingestion-worker/ # Python OCR/video worker
└── infra/
    └── docker/       # Docker Compose configuration
```

## Prerequisites

- Node.js 20+
- pnpm 9.15+
- Docker and Docker Compose
- Python 3.12+ (for ingestion worker)
- uv (Python package manager)

## Getting Started

### 1. Install Dependencies

```bash
# Enable corepack for pnpm
corepack enable
corepack prepare pnpm@9.15.0 --activate

# Install all dependencies
pnpm install
```

### 2. Start Infrastructure

```bash
# Start PostgreSQL and Redis
pnpm docker:up

# Verify containers are running
docker ps

# View logs if needed
pnpm docker:logs
```

This starts:
- PostgreSQL with pgvector (port 5432)
- Redis (port 6379)
- pgweb - Database UI (http://localhost:8082)
- Redis Commander (http://localhost:8081)

### 3. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your Supabase credentials (if using Supabase)
# For local development, the Docker defaults work out of the box
```

### 4. Set Up Database

```bash
# Push schema to database
pnpm db:push

# Or run migrations (if using Supabase CLI)
cd packages/db
npx supabase db push
```

### 5. Start Development Servers

```bash
# Start all apps in development mode
pnpm dev

# Or start specific apps
pnpm dev --filter=@recipe-tracker/api
pnpm dev --filter=@recipe-tracker/web
```

### 6. Verify Setup

- API: http://localhost:3001/api/health
- Web: http://localhost:3000
- Database UI: http://localhost:8082
- Redis UI: http://localhost:8081

## Development Commands

### Running Applications

```bash
pnpm dev                          # Start all apps
pnpm dev --filter=@recipe-tracker/web    # Start web only
pnpm dev --filter=@recipe-tracker/api    # Start API only
```

### Building

```bash
pnpm build                        # Build all packages
pnpm build --filter=@recipe-tracker/api  # Build specific package
```

### Testing

```bash
pnpm test                         # Run all tests
pnpm typecheck                    # Type check all packages
pnpm lint                         # Lint all packages
```

### Database

```bash
pnpm db:generate                  # Generate migrations
pnpm db:push                      # Push schema to database
pnpm db:studio                    # Open Drizzle Studio
```

### Docker

```bash
pnpm docker:up                    # Start containers
pnpm docker:down                  # Stop containers
pnpm docker:logs                  # View logs
```

### Cleaning

```bash
pnpm clean                        # Clean all build artifacts
```

## Mobile Development

```bash
cd apps/mobile

# Start Expo
pnpm dev

# Run on iOS simulator
pnpm ios

# Run on Android emulator
pnpm android
```

## Python Ingestion Worker

```bash
cd services/ingestion-worker

# Install uv if not installed
pip install uv

# Install dependencies
uv sync

# Run worker
uv run python -m ingestion_worker.main
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgres://recipe_user:recipe_password@localhost:5432/recipe_tracker` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | - |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | - |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | - |
| `OPENAI_API_KEY` | OpenAI API key (for recipe extraction) | - |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/recipes/import` | Import recipe from URL/media |
| `POST` | `/api/recipes/manual` | Create recipe manually |
| `GET` | `/api/recipes/:id` | Get recipe details |
| `POST` | `/api/pantry/items` | Add pantry item |
| `PATCH` | `/api/pantry/items/:id` | Update pantry item |
| `DELETE` | `/api/pantry/items/:id` | Delete pantry item |
| `POST` | `/api/meal-plans/:week/generate-list` | Generate shopping list |
| `PATCH` | `/api/meal-plans/:id` | Update meal plan |
| `GET` | `/api/shopping-lists/:id` | Get shopping list |
| `PATCH` | `/api/shopping-lists/:id/items/:itemId` | Update list item |
| `PATCH` | `/api/preferences/brands` | Update brand preferences |
| `PATCH` | `/api/preferences/diets` | Update diet preferences |
| `POST` | `/api/grocery/cart/sync` | Sync cart with provider |
| `POST` | `/api/grocery/order/submit` | Submit grocery order |

## Supabase Setup (Production)

1. Create a new Supabase project at https://supabase.com
2. Copy the project URL and anon key to `.env`
3. Run migrations:
   ```bash
   cd packages/db
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase db push
   ```

## License

MIT
