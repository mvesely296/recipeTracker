-- Ingredient catalog
CREATE TABLE ingredient_catalog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  category ingredient_category NOT NULL DEFAULT 'other',
  default_unit TEXT NOT NULL DEFAULT 'unit',
  aliases TEXT[] DEFAULT '{}',
  embedding vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Brand preferences
CREATE TABLE brand_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ingredient_category ingredient_category NOT NULL,
  preferred_brands TEXT[] DEFAULT '{}',
  disliked_brands TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, ingredient_category)
);

-- Substitution rules
CREATE TABLE substitution_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_ingredient_id UUID NOT NULL REFERENCES ingredient_catalog(id) ON DELETE CASCADE,
  target_ingredient_id UUID NOT NULL REFERENCES ingredient_catalog(id) ON DELETE CASCADE,
  conversion_ratio REAL NOT NULL DEFAULT 1.0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, source_ingredient_id, target_ingredient_id)
);
