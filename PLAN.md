# Recipe Tracker - Implementation Plan

## Phase 1: Foundation (Core Infrastructure)

- [x] Monorepo setup (pnpm, Turborepo, root configs)
- [x] Shared TypeScript configurations
- [x] Shared ESLint configurations
- [x] Docker infrastructure (PostgreSQL + pgvector, Redis)
- [x] Database schema with Drizzle ORM
- [x] Supabase SQL migrations (12 files)
- [x] Shared TypeScript types package

## Phase 2: Core MVP - Backend

- [x] API scaffolding (Next.js App Router)
- [x] Authentication middleware (Supabase Auth)
- [x] Route handler pattern with Zod validation
- [x] Recipe endpoints (import, manual, get)
- [x] Pantry endpoints (CRUD)
- [x] Meal plan endpoints
- [x] Shopping list endpoints
- [x] Preferences endpoints (brands, diets)
- [x] Grocery integration endpoints (stubs)
- [ ] Supabase client integration testing
- [ ] Error handling refinement
- [ ] API rate limiting

## Phase 3: Core MVP - Frontend

- [x] Web app scaffold (Next.js + Tailwind)
- [x] Mobile app scaffold (Expo Router)
- [x] Shared UI components (Button, Card, Input, Badge, Textarea, Tabs, Drawer, Spinner)
- [x] Recipe list endpoint (GET /api/recipes with pagination + search + tag filter)
- [x] Recipe CRUD endpoints (GET, POST manual, POST import, PATCH, DELETE)
- [x] Tags endpoint (GET /api/tags — distinct tags for user)
- [x] Ingestion jobs list endpoint (GET /api/ingestion-jobs)
- [x] Web: Dashboard layout with navbar (theme toggle, cart icon) + cart drawer
- [x] Web: Recipe list page (responsive card grid, search, tag filter chips, pagination)
- [x] Web: Recipe detail page (ingredients, steps, tags, metadata, inline edit, delete)
- [x] Web: Recipe review/approval page for imported recipes
- [x] Web: Add recipe page (manual entry form + batch URL import with job tracking)
- [x] Web: Cart drawer (Zustand store, ingredient aggregation, metric conversion)
- [x] Web: Ingredient preview modal (playful UI with red minus / green plus buttons)
- [x] Web: Import activity bar (persistent bottom bar showing import job status)
- [x] Web: Dark mode (default dark, toggle in navbar, localStorage persistence)
- [x] Web: Auto metric unit conversion (imperial → metric, no toggle)
- [x] Mobile: Recipes tab (FlatList + FAB + cart badge)
- [x] Mobile: Recipe detail screen (ScrollView + Add to Cart)
- [x] Mobile: Add recipe screen (manual form + URL import with polling)
- [x] Mobile: Cart screen (SectionList grouped by category)
- [x] TanStack Query hooks + API client (web + mobile)
- [x] Zustand cart store with ingredient aggregation (web + mobile)
- [x] Zustand job store for tracking import progress (web)
- [x] Recipe approval flow (imported recipes require review before use)
- [ ] Authentication flow (login, signup, logout)
- [ ] Pantry management UI
- [ ] Meal plan calendar view
- [ ] Shopping list UI with checkboxes
- [ ] Settings/preferences screens

## Phase 4: Business Logic

- [x] Recipe engine (parsing, scaling, unit conversion)
- [x] Shopping engine (aggregation, matching, substitutions)
- [ ] Ingredient normalization with catalog matching
- [ ] Pantry deduction from shopping lists
- [ ] Brand preference application
- [ ] Serving size scaling
- [ ] Unit conversion across recipes

## Phase 5: Background Workers

- [x] Domain worker scaffold (TypeScript/BullMQ)
- [x] Ingestion worker scaffold (Python)
- [ ] Meal plan expansion processor
- [ ] Shopping list generation processor
- [ ] Product matching processor
- [x] URL recipe extraction (JSON-LD + LLM fallback)
- [x] Image OCR processing (OpenAI Vision)
- [x] YouTube transcript extraction
- [ ] Instagram video processing (requires video download + Whisper transcription)
- [x] LLM-based recipe structuring
- [x] Ingestion job polling endpoint (GET /ingestion-jobs/{id})
- [x] Redis queue wiring (API → worker)
- [x] Worker writes directly to Postgres (replaced Redis result TTL pattern)
- [x] Multi-language recipe extraction (tested: English, Slovak)

## Phase 6: AI/ML Features

- [x] MCP server scaffold with tool definitions
- [ ] pgvector embeddings for recipes
- [ ] pgvector embeddings for ingredients
- [ ] Semantic recipe search
- [ ] Recipe recommendations based on pantry
- [ ] Smart substitution suggestions
- [ ] Meal plan generation from preferences

## Phase 7: Grocery Integration

- [ ] Instacart adapter implementation
- [ ] Walmart adapter implementation
- [ ] Kroger adapter implementation
- [ ] Product search across providers
- [ ] Cart synchronization
- [ ] Order submission
- [ ] Order status tracking
- [ ] Price comparison

## Phase 8: Household & Sharing

- [ ] Household creation and management
- [ ] Member invitations
- [ ] Shared recipes within household
- [ ] Shared pantry
- [ ] Shared meal plans
- [ ] Permission management (owner, admin, member)

## Phase 9: Advanced Features

- [ ] Receipt parsing for pantry updates
- [ ] Barcode scanning for pantry
- [ ] Automated pantry depletion based on meal plan
- [ ] Expiration date tracking and alerts
- [ ] Nutrition information display
- [ ] Dietary restriction filtering
- [ ] Multi-store price optimization
- [ ] Delivery scheduling

## Phase 10: Production Readiness

- [ ] Comprehensive test suite (unit, integration, e2e)
- [ ] CI/CD pipeline
- [ ] Staging environment
- [ ] Production Supabase setup
- [ ] Error monitoring (Sentry)
- [ ] Analytics integration
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation

---

**Last Updated**: 2026-03-15

**Note**: Update this file when:
- A new feature is implemented (check it off)
- New requirements emerge (add new items)
- Technical decisions change the approach
- Priorities shift (reorder items)
