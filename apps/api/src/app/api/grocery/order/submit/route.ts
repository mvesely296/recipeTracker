import { createRouteHandler, successResponse } from '@/lib/api/route-handler';
import { submitOrderSchema, type SubmitOrderInput } from '@/lib/validators/grocery';
import { ApiError } from '@/lib/api/errors';

export const POST = createRouteHandler<SubmitOrderInput>({
  bodySchema: submitOrderSchema,
  requireAuth: true,

  async handler(_request, { user, supabase }, { body }) {
    // Get user's grocery provider credentials
    const { data: credentials } = await supabase
      .from('grocery_provider_credentials')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', body.provider)
      .single();

    if (!credentials) {
      throw new ApiError(400, `No ${body.provider} account connected`, 'PROVIDER_NOT_CONNECTED');
    }

    // TODO: Use grocery integration service
    // const adapter = getGroceryAdapter(body.provider);
    // const order = await adapter.submitOrder({ ... });

    // Create order record for audit logging
    const { data: orderRecord } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        provider: body.provider,
        provider_cart_id: body.cartId,
        status: 'submitted',
        substitution_preference: body.substitutionPreference,
        tip: body.tipAmount,
      })
      .select()
      .single();

    return successResponse(
      {
        orderId: orderRecord?.id,
        provider: body.provider,
        status: 'submitted',
        message: 'Order submitted successfully',
      },
      201
    );
  },
});
