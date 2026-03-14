-- Pantry items
CREATE TABLE pantry_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id) ON DELETE SET NULL,
  ingredient_catalog_id UUID REFERENCES ingredient_catalog(id) ON DELETE SET NULL,
  ingredient_name TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit TEXT NOT NULL,
  expiration_date TIMESTAMPTZ,
  location pantry_location NOT NULL DEFAULT 'pantry',
  confidence_source pantry_confidence_source NOT NULL DEFAULT 'manual',
  is_low_stock BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
