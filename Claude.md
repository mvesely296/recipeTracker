# Recipe Planning & Grocery Automation App -- Implementation Architecture

## Implementation Tracking

**See [PLAN.md](./PLAN.md) for the current implementation status and roadmap.**

When working on this codebase:
- Check off completed items in PLAN.md after implementing features
- Add new items to PLAN.md when requirements emerge
- Update PLAN.md when technical decisions change the approach
- Reorder items in PLAN.md when priorities shift

---

## Architecture Decisions (deviations from original spec)

1. **Worker writes to Postgres directly** — the original design had
   workers storing results in Redis with a 1hr TTL. This was replaced
   with direct Postgres writes via psycopg (async). Redis is used only
   as a job queue (LPUSH/BLPOP on `ingestion:jobs`).

2. **OpenAI Vision for OCR** — replaced pytesseract with gpt-4o-mini
   Vision API. More accurate for recipe photos/handwriting, no system
   binary dependency (Tesseract).

3. **JSON-LD first, LLM fallback for URLs** — most recipe sites embed
   schema.org/Recipe structured data. Parse it deterministically when
   available (faster, cheaper, higher confidence). LLM only used when
   no JSON-LD is found.

4. **youtube-transcript-api for YouTube** — no API key needed. Works on
   public videos with captions. Synchronous library wrapped in
   `asyncio.to_thread()`.

5. **Single shared LLM prompt** — all source types (URL text, YouTube
   transcript, OCR text) use the same `structure_recipe_from_text()`
   call with a `source_context` parameter. Model: gpt-4o-mini with
   `response_format=json_object`.

6. **Windows compatibility** — psycopg requires `SelectorEventLoop` on
   Windows (not ProactorEventLoop). structlog output ASCII-encodes
   non-ASCII titles for Windows console compatibility.

7. **Drizzle ORM for local dev API routes** — the original API route
   handlers used Supabase PostgREST client (`supabase.from('table')`).
   Since local dev runs plain Postgres without PostgREST, all recipe-
   related route handlers were rewritten to use Drizzle ORM directly
   (`getDb()` from `@/lib/db`). When Supabase is configured (production),
   the auth middleware uses Supabase Auth; locally it bypasses auth with
   a dev user (`00000000-0000-0000-0000-000000000000`).

8. **Recipe approval flow** — imported recipes have `approved=false` and
   must be reviewed/approved before they appear as normal recipes. Manual
   recipes have `approved=true` by default. A dedicated review page at
   `/recipes/{id}/review` allows editing and approving imported recipes.

9. **Metric-only units** — all ingredient displays auto-convert imperial
   units to metric using `convertDisplayText()` from `lib/unit-conversion.ts`.
   No toggle — metric is always shown.

10. **Dark mode default** — Tailwind `darkMode: 'class'` with `dark` class
    on `<html>` by default. Theme stored in localStorage via Zustand.
    Toggle in navbar (sun/moon icon).

---

## Local Development Setup

### Prerequisites
- Node.js >= 20, pnpm 9.x
- Docker Desktop (for Postgres + Redis)
- Python >= 3.12 (for ingestion worker; `py -3.14` on Windows)

### Startup sequence (in order)

1. **Start Docker Desktop** (if not running):
   ```bash
   "/c/Program Files/Docker/Docker/Docker Desktop.exe" &
   # Wait ~15-30s for engine to initialize
   docker ps  # verify containers are up
   ```

2. **Start Docker containers** (Postgres + Redis + UIs):
   ```bash
   cd C:/PycharmProjects/recipeTracker
   docker compose -f infra/docker/docker-compose.yml up -d
   ```
   Services: postgres (5432), redis (6379), redis-commander (8081), pgweb (8082)

3. **Start API server** (port 3001):
   ```bash
   pnpm --filter @recipe-tracker/api dev
   ```
   The API has `.env.local` at `apps/api/.env.local` with DATABASE_URL and REDIS_URL.
   Without Supabase env vars, auth is bypassed with dev user `00000000-0000-0000-0000-000000000000`.

