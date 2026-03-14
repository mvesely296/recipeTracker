import { pgTable, uuid, text, timestamp, real, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { users, households } from './users';
import { ingredientCatalog } from './ingredients';

// Pantry location enum
export const pantryLocationEnum = pgEnum('pantry_location', [
  'refrigerator',
  'freezer',
  'pantry',
  'other',
]);

// Confidence source enum
export const pantryConfidenceSourceEnum = pgEnum('pantry_confidence_source', [
  'manual',
  'barcode',
  'receipt',
  'photo',
]);

// Pantry items
export const pantryItems = pgTable('pantry_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  householdId: uuid('household_id').references(() => households.id, { onDelete: 'set null' }),
  ingredientCatalogId: uuid('ingredient_catalog_id').references(() => ingredientCatalog.id, {
    onDelete: 'set null',
  }),
  ingredientName: text('ingredient_name').notNull(),
  quantity: real('quantity').notNull(),
  unit: text('unit').notNull(),
  expirationDate: timestamp('expiration_date', { withTimezone: true }),
  location: pantryLocationEnum('location').notNull().default('pantry'),
  confidenceSource: pantryConfidenceSourceEnum('confidence_source').notNull().default('manual'),
  isLowStock: boolean('is_low_stock').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
