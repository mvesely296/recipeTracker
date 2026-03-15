-- Add grams_per_cup column to ingredient_catalog for volume-to-weight conversion
ALTER TABLE ingredient_catalog ADD COLUMN grams_per_cup REAL;
