import React, { useState } from 'react';
import { DollarSign, Loader2 } from 'lucide-react';
import { createStripeCheckout, convertToCents } from '../../services/stripe';

interface CheckoutButtonProps {
  encomendaId: string;
  valorOriginal: number; // in Reais
  nomeProduto: string;
  clienteNome: string;
  clienteEmail: string;
  onSuccess?: (url: string) => void;
  onError?: (error: string) => void;
  label?: string;
}

export default function CheckoutButton({
  encomendaId,
  valorOriginal,
  nomeProduto,
  clienteNome,
  clienteEmail,
  onSuccess,
  onError,
  label = 'Gerar Link Stripe'
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      const priceInCents = convertToCents(valorOriginal);

      const payload: any = {
        order_nsu: encomendaId,
        items: [
          {
            quantity: 1,
            price: priceInCents,
            description: `Sinal: ${nomeProduto}`
          }
        ],
        redirect_url: window.location.origin + '/perfil?tab=encomendas',
        customer: {
          name: clienteNome || 'Cliente'
        }
      };

      if (clienteEmail && clienteEmail.includes('@')) {
        payload.customer.email = clienteEmail;
      }

      const response = await createStripeCheckout(payload);

      if (onSuccess) {
        onSuccess(response.url);
      } else {
        window.location.href = response.url;
      }
    } catch (error: any) {
      if (onError) {
        onError(error.message);
      } else {
        alert(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={isLoading}
      className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <DollarSign className="w-5 h-5" />
      )}
      {isLoading ? 'Aguarde...' : label}
    </button>
  );
}
