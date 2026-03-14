import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const tools: Tool[] = [
  {
    name: 'search_products',
    description: 'Search for grocery products by name or category',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query for products',
        },
        provider: {
          type: 'string',
          enum: ['instacart', 'walmart', 'kroger'],
          description: 'Grocery provider to search',
        },
        category: {
          type: 'string',
          description: 'Optional category filter',
        },
      },
      required: ['query', 'provider'],
    },
  },
  {
    name: 'create_cart',
    description: 'Create a shopping cart from a shopping list',
    inputSchema: {
      type: 'object',
      properties: {
        shoppingListId: {
          type: 'string',
          description: 'ID of the shopping list to convert to cart',
        },
        provider: {
          type: 'string',
          enum: ['instacart', 'walmart', 'kroger'],
          description: 'Grocery provider for the cart',
        },
      },
      required: ['shoppingListId', 'provider'],
    },
  },
  {
    name: 'replace_item',
    description: 'Replace an item in the cart with a different product',
    inputSchema: {
      type: 'object',
      properties: {
        cartId: {
          type: 'string',
          description: 'Cart ID',
        },
        itemId: {
          type: 'string',
          description: 'Item ID to replace',
        },
        newProductId: {
          type: 'string',
          description: 'New product ID to use',
        },
      },
      required: ['cartId', 'itemId', 'newProductId'],
    },
  },
  {
    name: 'remove_item',
    description: 'Remove an item from the cart',
    inputSchema: {
      type: 'object',
      properties: {
        cartId: {
          type: 'string',
          description: 'Cart ID',
        },
        itemId: {
          type: 'string',
          description: 'Item ID to remove',
        },
      },
      required: ['cartId', 'itemId'],
    },
  },
  {
    name: 'submit_order',
    description: 'Submit the cart as an order',
    inputSchema: {
      type: 'object',
      properties: {
        cartId: {
          type: 'string',
          description: 'Cart ID to submit',
        },
        provider: {
          type: 'string',
          enum: ['instacart', 'walmart', 'kroger'],
          description: 'Grocery provider',
        },
      },
      required: ['cartId', 'provider'],
    },
  },
  {
    name: 'list_pantry_items',
    description: 'List all items in the user pantry',
    inputSchema: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          enum: ['refrigerator', 'freezer', 'pantry', 'other'],
          description: 'Optional filter by storage location',
        },
      },
    },
  },
  {
    name: 'apply_weekly_plan_to_cart',
    description: 'Generate shopping list from weekly meal plan and create cart',
    inputSchema: {
      type: 'object',
      properties: {
        week: {
          type: 'string',
          description: 'Week in ISO format (YYYY-WXX)',
        },
        provider: {
          type: 'string',
          enum: ['instacart', 'walmart', 'kroger'],
          description: 'Grocery provider for the cart',
        },
      },
      required: ['week', 'provider'],
    },
  },
];

export async function handleToolCall(
  name: string,
  args: Record<string, unknown> | undefined
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  // TODO: Implement actual tool handlers
  // For now, return stub responses

  switch (name) {
    case 'search_products':
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              products: [],
              message: 'Product search not yet implemented',
            }),
          },
        ],
      };

    case 'create_cart':
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              cartId: 'stub-cart-id',
              message: 'Cart creation not yet implemented',
            }),
          },
        ],
      };

    case 'replace_item':
    case 'remove_item':
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: 'Cart modification not yet implemented',
            }),
          },
        ],
      };

    case 'submit_order':
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              orderId: 'stub-order-id',
              message: 'Order submission not yet implemented',
            }),
          },
        ],
      };

    case 'list_pantry_items':
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              items: [],
              message: 'Pantry listing not yet implemented',
            }),
          },
        ],
      };

    case 'apply_weekly_plan_to_cart':
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              cartId: 'stub-cart-id',
              itemCount: 0,
              message: 'Weekly plan to cart not yet implemented',
            }),
          },
        ],
      };

    default:
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: `Unknown tool: ${name}` }),
          },
        ],
      };
  }
}
