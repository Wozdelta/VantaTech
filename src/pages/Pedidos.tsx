import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';
import { Package, Clock, ShoppingBag, Loader2, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface ItemPedido {
  id: string;
  produto_nome: string;
  produto_preco: number;
  quantidade: number;
  imagem_url: string;
}

interface Pedido {
  id: string;
  numero: number;
  total: number;
  status: string;
  criado_em: string;
  itens_pedido: ItemPedido[];
}

export default function Pedidos() {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPedidos() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('pedidos')
          .select(`
            *,
            itens_pedido (*)
          `)
          .eq('user_id', user.id)
          .order('criado_em', { ascending: false });

        if (error) throw error;
        setPedidos(data as Pedido[]);
      } catch (err) {
        console.error('Erro ao buscar pedidos:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPedidos();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-gray-500">Você precisa estar logado para ver esta página.</p>
      </div>
    );
  }

  // Função para determinar a cor do badge de status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Entregue':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'Cancelado':
      case 'Cancelado pelo cliente':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'Enviado':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Pago':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      default: // Pendente
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    }
  };

  const handleCancelarPedido = async (pedidoId: string) => {
    const confirmed = await showAlert({
      title: 'Cancelar Pedido',
      message: 'Tem certeza que deseja cancelar este pedido? Essa ação não pode ser desfeita.',
      type: 'warning',
      showConfirm: true,
      confirmText: 'Sim, cancelar',
      cancelText: 'Voltar'
    });
    
    if (!confirmed) return;
    
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ status: 'Cancelado pelo cliente' })
        .eq('id', pedidoId);

      if (error) throw error;
      
      // Atualizar lista local
      setPedidos(pedidos.map(p => p.id === pedidoId ? { ...p, status: 'Cancelado pelo cliente' } : p));
      showAlert({ title: 'Sucesso', message: 'Pedido cancelado com sucesso.', type: 'success' });
    } catch (err) {
      console.error('Erro ao cancelar pedido:', err);
      showAlert({ title: 'Erro', message: 'Erro ao cancelar o pedido. Tente novamente mais tarde.', type: 'error' });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
          <Package className="w-8 h-8 mr-3 text-vanta-blue" />
          Meus Pedidos
        </h1>
      </div>
      
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-vanta-blue animate-spin mb-4" />
          <p className="text-gray-500">Buscando seus pedidos...</p>
        </div>
      ) : pedidos.length === 0 ? (
        /* Estado Vazio (Nenhum Pedido) */
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft p-12 text-center">
          <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Você ainda não fez nenhum pedido</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
            Quando você comprar seus produtos, o histórico, rastreio e status aparecerão aqui.
          </p>
          <Link to="/" className="inline-flex items-center justify-center px-8 py-3 bg-vanta-blue text-white font-bold rounded-xl hover:bg-vanta-darkblue transition-colors hover:-translate-y-1">
            Ir para as compras
          </Link>
        </div>
      ) : (
        /* Lista de Pedidos Reais */
        <div className="space-y-6">
          {pedidos.map(pedido => (
            <div key={pedido.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700 p-6 transition-all hover:shadow-md">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Pedido <span className="font-bold text-gray-900 dark:text-white">#{String(pedido.numero).padStart(4, '0')}</span></p>
                  <p className="text-xs text-gray-400">
                    Realizado em {new Date(pedido.criado_em).toLocaleDateString('pt-BR')} às {new Date(pedido.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(pedido.status)}`}>
                    {pedido.status === 'Cancelado pelo cliente' ? 'Cancelado' : pedido.status}
                  </span>
                  <span className="text-sm font-bold text-vanta-blue mt-2">
                    Total: R$ {Number(pedido.total).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  {(pedido.status === 'Pendente' || pedido.status === 'Pago') && (
                    <button 
                      onClick={() => handleCancelarPedido(pedido.id)}
                      className="mt-3 text-xs flex items-center text-red-500 hover:text-red-600 transition-colors font-medium border border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg"
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Cancelar Pedido
                    </button>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                {pedido.itens_pedido?.map(item => (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-lg flex items-center justify-center overflow-hidden border border-gray-100 dark:border-gray-800 shrink-0">
                      {item.imagem_url ? (
                        <img src={item.imagem_url} alt={item.produto_nome} className="w-full h-full object-contain p-1" />
                      ) : (
                        <Package className="w-6 h-6 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 dark:text-white line-clamp-1">{item.produto_nome}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm font-semibold text-vanta-blue">
                          {item.quantidade > 1 ? `${item.quantidade}x ` : ''}R$ {Number(item.produto_preco).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
