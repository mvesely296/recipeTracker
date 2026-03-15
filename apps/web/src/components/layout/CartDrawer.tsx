'use client';

import { Drawer, Button } from '@recipe-tracker/ui';
import { useCartStore } from '@/stores/cart-store';
import { convertDisplayText } from '@/lib/unit-conversion';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  produce: 'Produce',
  meat: 'Meat',
  seafood: 'Seafood',
  dairy: 'Dairy',
  bakery: 'Bakery',
  frozen: 'Frozen',
  canned_goods: 'Canned Goods',
  dry_goods: 'Dry Goods',
  spices: 'Spices',
  condiments: 'Condiments',
  beverages: 'Beverages',
  snacks: 'Snacks',
  other: 'Other',
};

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);

  const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
    const cat = item.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const formatItemDisplay = (item: { displayText: string; quantity: number; unit: string }) => {
    return convertDisplayText(item.displayText, item.quantity, item.unit);
  };

  return (
    <Drawer open={open} onClose={onClose} title="Shopping Cart">
      {items.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-12">
          <svg className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
          </svg>
          <p>Your cart is empty</p>
          <p className="text-sm mt-1">Add recipes to see ingredients here</p>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">{items.length} item{items.length !== 1 ? 's' : ''}</span>
            <Button variant="ghost" size="sm" onClick={clearCart}>
              Clear all
            </Button>
          </div>

          <div className="space-y-6">
            {Object.entries(grouped).map(([category, categoryItems]) => (
              <div key={category}>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  {CATEGORY_LABELS[category] || category}
                </h3>
                <div className="space-y-2">
                  {categoryItems.map((item) => (
                    <div
                      key={item.ingredientName}
                      className="flex items-start justify-between gap-2 py-2 border-b border-gray-100 dark:border-gray-700"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                          {item.ingredientName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatItemDisplay(item)}
                        </p>
                        {item.sourceRecipeTitles.length > 0 && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                            From: {item.sourceRecipeTitles.join(', ')}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.ingredientName)}
                        className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 p-1 flex-shrink-0"
                        aria-label={`Remove ${item.ingredientName}`}
                      >
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Drawer>
  );
}
