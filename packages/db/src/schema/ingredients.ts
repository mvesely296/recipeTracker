import { pgTable, uuid, text, timestamp, real, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';

// Ingredient category enum
export const ingredientCategoryEnum = pgEnum('ingredient_category', [
  'produce',
  'meat',
  'seafood',
  'dairy',
  'bakery',
  'frozen',
  'canned_goods',
  'dry_goods',
  'spices',
  'condiments',
  'beverages',
  'snacks',
  'other',
]);

// Canonical ingredient catalog
export const ingredientCatalog = pgTable('ingredient_catalog', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  category: ingredientCategoryEnum('category').notNull().default('other'),
  defaultUnit: text('default_unit').notNull().default('unit'),
  aliases: text('aliases').array().default([]),
  gramsPerCup: real('grams_per_cup'),
  // pgvector column for semantic search (defined as text for Drizzle, actual type is vector(1536))
  embedding: text('embedding'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Brand preferences per user
export const brandPreferences = pgTable('brand_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  ingredientCategory: ingredientCategoryEnum('ingredient_category').notNull(),
  preferredBrands: text('preferred_brands').array().default([]),
  dislikedBrands: text('disliked_brands').array().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Substitution rules
export const substitutionRules = pgTable('substitution_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  sourceIngredientId: uuid('source_ingredient_id')
    .notNull()
    .references(() => ingredientCatalog.id, { onDelete: 'cascade' }),
  targetIngredientId: uuid('target_ingredient_id')
    .notNull()
    .references(() => ingredientCatalog.id, { onDelete: 'cascade' }),
  conversionRatio: real('conversion_ratio').notNull().default(1.0),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
