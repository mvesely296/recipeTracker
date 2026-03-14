import { pgTable, uuid, text, timestamp, real, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { users, households } from './users';
import { mealPlans } from './meal-plans';
import { ingredientCatalog, ingredientCategoryEnum } from './ingredients';

// Shopping list status enum
export const shoppingListStatusEnum = pgEnum('shopping_list_status', [
  'draft',
  'active',
  'completed',
  'cancelled',
]);

// Shopping lists
export const shoppingLists = pgTable('shopping_lists', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  householdId: uuid('household_id').references(() => households.id, { onDelete: 'set null' }),
  mealPlanId: uuid('meal_plan_id').references(() => mealPlans.id, { onDelete: 'set null' }),
  week: text('week'), // ISO week format: YYYY-WXX
  name: text('name'),
  status: shoppingListStatusEnum('status').notNull().default('draft'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Shopping list items
export const shoppingListItems = pgTable('shopping_list_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  shoppingListId: uuid('shopping_list_id')
    .notNull()
    .references(() => shoppingLists.id, { onDelete: 'cascade' }),
  ingredientCatalogId: uuid('ingredient_catalog_id').references(() => ingredientCatalog.id, {
    onDelete: 'set null',
  }),
  ingredientName: text('ingredient_name').notNull(),
  quantity: real('quantity').notNull(),
  unit: text('unit').notNull(),
  category: ingredientCategoryEnum('category'),
  checked: boolean('checked').default(false),
  removed: boolean('removed').default(false),
  substitutedProductId: uuid('substituted_product_id'),
  notes: text('notes'),
  sourceRecipeIds: uuid('source_recipe_ids').array().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
