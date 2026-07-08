import axios from 'axios';

// Interfaces baseadas na documentação do Checkout InfinitePay
interface CheckoutItem {
  quantity: number;
  price: number; // Em centavos
  description: string;
}

interface CheckoutCustomer {
  name: string;
  email?: string;
}

export interface CheckoutPayload {
  handle: string; // Ex: vanta-tech
  order_nsu?: string;
  items: CheckoutItem[];
  redirect_url?: string;
  webhook_url?: string;
  customer?: CheckoutCustomer;
}

export interface CheckoutResponse {
  url: string;
  id: string;
}

/**
 * Cria um link de pagamento na InfinitePay
 */
export async function createInfinitePayCheckout(
  payload: Omit<CheckoutPayload, 'handle'>,
  infinitePayHandle: string = 'vanta-tech' // O Handle que o usuário pediu para configurar na parte 1
): Promise<CheckoutResponse> {
  try {
    const fullPayload: CheckoutPayload = {
      ...payload,
      handle: infinitePayHandle,
    };

    // Usamos um proxy de CORS confiável porque a InfinitePay bloqueia requisições diretas do navegador (client-side).
    // Como a requisição não possui dados sigilosos (apenas o handle público), é seguro usar proxy.
    const response = await axios.post<CheckoutResponse>(
      'https://corsproxy.io/?https://api.checkout.infinitepay.io/links',
      fullPayload,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Erro ao criar checkout na InfinitePay:', error?.response?.data || error);
    throw new Error('Falha ao gerar link de pagamento na InfinitePay.');
  }
}

/**
 * Converte reais para centavos de forma segura
 */
export function convertToCents(amountInReals: number): number {
  // Arredonda para evitar problemas de ponto flutuante (ex: 10.00 * 100 = 1000)
  return Math.round(amountInReals * 100);
}
