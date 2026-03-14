import type { UUID, Timestamps } from './common';

// Grocery provider types
export type GroceryProvider = 'instacart' | 'walmart' | 'kroger';

// Product from grocery store
export interface GroceryProduct extends Timestamps {
  id: UUID;
  provider: GroceryProvider;
  providerProductId: string;
  name: string;
  brand: string | null;
  price: number;
  unit: string;
  size: string | null;
  imageUrl: string | null;
  inStock: boolean;
  lastSyncedAt: Date;
}

// Mapping between our ingredients and store products
export interface ProviderProductMatch extends Timestamps {
  id: UUID;
  ingredientCatalogId: UUID;
  groceryProductId: UUID;
  matchScore: number; // 0-1 confidence score
  isPreferred: boolean;
}

// Order tracking
export interface Order extends Timestamps {
  id: UUID;
  userId: UUID;
  householdId: UUID | null;
  shoppingListId: UUID | null;
  provider: GroceryProvider;
  providerOrderId: string | null;
  status: OrderStatus;
  subtotal: number | null;
  deliveryFee: number | null;
  tip: number | null;
  total: number | null;
  scheduledDeliveryStart: Date | null;
  scheduledDeliveryEnd: Date | null;
  actualDeliveryAt: Date | null;
}

export type OrderStatus =
  | 'pending'
  | 'submitted'
  | 'confirmed'
  | 'shopping'
  | 'delivering'
  | 'delivered'
  | 'cancelled';

// Grocery provider credentials (stored encrypted)
export interface GroceryProviderCredential extends Timestamps {
  id: UUID;
  userId: UUID;
  provider: GroceryProvider;
  // Encrypted token data
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date | null;
}

// DTOs for API
export interface SyncCartInput {
  provider: GroceryProvider;
  shoppingListId: UUID;
  items?: CartItemInput[];
  deliveryDate?: string;
  deliveryWindow?: {
    start: string;
    end: string;
  };
}

export interface CartItemInput {
  shoppingListItemId: UUID;
  productId: string;
  quantity: number;
  substitutionAllowed?: boolean;
}

export interface SubmitOrderInput {
  provider: GroceryProvider;
  cartId: string;
  paymentMethodId: string;
  deliveryInstructions?: string;
  tipAmount?: number;
  substitutionPreference?: SubstitutionPreference;
}

export type SubstitutionPreference = 'allow_all' | 'contact_me' | 'refund';

// Product search
export interface ProductSearchParams {
  query: string;
  provider: GroceryProvider;
  category?: string;
  limit?: number;
}

export interface ProductSearchResult {
  products: GroceryProduct[];
  totalCount: number;
}