4. **Start web app** (port 3000):
   ```bash
   pnpm --filter @recipe-tracker/web dev
   ```
   Web app calls API at `http://localhost:3001/api` (configured via NEXT_PUBLIC_API_URL).
   Uses `credentials: 'omit'` for local dev (no CORS cookie issues).

5. **Start Python ingestion worker** (processes URL/YouTube/image imports):
   ```bash
   cd services/ingestion-worker
   DATABASE_URL="postgres://recipe_user:recipe_password@localhost:5432/recipe_tracker" \
   REDIS_URL="redis://localhost:6379" \
   OPENAI_API_KEY="<key from .env>" \
   py -3.14 -m ingestion_worker.main
   ```
   On Windows, uses `SelectorEventLoop` (required by psycopg async).
   Worker must be **restarted** when its Python code changes (no hot reload).

### Key dev notes
- API and web servers have HMR via Turbopack — code changes are picked up automatically
- Python worker does NOT have hot reload — must be killed and restarted after code changes
- Dev user is auto-created in DB: `INSERT INTO users (id, email, display_name) VALUES ('00000000-0000-0000-0000-000000000000', 'dev@localhost', 'Dev User') ON CONFLICT DO NOTHING;`
- `pnpm turbo typecheck` to verify all packages compile
- `pnpm turbo typecheck --filter=@recipe-tracker/web --force` for a single package

### Service URLs (local dev)
| Service | URL |
|---------|-----|
| Web app | http://localhost:3000/recipes |
| API     | http://localhost:3001/api |
| pgweb   | http://localhost:8082 |
| Redis Commander | http://localhost:8081 |

---

## Goal

Build a cross‑platform application that: - Stores and organizes recipes
from multiple sources - Automatically generates weekly meal plans -
Computes shopping lists based on pantry contents - Integrates with
grocery providers to order items - Learns and applies user brand
preferences - Works on both desktop and mobile with persistent user
accounts

------------------------------------------------------------------------

# 1. High-Level System Architecture

    [Expo App: iOS / Android / Web]
            |
            | HTTPS / WebSocket
            v
    [Next.js App + API Layer]
            |
            +--> Supabase Auth
            +--> Postgres + pgvector
            +--> Supabase Storage
            +--> Realtime subscriptions
            |
            +--> Redis + BullMQ Queue
                    |
                    +--> Python Ingestion Workers
                    |        - OCR
                    |        - video transcript parsing
                    |        - recipe extraction
                    |        - ingredient normalization
                    |
                    +--> TypeScript Domain Workers
                             - meal plan expansion
                             - shopping list generation
                             - substitution engine
                             - grocery product matching
            |
            +--> Grocery Integration Service
                    |
                    +--> Instacart Adapter
                    +--> Walmart Adapter
                    +--> Kroger Adapter
            |
            +--> MCP Server
                    - search_products
                    - create_cart
                    - replace_item
                    - remove_item
                    - submit_order
                    - pantry/recipe tools

------------------------------------------------------------------------

# 2. Technology Stack

## Frontend

Language: **TypeScript**

Frameworks: - React Native - Expo - React Native Web - Expo Router

Libraries: - TanStack Query - Zustand - React Hook Form - Zod - Tamagui
or NativeWind

Platforms supported: - iOS - Android - Desktop (Web/PWA)

------------------------------------------------------------------------

## Backend

Language: **TypeScript**

Framework: - Next.js (App Router)

Responsibilities: - REST API - authentication middleware - meal plan
services - grocery integrations - MCP server

Background Jobs: - BullMQ - Redis

------------------------------------------------------------------------

## AI / Media Processing Pipeline

Language: **Python**

Responsibilities: - OCR via OpenAI Vision (not pytesseract) - transcript
parsing from YouTube via youtube-transcript-api - recipe structuring via
gpt-4o-mini with JSON mode - JSON-LD structured data extraction for URLs
(deterministic, no LLM needed)

Workers process ingestion jobs created by the API. Workers write results
directly to Postgres (not Redis). Redis is used only for the job queue.

------------------------------------------------------------------------

## Database & Infrastructure

Platform: **Supabase**

