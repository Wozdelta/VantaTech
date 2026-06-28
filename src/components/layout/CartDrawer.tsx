import { useState, useEffect } from 'react';
import { X, Trash2, ShoppingBag, MapPin, ChevronDown, AlertCircle, ArrowLeft, CreditCard, Loader2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAlert } from '@/contexts/AlertContext';
import { FaWhatsapp } from 'react-icons/fa6';
import { supabase } from '@/lib/supabase';

const MP_RATES = {
  1: 0,
  2: 0.0253,
  3: 0.0283,
  4: 0.0473,
  5: 0.0483,
  6: 0.0493,
  7: 0.0623,
  8: 0.0642,
  9: 0.0711,
  10: 0.0779,
  11: 0.0901,
  12: 0.1001
};

// VantaTech coordinates (Araraquara - SP)
const STORE_LAT = -21.7826;
const STORE_LON = -48.1717;

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
  const { isCartOpen, setIsCartOpen, items, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
  const { user, perfil } = useAuth();
  const { showAlert } = useAlert();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [pagamento, setPagamento] = useState('PIX');
  const [showPagamento, setShowPagamento] = useState(false);
  
  const [parcelas, setParcelas] = useState(1);
  const [showParcelas, setShowParcelas] = useState(false);
  
  const [endereco, setEndereco] = useState({
    cep: '',
    rua: '',
    numero: '',
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

  if (!isCartOpen) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  };

  const isPix = pagamento === 'PIX';
  const pixDiscount = isPix ? cartTotal * 0.05 : 0;
  const currentRate = MP_RATES[parcelas as keyof typeof MP_RATES] || 0;
  
  // Frete é somado ANTES do juros do cartão, e os descontos são aplicados só no valor dos produtos
  const baseValueForInstallments = cartTotal + frete;
  const finalTotal = isPix 
    ? (cartTotal - pixDiscount + frete) 
    : baseValueForInstallments * (1 + currentRate);
    
  const installmentValue = finalTotal / parcelas;
  const interestValue = finalTotal - baseValueForInstallments;

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
    if (!endereco.rua || !endereco.cidade || !endereco.estado) {
      setFreteError('Preencha pelo menos a rua, cidade e estado.');
      return;
    }

    setIsCalculatingFrete(true);
    setFreteError('');

    try {
      const query = encodeURIComponent(`${endereco.rua}, ${endereco.cidade}, ${endereco.estado}, Brasil`);
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const distance = getDistanceFromLatLonInKm(STORE_LAT, STORE_LON, parseFloat(lat), parseFloat(lon));
        setDistanciaKm(distance);

        if (distance <= 10) setFrete(0);
        else if (distance <= 20) setFrete(30);
        else if (distance <= 30) setFrete(40);
        else if (distance <= 40) setFrete(50);
        else if (distance <= 50) setFrete(60);
        else {
          setFreteError(`A distância é de ${distance.toFixed(1)}km. Não fazemos entregas acima de 50km.`);
          setIsCalculatingFrete(false);
          return;
        }

        // Sucesso
        setStep(3);
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
    
    // 1. Verificar pedidos duplicados (último minuto)
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
          setIsSubmitting(false);
          return;
        }
      } catch (err) {
        console.error("Erro ao verificar pedidos duplicados:", err);
      }
    }

    // 2. Salvar no Supabase (se logado)
    if (user) {
      try {
        const { data: pedido, error: errorPedido } = await supabase
          .from('pedidos')
          .insert({
            user_id: user.id,
            total: finalTotal,
            status: 'Pendente'
          })
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
              produto_preco: item.price,
              quantidade: item.quantity,
              imagem_url: item.image
            };
          });

          const { error: errorItens } = await supabase
            .from('itens_pedido')
            .insert(itensToInsert);

          if (errorItens) throw errorItens;
        }
      } catch (error) {
        console.error("Erro ao salvar pedido no banco:", error);
      }
    }

    const text = items.map(item => 
      `*${item.quantity}x ${item.name}*\n     Cor: ${item.color || 'Padrão'} | Armazenamento: ${item.storage || 'Padrão'}\n     Valor: ${formatPrice(item.price * item.quantity)}`
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
      message += `Desconto PIX: - ${formatPrice(pixDiscount)}\n`;
    } else {
      message += `Forma de Pagamento: ${pagamento}\n`;
    }

    message += `\n*TOTAL FINAL: ${formatPrice(finalTotal)}*`;

    // Limpar o carrinho e abrir whatsapp
    clearCart();
    const url = `https://wa.me/5516997700430?text=${encodeURIComponent(message)}`;
    
    setIsSubmitting(false);
    window.open(url, '_blank');
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] transition-opacity animate-in fade-in duration-300"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-gray-900 z-[70] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-gray-100 dark:border-gray-800">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3 text-vanta-darkblue dark:text-white">
            {step === 1 ? (
              <ShoppingBag className="w-5 h-5" />
            ) : (
              <button 
                onClick={() => {
                  setStep((prev) => (prev - 1) as 1 | 2);
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
              {step === 3 && "Pagamento"}
            </h2>
          </div>
          <button 
            onClick={() => setIsCartOpen(false)}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        {items.length > 0 && (
          <div className="flex bg-gray-100 dark:bg-gray-800 h-1">
            <div className={`bg-vanta-blue h-full transition-all duration-300 ${step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full'}`}></div>
          </div>
        )}

        {/* Content */}
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
              {/* STEP 1: ITENS */}
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
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-tight line-clamp-2 mb-0.5">
                            {item.name}
                          </h4>
                          <div className="text-xs text-gray-500 font-medium">
                            {item.color} • {item.storage}
                          </div>
                        </div>
                        
                        <div className="flex items-end justify-between mt-2">
                          <div className="text-vanta-blue dark:text-blue-400 font-bold text-base">
                            {formatPrice(item.price)}
                          </div>
                          
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
                  ))}
                </div>
              )}

              {/* STEP 2: ENDEREÇO */}
              {step === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2 text-gray-900 dark:text-white mb-2">
                      <MapPin className="w-5 h-5 text-vanta-blue" />
                      <h3 className="font-bold text-base">Onde deseja receber?</h3>
                    </div>
                    <p className="text-[12px] text-gray-500 mb-5 leading-snug">
                      Vamos calcular o frete com base na distância até a VantaTech.
                    </p>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">CEP</label>
                          <input 
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
                            type="text" 
                            value={endereco.rua} 
                            onChange={e => setEndereco({...endereco, rua: e.target.value})}
                            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-vanta-blue transition-colors" 
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Número</label>
                          <input 
                            type="text" 
                            value={endereco.numero} 
                            onChange={e => setEndereco({...endereco, numero: e.target.value})}
                            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-vanta-blue transition-colors" 
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Bairro</label>
                          <input 
                            type="text" 
                            value={endereco.bairro} 
                            onChange={e => setEndereco({...endereco, bairro: e.target.value})}
                            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-vanta-blue transition-colors" 
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Cidade</label>
                          <input 
                            type="text" 
                            value={endereco.cidade} 
                            onChange={e => setEndereco({...endereco, cidade: e.target.value})}
                            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-vanta-blue transition-colors" 
                          />
                        </div>
                        <div className="col-span-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Estado</label>
                          <input 
                            type="text" 
                            value={endereco.estado} 
                            onChange={e => setEndereco({...endereco, estado: e.target.value})}
                            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-vanta-blue transition-colors" 
                            placeholder="UF"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {freteError && (
                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 text-sm text-red-600 dark:text-red-400 font-medium animate-in fade-in zoom-in-95">
                      <AlertCircle className="w-5 h-5 mb-2" />
                      {freteError}
                    </div>
                  )}

                </div>
              )}

              {/* STEP 3: PAGAMENTO */}
              {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  
                  {/* Frete Resumo */}
                  <div className="bg-vanta-blue/5 border border-vanta-blue/10 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">Entrega via Motoboy</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Distância calculada: {distanciaKm.toFixed(1)} km</p>
                    </div>
                    <div className="text-base font-black text-vanta-blue">
                      {frete === 0 ? 'Grátis' : formatPrice(frete)}
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-100 dark:border-gray-800 relative z-50">
                    <div className="flex items-center gap-2 text-gray-900 dark:text-white mb-5">
                      <CreditCard className="w-5 h-5 text-vanta-blue" />
                      <h3 className="font-bold text-base">Forma de Pagamento</h3>
                    </div>
                    
                    {/* Payment Method Custom Dropdown */}
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
                                className={`w-full text-left px-4 py-3.5 text-sm font-bold transition-colors ${
                                  pagamento === option 
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

                    {/* Installments Custom Dropdown */}
                    {pagamento === 'Cartão de Crédito' && (
                      <div className="relative animate-in fade-in duration-300">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Quantidade de Parcelas</label>
                        <button 
                          onClick={() => setShowParcelas(!showParcelas)}
                          className="w-full flex items-center justify-between gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-sm font-bold text-vanta-blue outline-none focus:border-vanta-blue transition-all"
                        >
                          <span>{parcelas}x de {formatPrice((baseValueForInstallments * (1 + (MP_RATES[parcelas as keyof typeof MP_RATES] || 0))) / parcelas)}</span>
                          <ChevronDown className={`w-4 h-4 text-vanta-blue transition-transform ${showParcelas ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {showParcelas && (
                          <>
                            <div className="fixed inset-0 z-[60]" onClick={() => setShowParcelas(false)} />
                            <div className="absolute left-0 right-0 top-full mt-2 w-full max-h-64 overflow-y-auto custom-scrollbar bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] z-[70] animate-in fade-in zoom-in-95 duration-200">
                              {Object.entries(MP_RATES).map(([numStr, rate]) => {
                                const num = parseInt(numStr);
                                const parValue = (baseValueForInstallments * (1 + rate)) / num;
                                return (
                                  <button
                                    key={num}
                                    onClick={() => {
                                      setParcelas(num);
                                      setShowParcelas(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${
                                      parcelas === num 
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
                  
                </div>
              )}

            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-5 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shrink-0 shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.05)] relative z-40">
            
            {/* Step 3: Resumo Final */}
            {step === 3 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-gray-500 font-medium text-sm">Produtos</span>
                  <span className="text-sm font-bold text-gray-500">
                    {formatPrice(cartTotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-gray-500 font-medium text-sm">Frete</span>
                  <span className="text-sm font-bold text-gray-500">
                    {frete === 0 ? 'Grátis' : `+ ${formatPrice(frete)}`}
                  </span>
                </div>
                
                {pagamento === 'Cartão de Crédito' && parcelas > 1 && (
                  <div className="flex items-center justify-between mb-2 text-orange-500 animate-in slide-in-from-top-1 duration-300">
                    <span className="font-medium text-xs">Juros de Parcelamento (MP)</span>
                    <span className="text-xs font-bold">
                      + {formatPrice(interestValue)}
                    </span>
                  </div>
                )}
                
                {pagamento === 'PIX' && (
                  <div className="flex items-center justify-between mb-2 text-green-500 animate-in slide-in-from-top-1 duration-300">
                    <span className="font-medium text-xs">Desconto PIX (5% nos produtos)</span>
                    <span className="text-xs font-bold">
                      - {formatPrice(pixDiscount)}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                  <span className="text-gray-700 dark:text-gray-300 font-black text-lg">Total</span>
                  <span className="text-2xl font-black text-vanta-blue">
                    {formatPrice(finalTotal)}
                  </span>
                </div>
              </div>
            )}

            {/* Step 1 & 2: Subtotal Simples */}
            {step !== 3 && (
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-500 font-medium text-sm">Subtotal</span>
                <span className="text-xl font-black text-gray-900 dark:text-white">
                  {formatPrice(cartTotal)}
                </span>
              </div>
            )}
            
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
