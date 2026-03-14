-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_default_household ON users(default_household_id);

-- Household indexes
CREATE INDEX idx_households_owner ON households(owner_id);
CREATE INDEX idx_household_members_household ON household_members(household_id);
CREATE INDEX idx_household_members_user ON household_members(user_id);

-- Ingredient indexes
CREATE INDEX idx_ingredient_catalog_name_trgm ON ingredient_catalog USING gin (name gin_trgm_ops);
CREATE INDEX idx_ingredient_catalog_category ON ingredient_catalog(category);

-- Recipe indexes
CREATE INDEX idx_recipes_user ON recipes(user_id);
CREATE INDEX idx_recipes_household ON recipes(household_id);
CREATE INDEX idx_recipes_title_trgm ON recipes USING gin (title gin_trgm_ops);
CREATE INDEX idx_recipes_created_at ON recipes(created_at DESC);
CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_steps_recipe ON recipe_steps(recipe_id);
CREATE INDEX idx_recipe_tags_recipe ON recipe_tags(recipe_id);
CREATE INDEX idx_recipe_tags_tag ON recipe_tags(tag);

-- Pantry indexes
CREATE INDEX idx_pantry_items_user ON pantry_items(user_id);
CREATE INDEX idx_pantry_items_household ON pantry_items(household_id);
CREATE INDEX idx_pantry_items_expiration ON pantry_items(expiration_date);

-- Meal plan indexes
CREATE INDEX idx_meal_plans_user ON meal_plans(user_id);
CREATE INDEX idx_meal_plans_week ON meal_plans(week);
CREATE INDEX idx_meal_plan_entries_meal_plan ON meal_plan_entries(meal_plan_id);
CREATE INDEX idx_meal_plan_entries_recipe ON meal_plan_entries(recipe_id);

-- Shopping list indexes
CREATE INDEX idx_shopping_lists_user ON shopping_lists(user_id);
CREATE INDEX idx_shopping_lists_meal_plan ON shopping_lists(meal_plan_id);
CREATE INDEX idx_shopping_lists_status ON shopping_lists(status);
CREATE INDEX idx_shopping_list_items_list ON shopping_list_items(shopping_list_id);

-- Grocery indexes
CREATE INDEX idx_grocery_products_provider ON grocery_products(provider);
CREATE INDEX idx_grocery_products_name_trgm ON grocery_products USING gin (name gin_trgm_ops);
CREATE INDEX idx_provider_product_matches_ingredient ON provider_product_matches(ingredient_catalog_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Ingestion indexes
CREATE INDEX idx_ingestion_jobs_user ON ingestion_jobs(user_id);
CREATE INDEX idx_ingestion_jobs_status ON ingestion_jobs(status);
CREATE INDEX idx_ingestion_artifacts_job ON ingestion_artifacts(job_id);

-- pgvector indexes for semantic search
CREATE INDEX idx_ingredient_catalog_embedding ON ingredient_catalog
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_recipes_embedding ON recipes
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
