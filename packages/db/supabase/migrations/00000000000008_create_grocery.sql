-- Grocery products
CREATE TABLE grocery_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider grocery_provider NOT NULL,
  provider_product_id TEXT NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  price REAL NOT NULL,
  unit TEXT NOT NULL,
  size TEXT,
  image_url TEXT,
  in_stock BOOLEAN DEFAULT TRUE,
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider, provider_product_id)
);

-- Provider product matches
CREATE TABLE provider_product_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ingredient_catalog_id UUID NOT NULL REFERENCES ingredient_catalog(id) ON DELETE CASCADE,
  grocery_product_id UUID NOT NULL REFERENCES grocery_products(id) ON DELETE CASCADE,
  match_score REAL NOT NULL DEFAULT 0.5,
  is_preferred BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(ingredient_catalog_id, grocery_product_id)
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id) ON DELETE SET NULL,
  shopping_list_id UUID REFERENCES shopping_lists(id) ON DELETE SET NULL,
  provider grocery_provider NOT NULL,
  provider_order_id TEXT,
  provider_cart_id TEXT,
  status order_status NOT NULL DEFAULT 'pending',
  subtotal REAL,
  delivery_fee REAL,
  tip REAL,
  total REAL,
  substitution_preference substitution_preference DEFAULT 'contact_me',
  scheduled_delivery_start TIMESTAMPTZ,
  scheduled_delivery_end TIMESTAMPTZ,
  actual_delivery_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Grocery provider credentials
CREATE TABLE grocery_provider_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider grocery_provider NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, provider)
);
