'use client';

import { Drawer, Button } from '@recipe-tracker/ui';
import { useCartStore } from '@/stores/cart-store';
import { useIngredientDensities } from '@/hooks/use-ingredient-densities';
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
  const { data: densityData } = useIngredientDensities();
  const densityMap = densityData ? new Map(Object.entries(densityData)) : undefined;

  const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
    const cat = item.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

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
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {items.length} item{items.length !== 1 ? 's' : ''}
            </span>
            <Button variant="ghost" size="sm" onClick={clearCart}>
              Clear all
            </Button>
          </div>

          <div className="space-y-5">
            {Object.entries(grouped).map(([category, categoryItems]) => (
              <div key={category}>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  {CATEGORY_LABELS[category] || category}
                </h3>
                <div className="space-y-2">
                  {categoryItems.map((item) => (
                    <div
                      key={item.ingredientName}
                      className="flex items-center gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-bold text-gray-900 dark:text-gray-100 capitalize">
                          {item.ingredientName}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {convertDisplayText(item.quantity, item.unit, item.ingredientName, densityMap)}
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
                        className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-md hover:shadow-lg flex items-center justify-center transition-all duration-200"
                        aria-label={`Remove ${item.ingredientName}`}
                      >
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
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
