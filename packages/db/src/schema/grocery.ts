import { pgTable, uuid, text, timestamp, real, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { users, households } from './users';
import { shoppingLists } from './shopping';
import { ingredientCatalog } from './ingredients';

// Grocery provider enum
export const groceryProviderEnum = pgEnum('grocery_provider', ['instacart', 'walmart', 'kroger']);

// Order status enum
export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'submitted',
  'confirmed',
  'shopping',
  'delivering',
  'delivered',
  'cancelled',
]);

// Substitution preference enum
export const substitutionPreferenceEnum = pgEnum('substitution_preference', [
  'allow_all',
  'contact_me',
  'refund',
]);

// Grocery products (from providers)
export const groceryProducts = pgTable('grocery_products', {
  id: uuid('id').primaryKey().defaultRandom(),
  provider: groceryProviderEnum('provider').notNull(),
  providerProductId: text('provider_product_id').notNull(),
  name: text('name').notNull(),
  brand: text('brand'),
  price: real('price').notNull(),
  unit: text('unit').notNull(),
  size: text('size'),
  imageUrl: text('image_url'),
  inStock: boolean('in_stock').default(true),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Provider product matches (ingredient to product mapping)
export const providerProductMatches = pgTable('provider_product_matches', {
  id: uuid('id').primaryKey().defaultRandom(),
  ingredientCatalogId: uuid('ingredient_catalog_id')
    .notNull()
    .references(() => ingredientCatalog.id, { onDelete: 'cascade' }),
  groceryProductId: uuid('grocery_product_id')
    .notNull()
    .references(() => groceryProducts.id, { onDelete: 'cascade' }),
  matchScore: real('match_score').notNull().default(0.5),
  isPreferred: boolean('is_preferred').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Orders
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  householdId: uuid('household_id').references(() => households.id, { onDelete: 'set null' }),
  shoppingListId: uuid('shopping_list_id').references(() => shoppingLists.id, {
    onDelete: 'set null',
  }),
  provider: groceryProviderEnum('provider').notNull(),
  providerOrderId: text('provider_order_id'),
  providerCartId: text('provider_cart_id'),
  status: orderStatusEnum('status').notNull().default('pending'),
  subtotal: real('subtotal'),
  deliveryFee: real('delivery_fee'),
  tip: real('tip'),
  total: real('total'),
  substitutionPreference: substitutionPreferenceEnum('substitution_preference').default(
    'contact_me'
  ),
  scheduledDeliveryStart: timestamp('scheduled_delivery_start', { withTimezone: true }),
  scheduledDeliveryEnd: timestamp('scheduled_delivery_end', { withTimezone: true }),
  actualDeliveryAt: timestamp('actual_delivery_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Grocery provider credentials (encrypted)
export const groceryProviderCredentials = pgTable('grocery_provider_credentials', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  provider: groceryProviderEnum('provider').notNull(),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token'),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