Services used: - Postgres database - Auth - Storage - Realtime -
pgvector embeddings

Other infra: - Redis for job queues

------------------------------------------------------------------------

# 3. Core Services

## 3.1 Recipe Ingestion Service

Handles recipes from multiple sources.

Supported inputs: - manual recipe entry - photo of recipe (OpenAI Vision
OCR) - URL to recipe webpage (JSON-LD first, LLM fallback) - YouTube
video (youtube-transcript-api + LLM) - Instagram video (not yet
implemented — needs video download + Whisper)

Pipeline (implemented):

1.  client POSTs to `/api/recipes/import` with sourceType + sourceUrl
2.  API inserts `ingestion_job` (status=pending) and LPUSHes to Redis
    `ingestion:jobs` queue
3.  Python worker BLPOPs job, dispatches by source\_type
4.  Worker preprocesses (fetch HTML / fetch transcript / OCR image)
5.  Worker stores `source_media` or `transcript` artifact
6.  Worker extracts structured recipe (JSON-LD parse or LLM call)
7.  Worker stores `extracted_draft` artifact
8.  Worker inserts recipe + ingredients + steps + tags into Postgres
9.  Worker updates ingestion\_job status=completed with recipe\_id
10. Client polls `GET /api/ingestion-jobs/{id}` for status + recipeId

Confidence scores: - JSON-LD extraction: 0.8 - LLM from webpage text:
0.5 - LLM from YouTube transcript: 0.5 - LLM from OCR text: 0.4 -
Manual entry: 1.0

Three artifact stages exist in `ingestion_artifacts`:

-   `source_media` (raw HTML) or `transcript` (YouTube) or `ocr_result`
-   `extracted_draft` (structured JSON before DB insert)
-   `normalized_recipe` (future: after normalization pass)

------------------------------------------------------------------------

## 3.2 Recipe Domain Service

Manages the canonical recipe database.

Responsibilities: - store recipe metadata - normalize ingredients - unit
conversion - serving scaling - tagging and search - deduplication

Canonical recipe fields:

-   title
-   source type
-   source URL
-   ingredients
-   steps
-   servings
-   cook time
-   tags
-   nutrition (optional)
-   confidence score

Ingredient representation:

Display text example:

    1 can San Marzano tomatoes

Normalized structure:

    quantity: 1
    unit: can
    ingredient: tomatoes
    attributes: whole peeled
    brand_candidate: San Marzano
    category: canned goods

------------------------------------------------------------------------

## 3.3 Pantry + Shopping Engine

Computes what must be purchased.

Process:

1.  expand weekly meal plan
2.  aggregate all ingredients
3.  normalize units
4.  merge duplicates
5.  subtract pantry contents
6.  apply brand preferences
7.  map to grocery products

Outputs: - weekly shopping list - store-specific product mapping -
substitution options

Pantry items track:

-   ingredient
-   quantity
-   unit
-   expiration
-   location
-   confidence source

------------------------------------------------------------------------

## 3.4 Preferences Service

Stores persistent user behavior.

Examples:

Brand preferences: - preferred brands - disliked brands

Dietary rules: - vegetarian - keto - allergies

Shopping preferences: - preferred stores - organic preference - package
size bias

Substitution rules: - ingredient replacements - brand fallback hierarchy

------------------------------------------------------------------------

## 3.5 Grocery Integration Service

Responsible for mapping ingredients to real store products.

Uses adapter pattern.

Interfaces:

    ProductSearchProvider
    CartProvider
    CheckoutProvider
    AvailabilityProvider
    SubstitutionProvider

Adapters: - Instacart - Walmart - Kroger

------------------------------------------------------------------------

# 4. MCP Server

The MCP server exposes application capabilities to LLM agents.

Tools exposed:

    search_products
    get_brand_matches
    create_cart
    replace_item
    remove_item
    submit_order
    list_pantry_items
    apply_weekly_plan_to_cart

Implementation language: TypeScript

Transport: HTTP

------------------------------------------------------------------------

# 5. Database Schema (Core Tables)

User + Household

-   users
-   households
-   household_members

Recipes

