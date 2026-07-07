import { useState, useEffect } from 'react';
import { X, Trash2, ShoppingBag, MapPin, ChevronDown, AlertCircle, ArrowLeft, CreditCard, Loader2, Tag, CheckCircle } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAlert } from '@/contexts/AlertContext';
import { FaWhatsapp } from 'react-icons/fa6';
import { supabase } from '@/lib/supabase';

const TAXAS_CARTAO = {
  1: 3.15,
  2: 5.39,
  3: 6.12,
  4: 6.85,
  5: 7.57,
  6: 8.28,
  7: 8.99,
  8: 9.69,
  9: 10.38,
  10: 11.06,
  11: 11.74,
  12: 12.4
};

// VantaTech coordinates (Avenida Luiz Antonio Correa da Silva, 269 - Vila Xavier)
const STORE_LAT = -21.7819305;
const STORE_LON = -48.1306358;

// Haversine formula to calculate distance in KM
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export default function CartDrawer() {
  const { isCartOpen, setIsCartOpen, items, removeFromCart, updateQuantity, cartTotal, clearCart, addToCart } = useCart();
  const { user, perfil, refreshPerfil } = useAuth();
  const { showAlert } = useAlert();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [adicionaisDisponiveis, setAdicionaisDisponiveis] = useState<any[]>([]);

  const [pagamento, setPagamento] = useState('PIX');
  const [showPagamento, setShowPagamento] = useState(false);

  const [parcelas, setParcelas] = useState(1);
  const [showParcelas, setShowParcelas] = useState(false);

  const [endereco, setEndereco] = useState({
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: ''
  });

  // Shipping State
  const [frete, setFrete] = useState(0);
  const [distanciaKm, setDistanciaKm] = useState(0);
  const [isCalculatingFrete, setIsCalculatingFrete] = useState(false);
  const [freteError, setFreteError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cupom State
  const [cupomCode, setCupomCode] = useState('');
  const [cupomAplicado, setCupomAplicado] = useState<any>(null);
  const [isApplyingCupom, setIsApplyingCupom] = useState(false);
  const [cupomMessage, setCupomMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);

  // Toast Notification State
  const [cartToast, setCartToast] = useState<{ message: string, id: number } | null>(null);

  const showCartToast = (message: string) => {
    const id = Date.now();
    setCartToast({ message, id });
    setTimeout(() => {
      setCartToast(prev => prev?.id === id ? null : prev);
    }, 2000);
  };

  useEffect(() => {
    if (perfil) {
      setEndereco({
        cep: perfil.cep || '',
        rua: perfil.rua || '',
        numero: perfil.numero || '',
        bairro: perfil.bairro || '',
        cidade: perfil.cidade || '',
        estado: perfil.estado || ''
      });
    }
  }, [perfil]);

  useEffect(() => {
    async function fetchAdicionais() {
      if (isCartOpen) {
        try {
          const { data } = await supabase
            .from('produtos')
            .select('*')
            .eq('is_adicional', true)
            .eq('ativo', true)
            .limit(3);
          
          setAdicionaisDisponiveis(data || []);
        } catch (err) {
          console.error('Erro ao buscar adicionais:', err);
        }
      }
    }
    fetchAdicionais();
  }, [isCartOpen]);

  // Reset parcelas if payment method changes from Credit Card
  useEffect(() => {
    if (pagamento !== 'Cartão de Crédito') {
      setParcelas(1);
    }
  }, [pagamento]);

  // Reset step to 1 when drawer closes
  useEffect(() => {
    if (!isCartOpen) {
      setTimeout(() => {
        setStep(1);
        setFreteError('');
      }, 300);
    }
  }, [isCartOpen]);

  useEffect(() => {
    if (step === 3 && Math.max(0, cartTotal - (cupomAplicado?.valor_desconto || 0)) + frete === 0) {
      setPagamento('Vanta Club');
    }
  }, [step, cartTotal, frete, cupomAplicado]);

  // Monitora continuamente a validade do cupom aplicado
  useEffect(() => {
    if (!cupomAplicado || !cupomAplicado.data_expiracao) return;

    const checkExpiration = () => {
      let expDateStr = cupomAplicado.data_expiracao;
      if (!expDateStr.endsWith('Z') && !expDateStr.includes('+') && !expDateStr.includes('-')) {
        expDateStr += 'Z';
      }

      if (new Date(expDateStr) < new Date()) {
        setCupomAplicado(null);
        setCupomMessage({ text: 'Seu cupom acabou de expirar!', type: 'error' });
      }
    };

    const intervalId = setInterval(checkExpiration, 1000);
    return () => clearInterval(intervalId);
  }, [cupomAplicado]);

  if (!isCartOpen) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  };

  let cupomDiscount = 0;
  if (cupomAplicado) {
    if (cupomAplicado.tipo_desconto === 'porcentagem') {
      cupomDiscount = cartTotal * (cupomAplicado.valor_desconto / 100);
    } else {
      cupomDiscount = Math.min(cupomAplicado.valor_desconto, cartTotal);
    }
  }

  const isPix = pagamento === 'PIX';
  const pixDiscount = 0;
  const currentRate = TAXAS_CARTAO[parcelas as keyof typeof TAXAS_CARTAO] || 0;

  // Frete é somado ANTES do juros do cartão, e os descontos são aplicados só no valor dos produtos
  const baseValueForInstallments = Math.max(0, cartTotal - cupomDiscount) + frete;
  const finalTotal = isPix
    ? (Math.max(0, cartTotal - cupomDiscount) - pixDiscount + frete)
    : pagamento === 'Cartão de Crédito'
      ? baseValueForInstallments / (1 - (currentRate / 100))
      : baseValueForInstallments;

  const installmentValue = finalTotal / parcelas;
  const interestValue = finalTotal - baseValueForInstallments;

  const totalPoints = items.reduce((acc, item) => acc + ((item.pointsCost || 0) * item.quantity), 0);

  const handleCepChange = async (value: string) => {
    setEndereco({ ...endereco, cep: value });
    const rawCep = value.replace(/\D/g, '');

    if (rawCep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
        const data = await res.json();

        if (!data.erro) {
          setEndereco(prev => ({
            ...prev,
            cep: value,
            rua: data.logradouro || prev.rua,
            bairro: data.bairro || prev.bairro,
            cidade: data.localidade || prev.cidade,
            estado: data.uf || prev.estado
          }));
        }
      } catch (error) {
        console.error("Erro ao buscar CEP", error);
      }
    }
  };

  const calculateShippingAndProceed = async () => {
    const { cep, rua, numero, bairro, cidade, estado } = endereco;

    // Validar se todos os campos (exceto complemento) estão preenchidos
    if (!cep || !rua || !numero || !bairro || !cidade || !estado) {
      showAlert({ title: 'Atenção', message: 'Preencha todos os campos obrigatórios do endereço para continuar.', type: 'warning' });
      return;
    }

    setIsCalculatingFrete(true);
    setFreteError('');

    try {
      const query = encodeURIComponent(`${rua}, ${cidade}, ${estado}, Brasil`);
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const distance = getDistanceFromLatLonInKm(STORE_LAT, STORE_LON, parseFloat(lat), parseFloat(lon));
        setDistanciaKm(distance);

        if (distance <= 5) setFrete(0);
        else if (distance <= 20) setFrete(20);
        else if (distance <= 30) setFrete(40);
        else if (distance <= 40) setFrete(50);
        else if (distance <= 50) setFrete(60);
        else {
          setFreteError(`A distância é de ${distance.toFixed(1)}km. Não fazemos entregas acima de 50km.`);
          setIsCalculatingFrete(false);
          return;
        }

        // Se o usuário está logado e não tem endereço salvo, perguntar se quer salvar
        if (user && perfil && !perfil.cep) {
          const querSalvar = await showAlert({
            title: 'Salvar Endereço?',
            message: 'Você ainda não tem um endereço salvo. Deseja salvar este endereço no seu perfil para as próximas compras?',
            type: 'info',
            showConfirm: true,
            confirmText: 'Sim, salvar',
            cancelText: 'Não, apenas continuar'
          });

          if (querSalvar) {
            try {
              await supabase.from('perfis').update({
                cep, rua, numero, complemento: endereco.complemento, bairro, cidade, estado
              }).eq('id', user.id);
              await refreshPerfil();
            } catch (error) {
              console.error("Erro ao salvar endereço:", error);
            }
          }
        }

        // Sucesso
        const temAparelho = items.some(item => !item.isItem);
        if (adicionaisDisponiveis.length > 0 && temAparelho) {
          setStep(3);
        } else {
          setStep(4);
        }
      } else {
        setFreteError('Não encontramos o endereço no mapa. Digite com mais precisão.');
      }
    } catch (error) {
      console.error(error);
      setFreteError('Erro ao se conectar ao satélite. Tente novamente.');
    } finally {
      setIsCalculatingFrete(false);
    }
  };

  const handleCheckout = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (user) {
      try {
        const umMinutoAtras = new Date(Date.now() - 60000).toISOString();
        const { data: pedidosRecentes } = await supabase
          .from('pedidos')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'Pendente')
          .gte('criado_em', umMinutoAtras)
          .limit(1);

        if (pedidosRecentes && pedidosRecentes.length > 0) {
          showAlert({
            title: 'Atenção',
            message: 'Você acabou de enviar um pedido! Aguarde alguns minutos antes de fazer outro.',
            type: 'warning'
          });
          return;
        }

        setIsSubmitting(true);

        // Re-validação do Cupom no momento do fechamento
        if (cupomAplicado) {
          if (cupomAplicado.data_expiracao && new Date(cupomAplicado.data_expiracao) < new Date()) {
            showAlert({ title: 'Cupom Expirado', message: 'O cupom aplicado expirou enquanto você estava no carrinho. Ele foi removido.', type: 'warning' });
            setCupomAplicado(null);
            setIsSubmitting(false);
            return;
          }
          if (cupomAplicado.quantidade_disponivel !== null && cupomAplicado.quantidade_disponivel <= 0) {
            showAlert({ title: 'Cupom Esgotado', message: 'O cupom aplicado esgotou enquanto você estava no carrinho. Ele foi removido.', type: 'warning' });
            setCupomAplicado(null);
            setIsSubmitting(false);
            return;
          }
        }

        const productIds = items.map(i => i.productId);
        const { data: soldItems } = await supabase
          .from('itens_pedido')
          .select(`
            produto_id,
            produto_nome,
            pedidos!inner(status, user_id)
          `)
          .in('produto_id', productIds)
          .in('pedidos.status', ['Pendente', 'Pago', 'Enviado', 'Entregue']);

        if (soldItems && soldItems.length > 0) {
          const unavailableItems = items.filter(item => {
            return soldItems.some(soldItem => {
              if (soldItem.produto_id !== item.productId) return false;

              const status = (soldItem.pedidos as any).status;
              const orderUserId = (soldItem.pedidos as any).user_id;

              // Bloqueio global (para todos) apenas se for Aparelho e já estiver vendido/enviado
              const isBlockedGlobally = !item.isItem && (status === 'Enviado' || status === 'Entregue');

              // Bloqueio por usuário: não deixa criar outro igual se já tiver um pendente
              const isBlockedForUser = orderUserId === user.id && status === 'Pendente';

              if (!isBlockedGlobally && !isBlockedForUser) return false;

              const corMatch = soldItem.produto_nome.match(/Cor:\s*([^-]+)/i);
              const storageMatch = soldItem.produto_nome.match(/Cor:\s*[^-]+\s*-\s*(.+)$/i);

              const soldColor = corMatch && corMatch[1] ? corMatch[1].trim().toLowerCase() : '';
              const soldStorage = storageMatch && storageMatch[1] ? storageMatch[1].trim().toLowerCase() : '';

              const itemColor = (item.color || '').toLowerCase();
              const itemStorage = (item.storage || '').toLowerCase();

              if (soldColor && soldStorage) {
                return soldColor === itemColor && soldStorage === itemStorage;
              } else if (soldColor) {
                return soldColor === itemColor;
              }

              return true;
            });
          });

          if (unavailableItems.length > 0) {
            showAlert({
              title: 'Produto Indisponível',
              message: `Você já tem um pedido para: ${unavailableItems[0].name}, ou ele esgotou. Por favor, remova-o.`,
              type: 'error'
            });
            setIsSubmitting(false);
            return;
          }
        }
      } catch (err) {
        console.error("Erro ao verificar dados antes do checkout:", err);
      }
    }

    if (user) {
      try {
        const payloadPedido: any = {
          user_id: user.id,
          total: finalTotal,
          status: 'Pendente',
          subtotal: cartTotal,
          frete: frete,
          forma_pagamento: pagamento,
          desconto_pix: pixDiscount,
          juros_cartao: interestValue,
          parcelas: pagamento === 'Cartão de Crédito' ? parcelas : 1,
          endereco_entrega: (endereco.cep || endereco.rua) ? endereco : null
        };

        if (cupomAplicado) {
          payloadPedido.cupom_id = cupomAplicado.id;
          payloadPedido.desconto_cupom = cupomDiscount;
        }

        const { data: pedido, error: errorPedido } = await supabase
          .from('pedidos')
          .insert(payloadPedido)
          .select()
          .single();

        if (errorPedido) throw errorPedido;

        if (pedido) {

          const itensToInsert = items.map(item => {
            let nomeDetalhado = item.name;
            if (item.color) nomeDetalhado += ` - Cor: ${item.color}`;
            if (item.storage) nomeDetalhado += ` - ${item.storage}`;

            return {
              pedido_id: pedido.id,
              produto_id: item.productId,
              produto_nome: nomeDetalhado,
              produto_preco: item.pointsCost || item.price,
              quantidade: item.quantity || 1,
              imagem_url: item.image
            };
          });

          const { error: errorItens } = await supabase
            .from('itens_pedido')
            .insert(itensToInsert);

          if (errorItens) throw errorItens;

          if (totalPoints > 0 && perfil) {
            const novosPontos = (perfil.pontos || 0) - totalPoints;
            await supabase.from('perfis').update({ pontos: novosPontos }).eq('id', user.id);
            await supabase.from('historico_pontos').insert({
              user_id: user.id,
              tipo: 'saida',
              quantidade: totalPoints,
              descricao: `Resgate: ${items.filter(i => i.pointsCost).map(i => i.name).join(', ')} (Pedido #${pedido.numero})`
            });
            if (refreshPerfil) {
              await refreshPerfil();
            }
          }
        }
      } catch (error) {
        console.error("Erro ao salvar pedido no banco:", error);
      }
    }

    const text = items.map(item =>
      `*${item.quantity}x ${item.name}*\n     Cor: ${item.color || 'Padrão'} | Armazenamento: ${item.storage || 'Padrão'}\n     Valor: ${item.pointsCost ? (item.pointsCost * item.quantity) + ' pts' : formatPrice(item.price * item.quantity)}`
    ).join('\n\n');

    let message = `*NOVO PEDIDO - VANTATECH*\n\n`;
    message += `*PRODUTOS:*\n${text}\n\n`;
    message += `---------------------------------------\n\n`;

    if (endereco.cep || endereco.rua) {
      message += `*ENDEREÇO DE ENTREGA:*\n${endereco.rua}, ${endereco.numero}\nBairro: ${endereco.bairro}\n${endereco.cidade} - ${endereco.estado}\nCEP: ${endereco.cep}\n\n`;
      message += `---------------------------------------\n\n`;
    }

    message += `*RESUMO FINANCEIRO:*\n`;
    message += `Subtotal: ${formatPrice(cartTotal)}\n`;
    
    if (totalPoints > 0) {
      message += `Pontos Gastos: ${totalPoints.toLocaleString('pt-BR')} pts\n`;
    }

    if (cupomAplicado) {
      message += `Cupom Aplicado (${cupomAplicado.codigo}): - ${formatPrice(cupomDiscount)}\n`;
    }

    if (frete > 0) {
      message += `Frete (Motoboy): + ${formatPrice(frete)}\n`;
    } else {
      message += `Frete (Motoboy): Grátis\n`;
    }

    if (pagamento === 'Cartão de Crédito') {
      message += `Forma de Pagamento: Cartão de Crédito (${parcelas}x)\n`;
      if (parcelas > 1) {
        message += `Taxa Maquininha: + ${formatPrice(interestValue)}\n`;
        message += `\n*Valor da Parcela: ${parcelas}x de ${formatPrice(installmentValue)}*\n`;
      }
    } else if (pagamento === 'PIX') {
      message += `Forma de Pagamento: PIX\n`;
    } else {
      message += `Forma de Pagamento: ${pagamento}\n`;
    }

    message += `\n*TOTAL FINAL: ${formatPrice(finalTotal)}*`;

    // Atualizar uso do cupom se existir
    if (cupomAplicado && cupomAplicado.quantidade_disponivel !== null) {
      try {
        const novosUsos = cupomAplicado.quantidade_disponivel - 1;
        const payload: any = { quantidade_disponivel: novosUsos };

        await supabase
          .from('cupons')
          .update(payload)
          .eq('id', cupomAplicado.id);
      } catch (err) {
        console.error('Erro ao diminuir uso do cupom:', err);
      }
    }
    clearCart();
    removeCupom();
    const url = `https://wa.me/5516997700430?text=${encodeURIComponent(message)}`;

    setIsSubmitting(false);
    window.open(url, '_blank');
  };

  const applyCupom = async () => {
    if (!cupomCode) return;
    setIsApplyingCupom(true);
    try {
      const { data, error } = await supabase
        .from('cupons')
        .select('*')
        .eq('codigo', cupomCode.toUpperCase())
        .eq('ativo', true)
        .single();

      if (error || !data) {
        throw new Error('Cupom inválido ou inativo.');
      }

      if (data.quantidade_disponivel !== null && data.quantidade_disponivel <= 0) {
        throw new Error('Este cupom esgotou.');
      }

      // Validação de Data de Expiração (Tratando timezone)
      if (data.data_expiracao) {
        let expDateStr = data.data_expiracao;
        if (!expDateStr.endsWith('Z') && !expDateStr.includes('+') && !expDateStr.includes('-')) {
          expDateStr += 'Z';
        }

        if (new Date(expDateStr) < new Date()) {
          throw new Error('Este cupom expirou.');
        }
      }

      // Validação de Uso Único por Pessoa
      if (user) {
        try {
          const { data: jaUsou, error: erroUso } = await supabase
            .from('pedidos')
            .select('id')
            .eq('user_id', user.id)
            .eq('cupom_id', data.id)
            .limit(1);

          if (!erroUso && jaUsou && jaUsou.length > 0) {
            throw new Error('Você já utilizou este cupom em uma compra anterior.');
          }
        } catch (err: any) {
          // Se der erro pq a coluna ainda nao existe, ignora pra nao quebrar, 
          // ou propaga se for o throw de uso unico
          if (err.message === 'Você já utilizou este cupom em uma compra anterior.') {
            throw err;
          }
        }
      }

      // Validação de Usuário Específico
      if (data.user_id) {
        if (!user || user.id !== data.user_id) {
          throw new Error('Este cupom não está disponível para o seu usuário.');
        }
      }

      // Validação de Valor Mínimo
      if (data.valor_minimo !== null && cartTotal < data.valor_minimo) {
        throw new Error(`Este cupom exige um pedido mínimo de ${formatPrice(data.valor_minimo)}.`);
      }

      // Validação de Valor Máximo
      if (data.valor_maximo !== null && cartTotal > data.valor_maximo) {
        throw new Error(`Este cupom só é válido para pedidos de até ${formatPrice(data.valor_maximo)}.`);
      }

      // Validação de Categoria
      if (data.categoria_nome) {
        const hasCategoryItem = items.some(item => item.category === data.categoria_nome);
        if (!hasCategoryItem) {
          throw new Error(`Este cupom exige ao menos um produto da categoria "${data.categoria_nome}" no carrinho.`);
        }
      }

      // Validação de Nível do Clube
      if (data.nivel_id) {
        if (!user || !perfil) {
          throw new Error('Você precisa estar logado para usar este cupom restrito a membros do Clube.');
        }

        const { data: nivelData, error: nivelError } = await supabase
          .from('niveis_fidelidade')
          .select('nome, pontos_minimos')
          .eq('id', data.nivel_id)
          .single();

        if (!nivelError && nivelData) {
          const userPontos = perfil.pontos_acumulados || 0;
          if (userPontos < nivelData.pontos_minimos) {
            throw new Error(`Este cupom é exclusivo para clientes Nível ${nivelData.nome} ou superior.`);
          }
        }
      }

      setCupomAplicado(data);
      setCupomMessage({ text: 'Desconto adicionado com sucesso!', type: 'success' });
    } catch (err: any) {
      setCupomMessage({ text: err.message || 'Cupom inválido.', type: 'error' });
      setCupomAplicado(null);
    } finally {
      setIsApplyingCupom(false);
    }
  };

  const removeCupom = () => {
    setCupomAplicado(null);
    setCupomCode('');
    setCupomMessage(null);
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] transition-opacity animate-in fade-in duration-300"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-gray-900 z-[70] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-gray-100 dark:border-gray-800">

        {/* Toast Notification */}
        {cartToast && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[80] animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-300 pointer-events-none w-[90%] max-w-[320px]">
            <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-3 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-gray-100 dark:border-gray-700 text-sm font-medium flex items-center gap-3 w-full">
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="truncate flex-1 font-bold text-sm">{cartToast.message}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3 text-vanta-darkblue dark:text-white">
            {step === 1 ? (
              <ShoppingBag className="w-5 h-5" />
            ) : (
              <button
                onClick={() => {
                  if (step === 4) {
                    const temAparelho = items.some(item => !item.isItem);
                    setStep(adicionaisDisponiveis.length > 0 && temAparelho ? 3 : 2);
                  } else if (step === 3) {
                    setStep(2);
                  } else if (step === 2) {
                    setStep(1);
                  }
                  setFreteError('');
                }}
                className="p-1.5 -ml-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}

            <h2 className="text-lg font-black tracking-tight">
              {step === 1 && "Meu Carrinho"}
              {step === 2 && "Endereço de Entrega"}
              {step === 3 && "Aproveite também"}
              {step === 4 && "Pagamento"}
            </h2>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {items.length > 0 && (
          <div className="flex bg-gray-100 dark:bg-gray-800 h-1">
            <div className={`bg-vanta-blue h-full transition-all duration-300 ${step === 1 ? 'w-1/4' : step === 2 ? 'w-2/4' : step === 3 ? 'w-3/4' : 'w-full'}`}></div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-10 h-10 text-gray-300 dark:text-gray-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">Sua sacola está vazia</p>
                <p className="text-sm text-gray-500 mt-1">Adicione produtos para continuar.</p>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="px-6 py-2.5 bg-vanta-blue/10 text-vanta-blue font-bold rounded-xl mt-4 hover:bg-vanta-blue hover:text-white transition-colors"
              >
                Continuar Comprando
              </button>
            </div>
          ) : (
            <div className="h-full">
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                  <div className="flex items-center justify-center gap-1.5 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 text-[11px] sm:text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wide mb-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    O Pagamento é realizado apenas no ato da entrega!
                  </div>
                  {items.map(item => (
                    <div key={item.id} className="flex gap-4 border-b border-gray-50 dark:border-gray-800 pb-4">
                      <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center justify-center p-2 flex-shrink-0">
                        <img src={item.image || '/placeholder.png'} alt={item.name} className="w-full h-full object-contain" />
                      </div>

                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-tight break-words mb-0.5">
                            {item.name}
                          </h4>
                          <div className="text-xs text-gray-500 font-medium">
                            {item.color || 'Cor Única'}{item.storage ? ` • ${item.storage}` : ''}
                          </div>
                        </div>

                        <div className="flex items-end justify-between mt-2">
                          <div className="text-vanta-blue dark:text-blue-400 font-bold text-base">
                            {item.pointsCost ? (
                              <span className="text-vanta-orange">{(item.pointsCost * item.quantity).toLocaleString('pt-BR')} pts</span>
                            ) : (
                              formatPrice(item.price * item.quantity)
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            {(item.isItem && !item.storage) && (
                              <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 border border-gray-200 dark:border-gray-700">
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                                >
                                  <span className="font-bold leading-none select-none text-base mb-0.5">-</span>
                                </button>
                                <span className="w-6 text-center text-xs font-bold text-gray-900 dark:text-white select-none">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => {
                                    if (typeof item.maxQuantity === 'number' && item.quantity >= item.maxQuantity) return;
                                    updateQuantity(item.id, item.quantity + 1);
                                  }}
                                  disabled={typeof item.maxQuantity === 'number' && item.quantity >= item.maxQuantity}
                                  className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${typeof item.maxQuantity === 'number' && item.quantity >= item.maxQuantity
                                      ? 'text-gray-300 cursor-not-allowed'
                                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                                  title={typeof item.maxQuantity === 'number' && item.quantity >= item.maxQuantity ? 'Estoque máximo atingido' : ''}
                                >
                                  <span className="font-bold leading-none select-none text-base mb-0.5">+</span>
                                </button>
                              </div>
                            )}

                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                              title="Remover produto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                        <MapPin className="w-5 h-5 text-vanta-blue" />
                        <h3 className="font-bold text-base">Onde deseja receber?</h3>
                      </div>
                      {(endereco.cep || endereco.rua) && (
                        <button
                          onClick={() => setEndereco({ cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' })}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors flex items-center gap-1.5 text-[10px] font-bold uppercase"
                          title="Limpar endereço"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Limpar
                        </button>
                      )}
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">CEP</label>
                          <input
                            id="cep"
                            name="cep"
                            type="text"
                            value={endereco.cep}
                            onChange={e => handleCepChange(e.target.value)}
                            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-vanta-blue transition-colors"
                            placeholder="00000-000"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Rua</label>
                          <input
                            id="rua"
                            name="rua"
                            type="text"
                            value={endereco.rua}
                            onChange={e => setEndereco({ ...endereco, rua: e.target.value })}
                            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-vanta-blue transition-colors"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Número</label>
                          <input
                            id="numero"
                            name="numero"
                            type="text"
                            value={endereco.numero}
                            onChange={e => setEndereco({ ...endereco, numero: e.target.value })}
                            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-vanta-blue transition-colors"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Bairro</label>
                          <input
                            id="bairro"
                            name="bairro"
                            type="text"
                            value={endereco.bairro}
                            onChange={e => setEndereco({ ...endereco, bairro: e.target.value })}
                            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-vanta-blue transition-colors"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Cidade</label>
                          <input
                            id="cidade"
                            name="cidade"
                            type="text"
                            value={endereco.cidade}
                            onChange={e => setEndereco({ ...endereco, cidade: e.target.value })}
                            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-vanta-blue transition-colors"
                          />
                        </div>
                        <div className="col-span-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Estado</label>
                          <input
                            id="estado"
                            name="estado"
                            type="text"
                            value={endereco.estado}
                            onChange={e => setEndereco({ ...endereco, estado: e.target.value })}
                            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-vanta-blue transition-colors"
                            placeholder="UF"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="bg-vanta-blue/5 border border-vanta-blue/20 rounded-xl p-5">
                    <h3 className="font-black text-lg text-vanta-darkblue dark:text-white mb-2">Aproveite para levar junto</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Acessórios recomendados para você:</p>
                    
                    <div className="space-y-3">
                      {adicionaisDisponiveis.map((acessorio) => {
                        const cartItem = items.find(i => i.productId === acessorio.id);
                        const inCart = !!cartItem;
                        return (
                          <div key={acessorio.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-vanta-blue/30 rounded-2xl shadow-sm transition-all group">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 bg-gray-50 dark:bg-gray-800/80 rounded-xl overflow-hidden p-1.5 shrink-0 group-hover:scale-105 transition-transform">
                                <img src={acessorio.imagem_url || '/Phone.png'} alt={acessorio.nome} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1 max-w-[160px]">{acessorio.nome}</span>
                                <span className="text-sm font-black text-vanta-blue mt-0.5">{Number(acessorio.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                              </div>
                            </div>
                            
                            {inCart ? (
                              <button 
                                onClick={() => removeFromCart(cartItem.id)}
                                title="Remover acessório"
                                className="w-9 h-9 flex items-center justify-center bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-500 rounded-full transition-colors shrink-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            ) : (
                              <button 
                                onClick={() => {
                                  addToCart({
                                    productId: acessorio.id,
                                    name: acessorio.nome,
                                    price: Number(acessorio.preco),
                                    image: acessorio.imagem_url || '/Phone.png',
                                    category: acessorio.categoria,
                                    quantity: 1,
                                    isItem: true,
                                    maxQuantity: typeof acessorio.estoque === 'number' ? acessorio.estoque : undefined
                                  });
                                  showCartToast('Adicionado com sucesso!');
                                }}
                                className="px-4 py-2 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 text-white text-xs font-bold rounded-full transition-all flex items-center justify-center shadow-md hover:shadow-lg shrink-0"
                              >
                                Adicionar
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  {finalTotal > 0 ? (
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-2 text-gray-900 dark:text-white mb-4">
                        <CreditCard className="w-5 h-5 text-vanta-blue" />
                        <h3 className="font-bold text-base">Forma de Pagamento</h3>
                      </div>

                      <div className="relative mb-5">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Selecione uma opção</label>
                      <button
                        onClick={() => setShowPagamento(!showPagamento)}
                        className="w-full flex items-center justify-between gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-vanta-blue transition-all"
                      >
                        <span>{pagamento}</span>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showPagamento ? 'rotate-180' : ''}`} />
                      </button>

                      {showPagamento && (
                        <>
                          <div className="fixed inset-0 z-[60]" onClick={() => setShowPagamento(false)} />
                          <div className="absolute left-0 right-0 top-full mt-2 w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] z-[70] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            {['PIX', 'Dinheiro', 'Cartão de Crédito', 'Cartão de Débito'].map(option => (
                              <button
                                key={option}
                                onClick={() => {
                                  setPagamento(option);
                                  setShowPagamento(false);
                                }}
                                className={`w-full text-left px-4 py-3.5 text-sm font-bold transition-colors ${pagamento === option
                                    ? 'bg-vanta-blue/10 text-vanta-blue'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                                  }`}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {pagamento === 'Cartão de Crédito' && (
                      <div className="relative animate-in fade-in duration-300">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Quantidade de Parcelas</label>
                        <button
                          onClick={() => setShowParcelas(!showParcelas)}
                          className="w-full flex items-center justify-between gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-sm font-bold text-vanta-blue outline-none focus:border-vanta-blue transition-all"
                        >
                          <span>{parcelas}x de {formatPrice((baseValueForInstallments / (1 - ((TAXAS_CARTAO[parcelas as keyof typeof TAXAS_CARTAO] || 0) / 100))) / parcelas)}</span>
                          <ChevronDown className={`w-4 h-4 text-vanta-blue transition-transform ${showParcelas ? 'rotate-180' : ''}`} />
                        </button>

                        {showParcelas && (
                          <>
                            <div className="fixed inset-0 z-[60]" onClick={() => setShowParcelas(false)} />
                            <div className="absolute left-0 right-0 top-full mt-2 w-full max-h-64 overflow-y-auto custom-scrollbar bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] z-[70] animate-in fade-in zoom-in-95 duration-200">
                              {Object.entries(TAXAS_CARTAO).map(([numStr, rate]) => {
                                const num = parseInt(numStr);
                                const parValue = (baseValueForInstallments / (1 - (rate / 100))) / num;
                                return (
                                  <button
                                    key={num}
                                    onClick={() => {
                                      setParcelas(num);
                                      setShowParcelas(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${parcelas === num
                                        ? 'bg-vanta-blue/10 text-vanta-blue font-bold'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                                      }`}
                                  >
                                    <span>{num}x</span>
                                    <span>{formatPrice(parValue)}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  ) : (
                    <div className="bg-green-50 dark:bg-green-900/10 rounded-xl p-6 border border-green-100 dark:border-green-900/30 text-center flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mb-4 text-green-600 dark:text-green-400">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <h3 className="font-black text-lg text-green-800 dark:text-green-400 mb-2">Pagamento Isento</h3>
                      <p className="text-sm text-green-700 dark:text-green-500 font-medium leading-relaxed">
                        Seu pedido foi pago integralmente com pontos do Vanta Club ou frete grátis. Você não precisa selecionar nenhuma forma de pagamento!
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-5 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shrink-0 shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.05)] relative z-40">

            {/* Cupom Section (Sempre Visível) */}
            <div className="mb-4">
              {cupomAplicado ? (
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/30">
                  <div>
                    <p className="text-xs font-bold text-green-700 dark:text-green-500 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      Cupom: {cupomAplicado.codigo}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-0.5">
                      -{formatPrice(cupomDiscount)} no pedido
                    </p>
                  </div>
                  <button onClick={removeCupom} className="text-gray-400 hover:text-red-500 transition-colors p-1" title="Remover cupom">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Código do cupom"
                      value={cupomCode}
                      onChange={(e) => {
                        setCupomCode(e.target.value.toUpperCase());
                        setCupomMessage(null);
                      }}
                      className={`flex-1 px-3 py-2 text-sm border rounded-xl bg-gray-50 dark:bg-gray-800 focus:ring-2 outline-none uppercase font-bold transition-all ${cupomMessage?.type === 'error'
                          ? 'border-red-300 dark:border-red-500/50 focus:ring-red-500/20 focus:border-red-500'
                          : 'border-gray-200 dark:border-gray-700 focus:ring-vanta-blue/20 focus:border-vanta-blue'
                        }`}
                    />
                    <button
                      onClick={applyCupom}
                      disabled={!cupomCode || isApplyingCupom}
                      className="px-4 bg-gray-900 hover:bg-black dark:bg-vanta-blue dark:hover:bg-blue-600 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center min-w-[90px]"
                    >
                      {isApplyingCupom ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Aplicar'}
                    </button>
                  </div>
                  {cupomMessage && (
                    <p className={`text-xs font-medium animate-in slide-in-from-top-1 ${cupomMessage.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>
                      {cupomMessage.text}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Resumo Dinâmico */}
            <div className="space-y-1.5 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-medium text-sm">Subtotal</span>
                <span className="text-sm font-bold text-gray-500">{formatPrice(cartTotal)}</span>
              </div>

              {cupomAplicado && (
                <div className="flex items-center justify-between text-green-600 dark:text-green-400">
                  <span className="font-medium text-sm">Desconto Cupom</span>
                  <span className="text-sm font-bold">- {formatPrice(cupomDiscount)}</span>
                </div>
              )}

              {step === 4 && frete > 0 && (
                <div className="flex items-center justify-between animate-in slide-in-from-top-1 duration-300">
                  <span className="text-gray-500 font-medium text-sm">Frete</span>
                  <span className="text-sm font-bold text-gray-500">+ {formatPrice(frete)}</span>
                </div>
              )}

              {step === 4 && frete === 0 && (
                <div className="flex items-center justify-between animate-in slide-in-from-top-1 duration-300">
                  <span className="text-gray-500 font-medium text-sm">Frete</span>
                  <span className="text-sm font-bold text-green-500">Grátis</span>
                </div>
              )}

              {step === 4 && pagamento === 'Cartão de Crédito' && parcelas > 1 && (
                <div className="flex items-center justify-between text-orange-500 animate-in slide-in-from-top-1 duration-300">
                  <span className="font-medium text-xs">Juros (Maquininha)</span>
                  <span className="text-xs font-bold">+ {formatPrice(interestValue)}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-100 dark:border-gray-800">
                <span className="text-gray-700 dark:text-gray-300 font-black text-lg">Total</span>
                <span className="text-2xl font-black text-vanta-blue">
                  {step === 4 ? formatPrice(finalTotal) : formatPrice(Math.max(0, cartTotal - cupomDiscount))}
                </span>
              </div>
              
              {totalPoints > 0 && (
                <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-100 dark:border-gray-800">
                  <span className="text-gray-700 dark:text-gray-300 font-bold text-sm">Pontos Gastos</span>
                  <span className="text-lg font-black text-vanta-orange">
                    {totalPoints.toLocaleString('pt-BR')} pts
                  </span>
                </div>
              )}
            </div>

            {step === 1 && (
              <button
                onClick={() => setStep(2)}
                className="w-full bg-vanta-blue hover:bg-blue-600 text-white py-3.5 rounded-xl font-bold flex items-center justify-center transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                Continuar para Entrega
              </button>
            )}

            {step === 2 && (
              <button
                onClick={calculateShippingAndProceed}
                disabled={isCalculatingFrete}
                className="w-full bg-vanta-blue hover:bg-blue-600 disabled:bg-vanta-blue/50 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                {isCalculatingFrete ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Calculando Frete...
                  </>
                ) : (
                  'Calcular Frete e Continuar'
                )}
              </button>
            )}

            {step === 3 && (
              <button
                onClick={() => setStep(4)}
                className="w-full bg-vanta-blue hover:bg-blue-600 text-white py-3.5 rounded-xl font-bold flex items-center justify-center transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                Ir para o Pagamento
              </button>
            )}

            {step === 4 && (
              <button
                onClick={handleCheckout}
                disabled={isSubmitting}
                className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-70 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(34,197,94,0.3)]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <FaWhatsapp className="w-5 h-5" />
                    Finalizar no WhatsApp
                  </>
                )}
              </button>
            )}

            {step === 1 && (
              <button
                onClick={clearCart}
                className="w-full mt-3 py-1.5 text-xs text-gray-400 font-medium hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Esvaziar carrinho
              </button>
            )}
          </div>
        )}

      </div>
    </>
  );
}
