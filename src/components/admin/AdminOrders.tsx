import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAlert } from '../../contexts/AlertContext';
import { Package, ChevronDown, CheckCircle, Truck, XCircle, Clock, Loader2, ExternalLink, Trash2 } from 'lucide-react';

interface ItemPedido {
  id: string;
  produto_nome: string;
  produto_preco: number;
  quantidade: number;
  imagem_url: string;
  produto_id?: string;
}

interface Pedido {
  id: string;
  user_id: string;
  numero: number;
  total: number;
  status: string;
  criado_em: string;
  itens_pedido: ItemPedido[];
}

export default function AdminOrders() {
  const { showAlert } = useAlert();
  const [orders, setOrders] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select(`
          *,
          itens_pedido (*)
        `)
        .order('criado_em', { ascending: false });

      if (error) throw error;
      setOrders(data as Pedido[]);
    } catch (err) {
      console.error('Erro ao buscar pedidos:', err);
    } finally {
      setLoading(false);
    }
  }

  const updateOrderStatus = async (pedidoId: string, newStatus: string, itens: ItemPedido[], userId: string) => {
    setUpdating(pedidoId);
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ status: newStatus })
        .eq('id', pedidoId);

      if (error) throw error;

      // Enviar notificação para o usuário
      if (userId) {
        await supabase.from('notificacoes').insert({
          usuario_id: userId,
          titulo: `Atualização do Pedido`,
          mensagem: `O seu pedido mudou para o status: ${newStatus}`,
          lida: false
        });
      }

      // Automação do Estoque
      for (const item of itens) {
        if (item.produto_id) {
          // O anúncio em si (produto pai) nunca é desativado automaticamente,
          // pois as variações (cores/armazenamentos) são controladas dinamicamente.
          const updates: any = {};
          updates.ativo = true;
          updates.badge = null;
          
          await supabase
            .from('produtos')
            .update(updates)
            .eq('id', item.produto_id);
        }
      }

      await fetchOrders();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      showAlert({
        title: 'Erro',
        message: 'Erro ao atualizar status do pedido.',
        type: 'error'
      });
    } finally {
      setUpdating(null);
    }
  };

  const deleteOrder = async (pedidoId: string) => {
    const confirmed = await showAlert({
      title: 'Excluir Pedido?',
      message: 'Tem certeza que deseja EXCLUIR este pedido permanentemente?',
      type: 'warning',
      showConfirm: true,
      confirmText: 'Excluir',
      cancelText: 'Cancelar'
    });
    
    if (!confirmed) return;
    
    setUpdating(pedidoId);
    try {
      // Excluir itens primeiro caso não tenha delete em cascata configurado
      await supabase.from('itens_pedido').delete().eq('pedido_id', pedidoId);
      
      // Excluir o pedido em si
      const { error } = await supabase.from('pedidos').delete().eq('id', pedidoId);
      if (error) throw error;
      
      await fetchOrders();
    } catch (error) {
      console.error('Erro ao excluir pedido:', error);
      showAlert({
        title: 'Erro',
        message: 'Erro ao excluir o pedido.',
        type: 'error'
      });
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Entregue':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'Cancelado':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'Enviado':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Pago':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      default: // Pendente
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Entregue':
        return <CheckCircle className="w-3.5 h-3.5 mr-1" />;
      case 'Cancelado':
      case 'Cancelado pelo cliente':
        return <XCircle className="w-3.5 h-3.5 mr-1" />;
      case 'Enviado':
        return <Truck className="w-3.5 h-3.5 mr-1" />;
      default: // Pendente
        return <Clock className="w-3.5 h-3.5 mr-1" />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-vanta-blue animate-spin mb-4" />
        <p className="text-gray-500">Carregando pedidos...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft overflow-hidden">
      <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Package className="w-6 h-6 text-vanta-blue" />
          Gerenciar Vendas
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-xs uppercase font-bold tracking-wider">
            <tr>
              <th className="px-6 py-4">Data/Hora</th>
              <th className="px-6 py-4">Produtos</th>
              <th className="px-6 py-4">Total</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  Nenhum pedido encontrado.
                </td>
              </tr>
            ) : (
              orders.map((pedido) => (
                <tr key={pedido.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-gray-900 dark:text-white">
                      {new Date(pedido.criado_em).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(pedido.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2">
                      {pedido.itens_pedido.map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                          <img src={item.imagem_url || '/placeholder.png'} alt={item.produto_nome} className="w-8 h-8 rounded object-cover bg-gray-100" />
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">{item.produto_nome}</p>
                            <p className="text-xs text-gray-500">{item.quantidade}x R$ {item.produto_preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">
                    R$ {pedido.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(pedido.status)}`}>
                      {getStatusIcon(pedido.status)}
                      {pedido.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {updating === pedido.id ? (
                        <div className="px-3 py-1.5 flex items-center justify-center text-sm font-medium text-gray-500">
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Atualizando...
                        </div>
                      ) : (
                        <select
                          value={pedido.status}
                          onChange={(e) => updateOrderStatus(pedido.id, e.target.value, pedido.itens_pedido, pedido.user_id)}
                          disabled={updating === pedido.id}
                          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-vanta-blue dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600 transition-colors"
                        >
                          {['Pendente', 'Pago', 'Enviado', 'Entregue', 'Cancelado', 'Cancelado pelo cliente'].map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      )}
                      
                      <button
                        onClick={() => deleteOrder(pedido.id)}
                        disabled={updating === pedido.id}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Excluir Pedido"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
