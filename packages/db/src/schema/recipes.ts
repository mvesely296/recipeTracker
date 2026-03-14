import { pgTable, uuid, text, timestamp, integer, real, pgEnum } from 'drizzle-orm/pg-core';
import { users, households } from './users';
import { ingredientCatalog, ingredientCategoryEnum } from './ingredients';

// Recipe source type enum
export const recipeSourceTypeEnum = pgEnum('recipe_source_type', [
  'manual',
  'url',
  'image',
  'youtube',
  'instagram',
]);

// Recipes
export const recipes = pgTable('recipes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  householdId: uuid('household_id').references(() => households.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  description: text('description'),
  servings: integer('servings').notNull().default(4),
  prepTimeMinutes: integer('prep_time_minutes'),
  cookTimeMinutes: integer('cook_time_minutes'),
  sourceType: recipeSourceTypeEnum('source_type').notNull().default('manual'),
  sourceUrl: text('source_url'),
  confidenceScore: real('confidence_score').notNull().default(1.0),
  imageUrl: text('image_url'),
  // pgvector for recipe search
  embedding: text('embedding'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Recipe sources (for tracking import metadata)
export const recipeSources = pgTable('recipe_sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  recipeId: uuid('recipe_id')
    .notNull()
    .references(() => recipes.id, { onDelete: 'cascade' }),
  sourceType: recipeSourceTypeEnum('source_type').notNull(),
  sourceUrl: text('source_url'),
  sourceMediaId: text('source_media_id'),
  rawContent: text('raw_content'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Recipe ingredients (normalized)
export const recipeIngredients = pgTable('recipe_ingredients', {
  id: uuid('id').primaryKey().defaultRandom(),
  recipeId: uuid('recipe_id')
    .notNull()
    .references(() => recipes.id, { onDelete: 'cascade' }),
  ingredientCatalogId: uuid('ingredient_catalog_id').references(() => ingredientCatalog.id, {
    onDelete: 'set null',
  }),
  orderIndex: integer('order_index').notNull().default(0),
  quantity: real('quantity').notNull(),
  unit: text('unit').notNull(),
  ingredient: text('ingredient').notNull(),
  attributes: text('attributes'),
  brandCandidate: text('brand_candidate'),
  category: ingredientCategoryEnum('category'),
  displayText: text('display_text').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Recipe steps
export const recipeSteps = pgTable('recipe_steps', {
  id: uuid('id').primaryKey().defaultRandom(),
  recipeId: uuid('recipe_id')
    .notNull()
    .references(() => recipes.id, { onDelete: 'cascade' }),
  stepNumber: integer('step_number').notNull(),
  instruction: text('instruction').notNull(),
  durationMinutes: integer('duration_minutes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Recipe tags
export const recipeTags = pgTable('recipe_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  recipeId: uuid('recipe_id')
    .notNull()
    .references(() => recipes.id, { onDelete: 'cascade' }),
  tag: text('tag').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
