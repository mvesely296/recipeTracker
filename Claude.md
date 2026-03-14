# Recipe Planning & Grocery Automation App -- Implementation Architecture

## Implementation Tracking

**See [PLAN.md](./PLAN.md) for the current implementation status and roadmap.**

When working on this codebase:
- Check off completed items in PLAN.md after implementing features
- Add new items to PLAN.md when requirements emerge
- Update PLAN.md when technical decisions change the approach
- Reorder items in PLAN.md when priorities shift

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

Responsibilities: - OCR parsing - transcript parsing from video -
ingredient extraction - recipe structuring - normalization of units

Workers process ingestion jobs created by the API.

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

Supported inputs: - manual recipe entry - photo of recipe - URL to
recipe webpage - Instagram video - YouTube video

Pipeline:

1.  client uploads media or URL
2.  API creates `ingestion_job`
3.  worker processes media
4.  worker extracts structured recipe
5.  recipe stored as canonical object

Important rule:

Raw extraction is never treated as final truth.

Three stages must exist:

-   `source_artifact`
-   `extracted_recipe_draft`
-   `canonical_recipe`

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

    POST /recipes/import
    POST /recipes/manual
    GET /recipes/{id}

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
