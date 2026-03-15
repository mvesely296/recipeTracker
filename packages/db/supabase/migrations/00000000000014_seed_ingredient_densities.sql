-- Seed ingredient_catalog with real grams-per-cup density data
-- Sources: King Arthur Baking, Instacart, Cafe Fernando conversion charts

INSERT INTO ingredient_catalog (name, category, default_unit, grams_per_cup) VALUES
  -- Flours & starches
  ('all-purpose flour', 'dry_goods', 'g', 120),
  ('bread flour', 'dry_goods', 'g', 120),
  ('cake flour', 'dry_goods', 'g', 120),
  ('whole wheat flour', 'dry_goods', 'g', 113),
  ('almond flour', 'dry_goods', 'g', 96),
  ('coconut flour', 'dry_goods', 'g', 128),
  ('rye flour', 'dry_goods', 'g', 106),
  ('cornstarch', 'dry_goods', 'g', 125),
  ('semolina', 'dry_goods', 'g', 167),

  -- Sugars & sweeteners
  ('granulated sugar', 'dry_goods', 'g', 200),
  ('brown sugar', 'dry_goods', 'g', 220),
  ('powdered sugar', 'dry_goods', 'g', 120),

  -- Baking essentials
  ('cocoa powder', 'dry_goods', 'g', 100),
  ('baking powder', 'dry_goods', 'g', 48),
  ('baking soda', 'dry_goods', 'g', 80),

  -- Grains & legumes
  ('rolled oats', 'dry_goods', 'g', 80),
  ('breadcrumbs', 'dry_goods', 'g', 100),
  ('rice', 'dry_goods', 'g', 185),
  ('barley', 'dry_goods', 'g', 213),
  ('couscous', 'dry_goods', 'g', 175),
  ('quinoa', 'dry_goods', 'g', 170),
  ('lentils', 'dry_goods', 'g', 190),
  ('chickpeas', 'dry_goods', 'g', 200),
  ('polenta', 'dry_goods', 'g', 160),

  -- Dairy
  ('butter', 'dairy', 'g', 227),
  ('cream cheese', 'dairy', 'g', 227),
  ('sour cream', 'dairy', 'g', 227),
  ('yogurt', 'dairy', 'g', 227),
  ('parmesan', 'dairy', 'g', 110),
  ('cheddar', 'dairy', 'g', 113),
  ('mozzarella', 'dairy', 'g', 113),
  ('gruyere', 'dairy', 'g', 100),
  ('ricotta', 'dairy', 'g', 250),
  ('cottage cheese', 'dairy', 'g', 225),
  ('feta', 'dairy', 'g', 150),
  ('gouda', 'dairy', 'g', 113),

  -- Nuts
  ('almonds', 'snacks', 'g', 142),
  ('cashews', 'snacks', 'g', 113),
  ('walnuts', 'snacks', 'g', 100),
  ('pecans', 'snacks', 'g', 100),
  ('peanuts', 'snacks', 'g', 142),
  ('pistachios', 'snacks', 'g', 125),
  ('pine nuts', 'snacks', 'g', 140),
  ('hazelnuts', 'snacks', 'g', 130),
  ('macadamia nuts', 'snacks', 'g', 134),

  -- Seeds
  ('sunflower seeds', 'snacks', 'g', 140),
  ('sesame seeds', 'snacks', 'g', 160),
  ('pumpkin seeds', 'snacks', 'g', 130),
  ('chia seeds', 'snacks', 'g', 160),
  ('flax seeds', 'snacks', 'g', 150),
  ('poppy seeds', 'snacks', 'g', 145),

  -- Dried fruit & coconut
  ('shredded coconut', 'dry_goods', 'g', 85),
  ('coconut flakes', 'dry_goods', 'g', 80),
  ('chocolate chips', 'snacks', 'g', 170),
  ('raisins', 'dry_goods', 'g', 150),
  ('dried apricots', 'dry_goods', 'g', 130),

  -- Nut butters & spreads
  ('peanut butter', 'condiments', 'g', 258),

  -- Spices
  ('salt', 'spices', 'g', 288),
  ('black pepper', 'spices', 'g', 105),
  ('ground cinnamon', 'spices', 'g', 125),
  ('ground cumin', 'spices', 'g', 120),
  ('ground ginger', 'spices', 'g', 90),
  ('paprika', 'spices', 'g', 110),
  ('chili powder', 'spices', 'g', 120),
  ('garlic powder', 'spices', 'g', 150),
  ('onion powder', 'spices', 'g', 115),
  ('dried oregano', 'spices', 'g', 50),
  ('dried basil', 'spices', 'g', 40),
  ('dried thyme', 'spices', 'g', 50),
  ('turmeric', 'spices', 'g', 120),
  ('nutmeg', 'spices', 'g', 112),

  -- Fresh produce
  ('blueberries', 'produce', 'g', 150),
  ('raspberries', 'produce', 'g', 120),
  ('strawberries', 'produce', 'g', 167),
  ('cranberries', 'produce', 'g', 100),
  ('dates', 'produce', 'g', 175),
  ('onion', 'produce', 'g', 142),
  ('bell pepper', 'produce', 'g', 142),
  ('carrot', 'produce', 'g', 142),
  ('celery', 'produce', 'g', 120),
  ('zucchini', 'produce', 'g', 130),
  ('spinach', 'produce', 'g', 30),
  ('kale', 'produce', 'g', 67),
  ('broccoli', 'produce', 'g', 90),
  ('cauliflower', 'produce', 'g', 100),
  ('corn kernels', 'produce', 'g', 160),
  ('peas', 'produce', 'g', 145),
  ('tomato', 'produce', 'g', 180),
  ('mushrooms', 'produce', 'g', 70),
  ('garlic', 'produce', 'g', 136),

  -- Liquid condiments (included for completeness)
  ('honey', 'condiments', 'g', 320),
  ('maple syrup', 'condiments', 'g', 315),
  ('molasses', 'condiments', 'g', 340),
  ('corn syrup', 'condiments', 'g', 340),
  ('mayonnaise', 'condiments', 'g', 227),
  ('jam', 'condiments', 'g', 320),
  ('olive oil', 'condiments', 'ml', 216),
  ('vegetable oil', 'condiments', 'ml', 198),
  ('coconut oil', 'condiments', 'ml', 218)

ON CONFLICT (name) DO UPDATE SET
  grams_per_cup = EXCLUDED.grams_per_cup,
  category = EXCLUDED.category,
  default_unit = EXCLUDED.default_unit;