-   recipes
-   recipe_sources
-   recipe_ingredients
-   recipe_steps
-   recipe_tags

Ingredients

-   ingredient_catalog

User Preferences

-   brand_preferences
-   substitution_rules

Pantry

-   pantry_items

Meal Planning

-   meal_plans
-   meal_plan_entries

Shopping

-   shopping_lists
-   shopping_list_items

Retail Integration

-   grocery_products
-   provider_product_matches
-   orders

Processing

-   ingestion_jobs
-   ingestion_artifacts

------------------------------------------------------------------------

# 6. Key UX Screens

## Weekly Plan

Displays: - 7-day recipe plan - quick actions

Actions: - swap recipe - skip day - edit recipe - add to shopping list

------------------------------------------------------------------------

## Shopping List

Grouped by category.

Each item supports:

-   remove
-   substitute
-   mark as already owned
-   select preferred product
-   change quantity

------------------------------------------------------------------------

## Pantry

Shows current inventory.

Actions: - add item - remove item - mark used - mark low stock

Input methods:

-   manual entry
-   barcode scan
-   photo recognition

------------------------------------------------------------------------

## Recipes

Features:

-   recipe library
-   import recipes
-   review parsed recipes
-   tagging
-   search

------------------------------------------------------------------------

## Preferences

User controls:

-   brand preferences
-   dietary restrictions
-   substitution rules
-   preferred grocery stores

------------------------------------------------------------------------

# 7. REST API Outline

Recipes

    GET /recipes                (paginated list, search, tag filter)
    POST /recipes/import        (queue import job, optional title)
    POST /recipes/manual        (create recipe directly)
    GET /recipes/{id}           (full recipe with ingredients/steps/tags)
    PATCH /recipes/{id}         (update recipe fields, approve)
    DELETE /recipes/{id}        (delete recipe, cascades)

Tags

    GET /tags                   (distinct tags for user)

Ingestion Jobs

    GET /ingestion-jobs         (list recent jobs for user)
    GET /ingestion-jobs/{id}    (poll single job status)

Meal Planning

    POST /meal-plans/{week}/generate-list
    PATCH /meal-plans/{id}

Shopping Lists

    PATCH /shopping-lists/{id}/items/{itemId}
    GET /shopping-lists/{id}

Pantry

    POST /pantry/items
    PATCH /pantry/items/{id}
    DELETE /pantry/items/{id}

Preferences

    PATCH /preferences/brands
    PATCH /preferences/diets

Grocery Integration

    POST /grocery/cart/sync
    POST /grocery/order/submit

------------------------------------------------------------------------

# 8. Event Architecture

Events emitted by the system:

    recipe.import.requested
    recipe.import.completed
    mealplan.updated
    shoppinglist.recomputed
    pantry.updated
    brandpreference.updated
    grocery.cart.synced
    order.submitted

Workers subscribe to these events.

------------------------------------------------------------------------

# 9. Security Model

Authentication: - Supabase Auth

Authorization: - Row Level Security in Postgres

Security considerations: - encrypted tokens for grocery providers -
signed upload URLs - household scoped permissions - order audit logging

------------------------------------------------------------------------

# 10. Development Phases

## Phase 1

Core MVP

-   authentication
-   manual recipe entry
-   website recipe import
-   pantry management
-   weekly meal planning
-   shopping list generation
-   brand preferences

------------------------------------------------------------------------

## Phase 2

AI ingestion

-   image OCR import
-   YouTube recipe parsing
-   Instagram recipe parsing
-   substitution engine
-   grocery product matching
-   MCP server

------------------------------------------------------------------------

## Phase 3

Full automation

-   grocery ordering
-   multi-store optimization
-   shared households
-   receipt parsing
-   automated pantry depletion
-   price-aware substitutions

------------------------------------------------------------------------

# 11. Monorepo Layout

Recommended structure:

    repo
      apps
        mobile
        web
        api
        mcp-server

      packages
        db
        types
        ui
        recipe-engine
        shopping-engine

      services
        ingestion-worker
        domain-worker

      infra
        docker
        scripts

------------------------------------------------------------------------

End of architecture document.
