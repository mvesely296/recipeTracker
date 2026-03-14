-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE dietary_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE substitution_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE pantry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_product_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_provider_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_artifacts ENABLE ROW LEVEL SECURITY;

-- Helper function to check household membership
CREATE OR REPLACE FUNCTION is_household_member(household_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM household_members
    WHERE household_id = household_uuid
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Households policies
CREATE POLICY "Users can view households they belong to" ON households
  FOR SELECT USING (is_household_member(id) OR owner_id = auth.uid());
CREATE POLICY "Users can create households" ON households
  FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners can update their households" ON households
  FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Owners can delete their households" ON households
  FOR DELETE USING (owner_id = auth.uid());

-- Household members policies
CREATE POLICY "Members can view household members" ON household_members
  FOR SELECT USING (is_household_member(household_id));

-- User preferences policies
CREATE POLICY "Users can manage own preferences" ON user_preferences
  FOR ALL USING (user_id = auth.uid());

-- Dietary restrictions policies
CREATE POLICY "Users can manage own restrictions" ON dietary_restrictions
  FOR ALL USING (user_id = auth.uid());

-- Allergies policies
CREATE POLICY "Users can manage own allergies" ON allergies
  FOR ALL USING (user_id = auth.uid());

-- Ingredient catalog policies (public read)
CREATE POLICY "Anyone can view ingredients" ON ingredient_catalog
  FOR SELECT USING (true);

-- Brand preferences policies
CREATE POLICY "Users can manage own brand preferences" ON brand_preferences
  FOR ALL USING (user_id = auth.uid());

-- Substitution rules policies
CREATE POLICY "Users can manage own substitution rules" ON substitution_rules
  FOR ALL USING (user_id = auth.uid());

-- Recipes policies
CREATE POLICY "Users can view own recipes" ON recipes
  FOR SELECT USING (user_id = auth.uid() OR is_household_member(household_id));
CREATE POLICY "Users can create recipes" ON recipes
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own recipes" ON recipes
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own recipes" ON recipes
  FOR DELETE USING (user_id = auth.uid());

-- Recipe related tables policies
CREATE POLICY "Users can view recipe sources" ON recipe_sources
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM recipes WHERE recipes.id = recipe_sources.recipe_id
    AND (recipes.user_id = auth.uid() OR is_household_member(recipes.household_id))
  ));
CREATE POLICY "Users can manage own recipe sources" ON recipe_sources
  FOR ALL USING (EXISTS (
    SELECT 1 FROM recipes WHERE recipes.id = recipe_sources.recipe_id
    AND recipes.user_id = auth.uid()
  ));

CREATE POLICY "Users can view recipe ingredients" ON recipe_ingredients
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM recipes WHERE recipes.id = recipe_ingredients.recipe_id
    AND (recipes.user_id = auth.uid() OR is_household_member(recipes.household_id))
  ));
CREATE POLICY "Users can manage own recipe ingredients" ON recipe_ingredients
  FOR ALL USING (EXISTS (
    SELECT 1 FROM recipes WHERE recipes.id = recipe_ingredients.recipe_id
    AND recipes.user_id = auth.uid()
  ));

CREATE POLICY "Users can view recipe steps" ON recipe_steps
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM recipes WHERE recipes.id = recipe_steps.recipe_id
    AND (recipes.user_id = auth.uid() OR is_household_member(recipes.household_id))
  ));
CREATE POLICY "Users can manage own recipe steps" ON recipe_steps
  FOR ALL USING (EXISTS (
    SELECT 1 FROM recipes WHERE recipes.id = recipe_steps.recipe_id
    AND recipes.user_id = auth.uid()
  ));

CREATE POLICY "Users can view recipe tags" ON recipe_tags
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM recipes WHERE recipes.id = recipe_tags.recipe_id
    AND (recipes.user_id = auth.uid() OR is_household_member(recipes.household_id))
  ));
CREATE POLICY "Users can manage own recipe tags" ON recipe_tags
  FOR ALL USING (EXISTS (
    SELECT 1 FROM recipes WHERE recipes.id = recipe_tags.recipe_id
    AND recipes.user_id = auth.uid()
  ));

-- Pantry policies
CREATE POLICY "Users can manage own pantry" ON pantry_items
  FOR ALL USING (user_id = auth.uid() OR is_household_member(household_id));

-- Meal plan policies
CREATE POLICY "Users can manage own meal plans" ON meal_plans
  FOR ALL USING (user_id = auth.uid() OR is_household_member(household_id));

CREATE POLICY "Users can manage meal plan entries" ON meal_plan_entries
  FOR ALL USING (EXISTS (
    SELECT 1 FROM meal_plans WHERE meal_plans.id = meal_plan_entries.meal_plan_id
    AND (meal_plans.user_id = auth.uid() OR is_household_member(meal_plans.household_id))
  ));

-- Shopping list policies
CREATE POLICY "Users can manage own shopping lists" ON shopping_lists
  FOR ALL USING (user_id = auth.uid() OR is_household_member(household_id));

CREATE POLICY "Users can manage shopping list items" ON shopping_list_items
  FOR ALL USING (EXISTS (
    SELECT 1 FROM shopping_lists WHERE shopping_lists.id = shopping_list_items.shopping_list_id
    AND (shopping_lists.user_id = auth.uid() OR is_household_member(shopping_lists.household_id))
  ));

-- Grocery products policies (public read)
CREATE POLICY "Anyone can view grocery products" ON grocery_products
  FOR SELECT USING (true);

-- Provider product matches policies (public read)
CREATE POLICY "Anyone can view product matches" ON provider_product_matches
  FOR SELECT USING (true);

-- Orders policies
CREATE POLICY "Users can manage own orders" ON orders
  FOR ALL USING (user_id = auth.uid());

-- Grocery credentials policies
CREATE POLICY "Users can manage own credentials" ON grocery_provider_credentials
  FOR ALL USING (user_id = auth.uid());

-- Ingestion policies
CREATE POLICY "Users can manage own ingestion jobs" ON ingestion_jobs
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view own ingestion artifacts" ON ingestion_artifacts
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM ingestion_jobs WHERE ingestion_jobs.id = ingestion_artifacts.job_id
    AND ingestion_jobs.user_id = auth.uid()
  ));
