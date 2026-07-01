import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAlert } from '../../contexts/AlertContext';
import { Package, ChevronDown, CheckCircle, Truck, XCircle, Clock, Loader2, ExternalLink, Trash2, Check, Search } from 'lucide-react';

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
  afiliado_id?: string;
  itens_pedido: ItemPedido[];
}

export default function AdminOrders() {
  const { showAlert } = useAlert();
  const [orders, setOrders] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const [filterData, setFilterData] = useState('mais_recente');
  const [filterTotal, setFilterTotal] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

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

  const updateOrderStatus = async (pedidoId: string, newStatus: string, oldStatus: string, itens: ItemPedido[], userId: string, afiliadoId?: string, total?: number) => {
    setUpdating(pedidoId);
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ status: newStatus })
        .eq('id', pedidoId);

      if (error) throw error;

      // Se virou Pago e antes não era, damos os pontos para o afiliado (se existir)
      const wasAlreadyPaid = ['Pago', 'Enviado', 'Entregue'].includes(oldStatus);
      const isNowPaid = ['Pago', 'Enviado', 'Entregue'].includes(newStatus);
      
      if (!wasAlreadyPaid && isNowPaid && userId && total) {
        // Anti-Fraude: Verifica se o comprador foi indicado e se AINDA NÃO pagou bônus
        const { data: perfilComprador } = await supabase
          .from('perfis')
          .select('indicado_por, bonus_indicacao_pago')
          .eq('id', userId)
          .single();

        if (perfilComprador?.indicado_por && !perfilComprador.bonus_indicacao_pago) {
          const afiliadoId = perfilComprador.indicado_por;

          // Marca que a primeira compra já premiou o afiliado
          await supabase.from('perfis').update({ bonus_indicacao_pago: true }).eq('id', userId);

          const { data: perfilAfiliado } = await supabase
            .from('perfis')
            .select('pontos, pontos_acumulados')
            .eq('id', afiliadoId)
            .single();
        
        const { data: niveis } = await supabase
          .from('niveis_fidelidade')
          .select('*')
          .order('pontos_minimos', { ascending: true });

        const pontosAtuais = perfilAfiliado?.pontos || 0;
        const pontosAcumulados = perfilAfiliado?.pontos_acumulados || 0;
        
        const pontosGanhos = Math.floor(total);
        
        const novosPontos = pontosAtuais + pontosGanhos;
        const novosPontosAcumulados = pontosAcumulados + pontosGanhos;

        let nivelAntigo = niveis?.[0];
        let nivelNovo = niveis?.[0];

        if (niveis && niveis.length > 0) {
          for (const n of niveis) {
            if (pontosAcumulados >= n.pontos_minimos) nivelAntigo = n;
            if (novosPontosAcumulados >= n.pontos_minimos) nivelNovo = n;
          }
        }

        await supabase
          .from('perfis')
          .update({ 
            pontos: novosPontos,
            pontos_acumulados: novosPontosAcumulados 
          })
          .eq('id', afiliadoId);

        // Registrar no Extrato (Histórico)
        await supabase.from('historico_pontos').insert({
          user_id: afiliadoId,
          tipo: 'entrada',
          quantidade: pontosGanhos,
          descricao: `Bônus por Indicação (Pedido Confirmado)`
        });

        await supabase.from('notificacoes').insert({
          usuario_id: afiliadoId,
          titulo: `Você ganhou VantaCoins! 🎉`,
          mensagem: `Alguém comprou através do seu link de indicação. Você recebeu ${pontosGanhos} VantaCoins!`,
          lida: false
        });

        if (nivelNovo && nivelAntigo && nivelNovo.pontos_minimos > nivelAntigo.pontos_minimos) {
          await supabase.from('notificacoes').insert({
            usuario_id: afiliadoId,
            titulo: `Novo Nível Alcançado! 🏆`,
            mensagem: `Parabéns! Você acabou de atingir o nível ${nivelNovo.nome} no VantaClub!`,
            lida: false
          });
        }
        } // <- Fechando if (perfilComprador?.indicado_por...)
      }

      // Enviar notificação para o comprador
      if (userId) {
        await supabase.from('notificacoes').insert({
          usuario_id: userId,
          titulo: `Atualização do Pedido`,
          mensagem: `O seu pedido mudou para o status: ${newStatus}`,
          lida: false
        });
      }

      // Automação do Estoque para Itens
      const wasAlreadyDelivered = oldStatus === 'Entregue';
      const isNowDelivered = newStatus === 'Entregue';

      if (!wasAlreadyDelivered && isNowDelivered) {
        for (const item of itens) {
          if (item.produto_id) {
            const { data: prod } = await supabase
              .from('produtos')
              .select('estoque, ativo')
              .eq('id', item.produto_id)
              .single();

            // Se o produto tiver estoque (é um Item/Acessório e não um Aparelho)
            if (prod && prod.estoque !== null && prod.estoque !== undefined) {
              const novoEstoque = Math.max(0, prod.estoque - (item.quantidade || 1));
              const updates: any = { estoque: novoEstoque };
              
              // Se o estoque zerou, oculta o produto automaticamente
              if (novoEstoque === 0) {
                updates.ativo = false;
              }

              await supabase
                .from('produtos')
                .update(updates)
                .eq('id', item.produto_id);
            }
          }
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

      <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
        <div className="relative max-w-md">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar por ID do pedido (ex: 123)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-vanta-blue/20 focus:border-vanta-blue transition-all text-gray-900 dark:text-white"
          />
        </div>
      </div>

      <div className="overflow-x-auto min-h-[380px]">
        <table className="min-w-full text-left">
          <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-xs uppercase font-bold tracking-wider">
            <tr>
              <th className="px-6 py-4 relative">
                  <button 
                    onClick={() => setOpenDropdown(openDropdown === 'data' ? null : 'data')}
                    className="flex items-center gap-1 font-bold text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 uppercase tracking-wider transition-colors focus:outline-none"
                  >
                    Pedido / Data
                    {filterData !== 'mais_recente' && <span className="w-1.5 h-1.5 rounded-full bg-vanta-blue ml-0.5"></span>}
                    <ChevronDown className={`w-3.5 h-3.5 ml-0.5 transition-transform ${openDropdown === 'data' ? 'rotate-180' : ''}`} />
                  </button>
                  {openDropdown === 'data' && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)}></div>
                      <div className="absolute top-full left-4 mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-2 z-50 overflow-hidden text-sm font-normal normal-case">
                        <button onClick={() => { setFilterData('mais_recente'); setOpenDropdown(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between text-gray-700 dark:text-gray-300">
                          <span>Mais Recente</span>
                          {filterData === 'mais_recente' && <Check className="w-4 h-4 text-vanta-blue" />}
                        </button>
                        <button onClick={() => { setFilterData('mais_antigo'); setOpenDropdown(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between text-gray-700 dark:text-gray-300">
                          <span>Mais Antigo</span>
                          {filterData === 'mais_antigo' && <Check className="w-4 h-4 text-vanta-blue" />}
                        </button>
                      </div>
                    </>
                  )}
              </th>
              <th className="px-6 py-4">Produtos</th>
              <th className="px-6 py-4 relative">
                  <button 
                    onClick={() => setOpenDropdown(openDropdown === 'total' ? null : 'total')}
                    className="flex items-center gap-1 font-bold text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 uppercase tracking-wider transition-colors focus:outline-none"
                  >
                    Total
                    {filterTotal && <span className="w-1.5 h-1.5 rounded-full bg-vanta-blue ml-0.5"></span>}
                    <ChevronDown className={`w-3.5 h-3.5 ml-0.5 transition-transform ${openDropdown === 'total' ? 'rotate-180' : ''}`} />
                  </button>
                  {openDropdown === 'total' && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)}></div>
                      <div className="absolute top-full left-4 mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-2 z-50 overflow-hidden text-sm font-normal normal-case">
                        <button onClick={() => { setFilterTotal(''); setOpenDropdown(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between text-gray-700 dark:text-gray-300">
                          <span>Padrão</span>
                          {!filterTotal && <Check className="w-4 h-4 text-vanta-blue" />}
                        </button>
                        <button onClick={() => { setFilterTotal('maior'); setOpenDropdown(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between text-gray-700 dark:text-gray-300">
                          <span>Maior Valor</span>
                          {filterTotal === 'maior' && <Check className="w-4 h-4 text-vanta-blue" />}
                        </button>
                        <button onClick={() => { setFilterTotal('menor'); setOpenDropdown(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between text-gray-700 dark:text-gray-300">
                          <span>Menor Valor</span>
                          {filterTotal === 'menor' && <Check className="w-4 h-4 text-vanta-blue" />}
                        </button>
                      </div>
                    </>
                  )}
              </th>
              <th className="px-6 py-4 relative">
                  <button 
                    onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
                    className="flex items-center gap-1 font-bold text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 uppercase tracking-wider transition-colors focus:outline-none"
                  >
                    Status
                    {filterStatus && <span className="w-1.5 h-1.5 rounded-full bg-vanta-blue ml-0.5"></span>}
                    <ChevronDown className={`w-3.5 h-3.5 ml-0.5 transition-transform ${openDropdown === 'status' ? 'rotate-180' : ''}`} />
                  </button>
                  {openDropdown === 'status' && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)}></div>
                      <div className="absolute top-full left-4 mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-2 z-50 overflow-hidden text-sm font-normal normal-case">
                        <button onClick={() => { setFilterStatus(''); setOpenDropdown(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between text-gray-700 dark:text-gray-300">
                          <span>Todos</span>
                          {!filterStatus && <Check className="w-4 h-4 text-vanta-blue" />}
                        </button>
                        <button onClick={() => { setFilterStatus('pendente'); setOpenDropdown(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between text-gray-700 dark:text-gray-300">
                          <span>Pendente</span>
                          {filterStatus === 'pendente' && <Check className="w-4 h-4 text-vanta-blue" />}
                        </button>
                        <button onClick={() => { setFilterStatus('preparando'); setOpenDropdown(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between text-gray-700 dark:text-gray-300">
                          <span>Preparando</span>
                          {filterStatus === 'preparando' && <Check className="w-4 h-4 text-vanta-blue" />}
                        </button>
                        <button onClick={() => { setFilterStatus('enviado'); setOpenDropdown(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between text-gray-700 dark:text-gray-300">
                          <span>Enviado</span>
                          {filterStatus === 'enviado' && <Check className="w-4 h-4 text-vanta-blue" />}
                        </button>
                        <button onClick={() => { setFilterStatus('entregue'); setOpenDropdown(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between text-gray-700 dark:text-gray-300">
                          <span>Entregue</span>
                          {filterStatus === 'entregue' && <Check className="w-4 h-4 text-vanta-blue" />}
                        </button>
                        <button onClick={() => { setFilterStatus('cancelado'); setOpenDropdown(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between text-gray-700 dark:text-gray-300">
                          <span>Cancelado</span>
                          {filterStatus === 'cancelado' && <Check className="w-4 h-4 text-vanta-blue" />}
                        </button>
                      </div>
                    </>
                  )}
              </th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {orders.filter(o => {
                if (filterStatus && o.status !== filterStatus) return false;
                return true;
              }).length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  Nenhum pedido encontrado.
                </td>
              </tr>
            ) : (
            orders
              .filter(o => {
                if (filterStatus && o.status?.toLowerCase() !== filterStatus.toLowerCase()) return false;
                if (searchTerm && !o.numero?.toString().includes(searchTerm)) return false;
                return true;
              })
              .sort((a, b) => {
                if (filterTotal === 'maior') return b.total - a.total;
                if (filterTotal === 'menor') return a.total - b.total;
                
                if (filterData === 'mais_antigo') {
                  return new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime();
                }
                // default mais_recente
                return new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime();
              })
              .map((pedido) => (
                <tr key={pedido.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-vanta-blue mb-1">
                        #{pedido.numero}
                      </span>
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        {new Date(pedido.criado_em).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(pedido.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
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
                          onChange={(e) => updateOrderStatus(pedido.id, e.target.value, pedido.status, pedido.itens_pedido, pedido.user_id, pedido.afiliado_id, pedido.total)}
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
