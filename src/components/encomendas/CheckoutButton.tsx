import React, { useState } from 'react';
import { DollarSign, Loader2 } from 'lucide-react';
import { createInfinitePayCheckout, convertToCents } from '../../services/infinitepay';

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
  label = 'Gerar Link InfinitePay'
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
        // Usando window.location.origin o link sempre vai voltar para o site correto:
        // Se estiver testando no PC, volta pro PC. Se estiver no ar, volta pro ar.
        redirect_url: window.location.origin + '/perfil',
        webhook_url: window.location.origin + '/api/webhook'
      };

      // Sempre enviamos o nome do cliente se existir
      payload.customer = {
        name: clienteNome || 'Cliente'
      };

      // Só enviamos o email se ele for válido
      if (clienteEmail && clienteEmail.includes('@')) {
        payload.customer.email = clienteEmail;
      }

      const response = await createInfinitePayCheckout(payload);

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
