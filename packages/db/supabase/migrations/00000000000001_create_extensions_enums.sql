-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create enum types
CREATE TYPE household_role AS ENUM ('owner', 'admin', 'member');
CREATE TYPE dietary_restriction_type AS ENUM (
  'vegetarian', 'vegan', 'gluten_free', 'dairy_free', 'nut_free',
  'keto', 'paleo', 'low_sodium', 'halal', 'kosher'
);
CREATE TYPE allergy_severity AS ENUM ('mild', 'moderate', 'severe');
CREATE TYPE ingredient_category AS ENUM (
  'produce', 'meat', 'seafood', 'dairy', 'bakery', 'frozen',
  'canned_goods', 'dry_goods', 'spices', 'condiments', 'beverages', 'snacks', 'other'
);
CREATE TYPE recipe_source_type AS ENUM ('manual', 'url', 'image', 'youtube', 'instagram');
CREATE TYPE pantry_location AS ENUM ('refrigerator', 'freezer', 'pantry', 'other');
CREATE TYPE pantry_confidence_source AS ENUM ('manual', 'barcode', 'receipt', 'photo');
CREATE TYPE day_of_week AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');
CREATE TYPE meal_type AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');
CREATE TYPE shopping_list_status AS ENUM ('draft', 'active', 'completed', 'cancelled');
CREATE TYPE grocery_provider AS ENUM ('instacart', 'walmart', 'kroger');
CREATE TYPE order_status AS ENUM ('pending', 'submitted', 'confirmed', 'shopping', 'delivering', 'delivered', 'cancelled');
CREATE TYPE substitution_preference AS ENUM ('allow_all', 'contact_me', 'refund');
CREATE TYPE ingestion_job_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE artifact_type AS ENUM ('source_media', 'ocr_result', 'transcript', 'extracted_draft', 'normalized_recipe');
