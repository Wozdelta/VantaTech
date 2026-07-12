import axios from 'axios';

export interface CheckoutPayload {
  order_nsu: string;
  items: { price: number; description: string; quantity: number }[];
  redirect_url: string;
  customer?: { name: string; email?: string };
}

export async function createStripeCheckout(payload: CheckoutPayload): Promise<{ url: string; id: string }> {
  try {
    const apiKey = import.meta.env.VITE_API_STRIPE;
    if (!apiKey) throw new Error('Chave VITE_API_STRIPE não configurada no arquivo .env');

    const params = new URLSearchParams();
    
    // Configura os métodos de pagamento (Pix e Cartão)
    params.append('payment_method_types[0]', 'pix');
    params.append('payment_method_types[1]', 'card');

    // Configura os itens
    payload.items.forEach((item, index) => {
      params.append(`line_items[${index}][price_data][currency]`, 'brl');
      params.append(`line_items[${index}][price_data][product_data][name]`, item.description);
      params.append(`line_items[${index}][price_data][unit_amount]`, item.price.toString());
      params.append(`line_items[${index}][quantity]`, item.quantity.toString());
    });

    params.append('mode', 'payment');
    
    if (payload.customer?.email) {
      params.append('customer_email', payload.customer.email);
    }
    
    // Metadados para identificar o pedido quando o webhook for chamado
    params.append('client_reference_id', payload.order_nsu);
    params.append('metadata[order_id]', payload.order_nsu);
    
    params.append('success_url', payload.redirect_url);
    params.append('cancel_url', payload.redirect_url);

    const response = await axios.post('https://api.stripe.com/v1/checkout/sessions', params, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    return { url: response.data.url, id: response.data.id };
  } catch (error: any) {
    console.error('Erro Stripe:', error?.response?.data || error);
    const errorMessage = error?.response?.data?.error?.message || 'Falha ao gerar link de pagamento na Stripe.';
    throw new Error(errorMessage);
  }
}

/**
 * Converte reais para centavos de forma segura
 */
export function convertToCents(amountInReals: number): number {
  return Math.round(amountInReals * 100);
}
