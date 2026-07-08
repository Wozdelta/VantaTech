import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAlert } from '../../contexts/AlertContext';
import { CustomSelect } from '../ui/CustomSelect';
import { Package, ChevronDown, CheckCircle, Truck, XCircle, Clock, Loader2, Trash2, Check, Search, FileText, X, DollarSign, CreditCard, Tag, ChevronLeft, ChevronRight, LayoutGrid, List } from 'lucide-react';

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
  cupom_id?: string | null;
  itens_pedido: ItemPedido[];
}

export default function AdminOrders({ onlyVantaClub = false }: { onlyVantaClub?: boolean } = {}) {
  const { showAlert } = useAlert();
  const [orders, setOrders] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const [filterData, setFilterData] = useState('mais_recente');
  const [filterTotal, setFilterTotal] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openStatusMenu, setOpenStatusMenu] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Pedido | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterTotal, filterData]);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select(`
          *,
          itens_pedido (*),
          cupons (codigo)
        `)
        .order('criado_em', { ascending: false });

      if (error) {
        setErrorMsg(error.message);
        throw error;
      }
      
      let finalData = data as Pedido[];
      if (onlyVantaClub && finalData) {
        finalData = finalData.filter((pedido: any) => 
          pedido.itens_pedido?.some((item: any) => item.produto_nome.includes('[Vanta Club]'))
        );
      } else if (finalData) {
        finalData = finalData.filter((pedido: any) => 
          !(pedido.itens_pedido?.some((item: any) => item.produto_nome.includes('[Vanta Club]')))
        );
      }
      
      setOrders(finalData);
      setErrorMsg(null);
    } catch (err: any) {
      console.error('Erro ao buscar pedidos:', err);
      setErrorMsg(err.message || 'Erro desconhecido ao buscar pedidos do Supabase');
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

      // Automação do Cupom
      const wasCancelled = oldStatus === 'Cancelado' || oldStatus === 'Cancelado pelo cliente';
      const isNowCancelled = newStatus === 'Cancelado' || newStatus === 'Cancelado pelo cliente';

      if (isNowCancelled && !wasCancelled) {
        // Restaurar cupom
        const pedido = orders.find(p => p.id === pedidoId);
        if (pedido?.cupom_id) {
          const { data: cupom } = await supabase.from('cupons').select('quantidade_disponivel').eq('id', pedido.cupom_id).single();
          if (cupom && cupom.quantidade_disponivel !== null) {
            await supabase.from('cupons').update({ quantidade_disponivel: cupom.quantidade_disponivel + 1 }).eq('id', pedido.cupom_id);
          }
        }

        // Estorno de Pontos
        if (pedido) {
          const { data: historico } = await supabase.from('historico_pontos').select('*').or(`descricao.ilike.%Pedido #${pedido.id}%,descricao.ilike.%Pedido #${pedido.numero}%`).eq('tipo', 'saida').single();
          if (historico) {
            const { data: perfil } = await supabase.from('perfis').select('pontos').eq('id', pedido.user_id).single();
            if (perfil) {
              await supabase.from('perfis').update({ pontos: perfil.pontos + historico.quantidade }).eq('id', pedido.user_id);
              await supabase.from('historico_pontos').insert({
                user_id: pedido.user_id,
                tipo: 'entrada',
                quantidade: historico.quantidade,
                descricao: `Estorno: Pedido #${pedido.numero} Cancelado`
              });
            }
          }
        }
      } else if (!isNowCancelled && wasCancelled) {
        // Descontar cupom novamente
        const pedido = orders.find(p => p.id === pedidoId);
        if (pedido?.cupom_id) {
          const { data: cupom } = await supabase.from('cupons').select('quantidade_disponivel').eq('id', pedido.cupom_id).single();
          if (cupom && cupom.quantidade_disponivel !== null && cupom.quantidade_disponivel > 0) {
            await supabase.from('cupons').update({ quantidade_disponivel: cupom.quantidade_disponivel - 1 }).eq('id', pedido.cupom_id);
          }
        }
        
        // Descontar pontos novamente
        if (pedido) {
          const { data: historicoEstorno } = await supabase.from('historico_pontos').select('*').or(`descricao.ilike.%Estorno: Pedido #${pedido.id}%,descricao.ilike.%Estorno: Pedido #${pedido.numero}%`).eq('tipo', 'entrada').single();
          if (historicoEstorno) {
            const { data: perfil } = await supabase.from('perfis').select('pontos').eq('id', pedido.user_id).single();
            if (perfil) {
              await supabase.from('perfis').update({ pontos: perfil.pontos - historicoEstorno.quantidade }).eq('id', pedido.user_id);
              await supabase.from('historico_pontos').insert({
                user_id: pedido.user_id,
                tipo: 'saida',
                quantidade: historicoEstorno.quantidade,
                descricao: `Reversão de Estorno: Pedido #${pedido.numero}`
              });
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
      // Restaurar cupom se houver
      const pedido = orders.find(p => p.id === pedidoId);
      if (pedido?.cupom_id) {
        const { data: cupom } = await supabase.from('cupons').select('quantidade_disponivel').eq('id', pedido.cupom_id).single();
        if (cupom && cupom.quantidade_disponivel !== null) {
          await supabase.from('cupons').update({ quantidade_disponivel: cupom.quantidade_disponivel + 1 }).eq('id', pedido.cupom_id);
        }
      }

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

  const filteredOrders = orders
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
      return new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime();
    });

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft overflow-hidden">
      <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Package className="w-6 h-6 text-vanta-blue" />
          Gerenciar Vendas
        </h2>
      </div>

      <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar por ID do pedido (ex: 123)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-vanta-blue/20 focus:border-vanta-blue transition-all text-gray-900 dark:text-white"
            />
          </div>
          
          <div className="lg:hidden flex w-full sm:w-fit bg-gray-100 dark:bg-gray-900 p-1.5 rounded-xl shrink-0">
            <button
              onClick={() => setViewMode('table')}
              className={`flex-1 sm:flex-none flex items-center justify-center px-4 py-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-gray-800 text-vanta-blue shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
              title="Visão Minimalista (Tabela)"
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`flex-1 sm:flex-none flex items-center justify-center px-4 py-2 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-white dark:bg-gray-800 text-vanta-blue shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
              title="Visão Detalhada (Cards)"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Filtros em dropdown para Mobile e Desktop */}
        <div className="flex lg:hidden flex-col sm:flex-row flex-wrap gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <CustomSelect
            value={filterData}
            onChange={(val) => setFilterData(val)}
            className="w-full sm:w-auto flex-1"
            options={[
              { value: 'mais_recente', label: 'Mais Recente' },
              { value: 'mais_antigo', label: 'Mais Antigo' }
            ]}
          />
          
          <CustomSelect
            value={filterTotal}
            onChange={(val) => setFilterTotal(val)}
            className="w-full sm:w-auto flex-1"
            placeholder="Total: Padrão"
            options={[
              { value: 'maior', label: 'Maior Valor' },
              { value: 'menor', label: 'Menor Valor' }
            ]}
          />

          <CustomSelect
            value={filterStatus}
            onChange={(val) => setFilterStatus(val)}
            className="w-full sm:w-auto flex-1"
            placeholder="Status: Todos"
            options={[
              { value: 'pendente', label: 'Pendente' },
              { value: 'pago', label: 'Pago' },
              { value: 'enviado', label: 'Enviado' },
              { value: 'entregue', label: 'Entregue' },
              { value: 'cancelado', label: 'Cancelado' }
            ]}
          />
        </div>
      </div>

      
      <>
<div className={`overflow-x-auto min-h-[380px] ${viewMode === 'table' ? 'block' : 'hidden'} lg:block`}>
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-xs uppercase font-bold tracking-wider">
            <tr className="border-b border-gray-100 dark:border-gray-700">
              <th className="px-6 py-4 relative whitespace-nowrap">
                  <span className="lg:hidden">Pedido / Data</span>
                  <button 
                    onClick={() => setOpenDropdown(openDropdown === 'data' ? null : 'data')}
                    className="hidden lg:flex items-center gap-1 font-bold text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 uppercase tracking-wider transition-colors focus:outline-none"
                  >
                    Pedido / Data
                    {filterData !== 'mais_recente' && <span className="w-1.5 h-1.5 rounded-full bg-vanta-blue ml-0.5"></span>}
                    <ChevronDown className={`w-3.5 h-3.5 ml-0.5 transition-transform ${openDropdown === 'data' ? 'rotate-180' : ''}`} />
                  </button>
                  {openDropdown === 'data' && (
                    <div className="hidden lg:block">
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
                    </div>
                  )}
              </th>
              <th className="px-6 py-4 whitespace-nowrap">Produtos</th>
              <th className="px-6 py-4 relative whitespace-nowrap">
                  <span className="lg:hidden">Total</span>
                  <button 
                    onClick={() => setOpenDropdown(openDropdown === 'total' ? null : 'total')}
                    className="hidden lg:flex items-center gap-1 font-bold text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 uppercase tracking-wider transition-colors focus:outline-none"
                  >
                    Total
                    {filterTotal && <span className="w-1.5 h-1.5 rounded-full bg-vanta-blue ml-0.5"></span>}
                    <ChevronDown className={`w-3.5 h-3.5 ml-0.5 transition-transform ${openDropdown === 'total' ? 'rotate-180' : ''}`} />
                  </button>
                  {openDropdown === 'total' && (
                    <div className="hidden lg:block">
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
                    </div>
                  )}
              </th>
              <th className="px-6 py-4 relative whitespace-nowrap">
                  <span className="lg:hidden">Status</span>
                  <button 
                    onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
                    className="hidden lg:flex items-center gap-1 font-bold text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 uppercase tracking-wider transition-colors focus:outline-none"
                  >
                    Status
                    {filterStatus && <span className="w-1.5 h-1.5 rounded-full bg-vanta-blue ml-0.5"></span>}
                    <ChevronDown className={`w-3.5 h-3.5 ml-0.5 transition-transform ${openDropdown === 'status' ? 'rotate-180' : ''}`} />
                  </button>
                  {openDropdown === 'status' && (
                    <div className="hidden lg:block">
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
                        <button onClick={() => { setFilterStatus('pago'); setOpenDropdown(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between text-gray-700 dark:text-gray-300">
                          <span>Pago</span>
                          {filterStatus === 'pago' && <Check className="w-4 h-4 text-vanta-blue" />}
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
                    </div>
                  )}
              </th>
              <th className="px-6 py-4 text-right whitespace-nowrap">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {errorMsg ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="bg-red-50 text-red-500 p-4 rounded-xl border border-red-100 inline-block font-bold">
                    Erro no Supabase: {errorMsg}
                  </div>
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  Nenhum pedido encontrado.
                </td>
              </tr>
            ) : (
              paginatedOrders.map((pedido) => (
                <tr key={pedido.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap border-b border-gray-50 dark:border-gray-800 align-top">
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
                  <td className="px-6 py-4 border-b border-gray-50 dark:border-gray-800 align-top min-w-[250px]">
                    <div className="flex flex-col gap-2">
                      {pedido.itens_pedido.map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                          <img src={item.imagem_url || '/placeholder.png'} alt={item.produto_nome} className="w-8 h-8 rounded object-cover bg-gray-100" />
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white whitespace-normal line-clamp-2">{item.produto_nome}</p>
                            <p className="text-xs text-gray-500">
                              {item.produto_nome.includes('[Vanta Club]') ? (
                                `${item.quantidade > 1 ? `${item.quantidade}x ` : ''}${item.produto_preco} pontos`
                              ) : (
                                `${item.quantidade}x R$ ${item.produto_preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white border-b border-gray-50 dark:border-gray-800 whitespace-nowrap align-top">
                    <span>{Number(pedido.total) === 0 && pedido.itens_pedido?.some(i => i.produto_nome.includes('[Vanta Club]')) ? `${pedido.itens_pedido.filter(i => i.produto_nome.includes('[Vanta Club]')).reduce((acc, i) => acc + (Number(i.produto_preco) * i.quantidade), 0)} pontos` : `R$ ${pedido.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap border-b border-gray-50 dark:border-gray-800 align-top">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(pedido.status)}`}>
                      {getStatusIcon(pedido.status)}
                      {pedido.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap align-top">
                    <div className="flex items-center justify-end gap-2">
                      {updating === pedido.id ? (
                        <div className="px-3 py-1.5 flex items-center justify-center text-sm font-medium text-gray-500">
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Atualizando...
                        </div>
                      ) : (
                        <div className="relative">
                          <button
                            onClick={() => setOpenStatusMenu(openStatusMenu === pedido.id ? null : pedido.id)}
                            disabled={updating === pedido.id}
                            className={`flex items-center justify-between gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border shadow-sm transition-all w-[150px] ${
                              openStatusMenu === pedido.id 
                                ? 'bg-vanta-blue text-white border-vanta-blue ring-2 ring-vanta-blue/20'
                                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600'
                            }`}
                          >
                            <span className="truncate">{pedido.status}</span>
                            <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${openStatusMenu === pedido.id ? 'rotate-180 text-white/70' : 'text-gray-400'}`} />
                          </button>
                          
                          {openStatusMenu === pedido.id && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setOpenStatusMenu(null)}></div>
                              <div className="absolute right-0 top-full mt-1.5 w-[220px] bg-white dark:bg-gray-800 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.3)] border border-gray-100 dark:border-gray-700 py-1.5 z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
                                {['Pendente', 'Pago', 'Enviado', 'Entregue', 'Cancelado', 'Cancelado pelo cliente'].map((status) => (
                                  <button 
                                    key={status}
                                    onClick={() => {
                                      updateOrderStatus(pedido.id, status, pedido.status, pedido.itens_pedido, pedido.user_id, pedido.afiliado_id, pedido.total);
                                      setOpenStatusMenu(null);
                                    }}
                                    className={`w-full text-left px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between transition-colors ${
                                      pedido.status === status ? 'text-vanta-blue bg-blue-50/50 dark:bg-blue-900/10' : 'text-gray-700 dark:text-gray-300'
                                    }`}
                                  >
                                    <span className="truncate">{status}</span>
                                    {pedido.status === status && <Check className="w-3.5 h-3.5 text-vanta-blue shrink-0 ml-2" />}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                      
                      <button
                        onClick={() => setSelectedOrder(pedido)}
                        className="p-1.5 text-gray-400 hover:text-vanta-blue hover:bg-vanta-blue/10 rounded-lg transition-colors"
                        title="Ver Detalhes do Pedido"
                      >
                        <FileText className="w-4 h-4" />
                      </button>

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


<div className={`p-4 grid ${viewMode === 'cards' ? 'block' : 'hidden'} lg:hidden grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-gray-50/50 dark:bg-gray-900/20 min-h-[380px]`}>
        {errorMsg ? (
          <div className="col-span-full text-center py-12">
            <div className="bg-red-50 text-red-500 p-4 rounded-xl border border-red-100 inline-block font-bold">
              Erro no Supabase: {errorMsg}
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            Nenhum pedido encontrado.
          </div>
        ) : (
          paginatedOrders.map((pedido) => (
            <div key={pedido.id} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-100 dark:border-gray-700 flex flex-col gap-4 relative overflow-hidden group hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-100 dark:border-gray-700 pb-4">
                <div>
                  <span className="text-sm font-black text-vanta-blue block mb-1 tracking-tight">#{pedido.numero}</span>
                  <span className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(pedido.criado_em).toLocaleDateString('pt-BR')} às {new Date(pedido.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <span className={`inline-flex items-center px-2.5 py-1.5 sm:py-1 rounded-full text-[10px] uppercase font-bold tracking-wider whitespace-nowrap ${getStatusColor(pedido.status)}`}>
                  {getStatusIcon(pedido.status)}
                  <span className="ml-1 text-center">{pedido.status}</span>
                </span>
              </div>
              
              {/* Body (Produtos) */}
              <div className="flex flex-col gap-3 py-1">
                {pedido.itens_pedido.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <img src={item.imagem_url || '/placeholder.png'} alt={item.produto_nome} className="w-12 h-12 rounded-xl object-cover bg-gray-50 border border-gray-100 dark:border-gray-700 shadow-sm" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug mb-1">{item.produto_nome}</p>
                      <p className="text-xs text-vanta-orange font-bold bg-orange-50 dark:bg-orange-900/20 inline-block px-1.5 py-0.5 rounded">
                        {item.produto_nome.includes('[Vanta Club]') ? (
                          `${item.quantidade > 1 ? `${item.quantidade}x ` : ''}${item.produto_preco} pontos`
                        ) : (
                          `${item.quantidade}x R$ ${item.produto_preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer (Total + Actions) */}
              <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total do Pedido</span>
                  <span className="text-lg font-black text-gray-900 dark:text-white">
                    {Number(pedido.total) === 0 && pedido.itens_pedido?.some(i => i.produto_nome.includes('[Vanta Club]')) ? `${pedido.itens_pedido.filter(i => i.produto_nome.includes('[Vanta Club]')).reduce((acc, i) => acc + (Number(i.produto_preco) * i.quantidade), 0)} pontos` : `R$ ${pedido.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 w-full">
                  {updating === pedido.id ? (
                    <div className="flex-1 px-3 py-2 flex items-center justify-center text-xs font-bold text-gray-500 bg-gray-50 rounded-xl border border-transparent">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Atualizando...
                    </div>
                  ) : (
                    <div className="flex-1 relative min-w-0">
                      <button
                        onClick={() => setOpenStatusMenu(openStatusMenu === pedido.id ? null : pedido.id)}
                        disabled={updating === pedido.id}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl border shadow-sm transition-all ${
                          openStatusMenu === pedido.id 
                            ? 'bg-vanta-blue text-white border-vanta-blue ring-2 ring-vanta-blue/20'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600'
                        }`}
                      >
                        <span className="truncate text-left block">{pedido.status}</span>
                        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${openStatusMenu === pedido.id ? 'rotate-180 text-white/70' : 'text-gray-400 dark:text-gray-500'}`} />
                      </button>
                      
                      {openStatusMenu === pedido.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setOpenStatusMenu(null)}></div>
                          <div className="absolute left-0 right-0 bottom-full mb-1.5 bg-white dark:bg-gray-800 rounded-xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.3)] border border-gray-100 dark:border-gray-700 py-1.5 z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-200 origin-bottom">
                            {['Pendente', 'Pago', 'Enviado', 'Entregue', 'Cancelado', 'Cancelado pelo cliente'].map((status) => (
                              <button 
                                key={status}
                                onClick={() => {
                                  updateOrderStatus(pedido.id, status, pedido.status, pedido.itens_pedido, pedido.user_id, pedido.afiliado_id, pedido.total);
                                  setOpenStatusMenu(null);
                                }}
                                className={`w-full text-left px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between transition-colors ${
                                  pedido.status === status ? 'text-vanta-blue bg-blue-50/50 dark:bg-blue-900/10' : 'text-gray-700 dark:text-gray-300'
                                }`}
                              >
                                <span className="truncate">{status}</span>
                                {pedido.status === status && <Check className="w-3.5 h-3.5 text-vanta-blue shrink-0 ml-2" />}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  
                  <button
                    onClick={() => setSelectedOrder(pedido)}
                    className="p-2.5 text-gray-400 hover:text-vanta-blue hover:bg-vanta-blue/10 rounded-xl transition-colors bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm"
                    title="Ver Detalhes do Pedido"
                  >
                    <FileText className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => deleteOrder(pedido.id)}
                    disabled={updating === pedido.id}
                    className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm"
                    title="Excluir Pedido"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      </>

      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            Mostrando <span className="font-bold text-gray-900 dark:text-white">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> até <span className="font-bold text-gray-900 dark:text-white">{Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)}</span> de <span className="font-bold text-gray-900 dark:text-white">{filteredOrders.length}</span> resultados
          </span>
          <div className="flex items-center gap-1 bg-white dark:bg-gray-900 p-1 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center px-2 gap-1 border-x border-gray-100 dark:border-gray-800">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(currentPage - p) <= 1)
                .map((pageNum, index, array) => (
                  <div key={`page-wrapper-${pageNum}`} className="flex items-center">
                    {index > 0 && pageNum - array[index - 1] > 1 && (
                      <span className="px-2 text-gray-400 dark:text-gray-500 font-bold">...</span>
                    )}
                    <button
                      onClick={() => setCurrentPage(pageNum)}
                      className={`min-w-[32px] h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${
                        currentPage === pageNum 
                          ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-sm' 
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      {pageNum}
                    </button>
                  </div>
                ))}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-vanta-blue" />
                  Detalhes do Pedido #{selectedOrder.numero}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Feito em {new Date(selectedOrder.criado_em).toLocaleString('pt-BR')} às {new Date(selectedOrder.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              
              {/* Informações do Cliente */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3">Informações Adicionais</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-soft">
                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Status Atual</p>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(selectedOrder.status)}`}>
                      {getStatusIcon(selectedOrder.status)}
                      {selectedOrder.status}
                    </span>
                  </div>
                  <div className="bg-vanta-blue/5 dark:bg-vanta-blue/10 p-4 rounded-xl border border-vanta-blue/20 shadow-soft">
                    <p className="text-xs text-vanta-blue dark:text-blue-400 mb-1 flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Total Final</p>
                    <p className="text-xl font-black text-vanta-blue">
                      R$ {selectedOrder.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>

                  {/* Subtotal */}
                  {(selectedOrder as any).subtotal !== undefined && (selectedOrder as any).subtotal !== null && (
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-soft">
                      <p className="text-xs text-gray-500 mb-1">Subtotal (Produtos)</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        R$ {Number((selectedOrder as any).subtotal).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  )}

                  {/* Pontos Utilizados */}
                  {selectedOrder.itens_pedido?.some(i => i.produto_nome.includes('[Vanta Club]')) && (
                    <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-100 dark:border-purple-900/30 shadow-soft">
                      <p className="text-xs text-purple-600 dark:text-purple-400 mb-1 font-bold">Pontos Utilizados</p>
                      <p className="text-sm font-black text-purple-600 dark:text-purple-400">
                        {selectedOrder.itens_pedido.filter(i => i.produto_nome.includes('[Vanta Club]')).reduce((acc, i) => acc + (Number(i.produto_preco) * i.quantidade), 0)} pts
                      </p>
                    </div>
                  )}

                  {/* Frete */}
                  {(selectedOrder as any).frete !== undefined && (selectedOrder as any).frete !== null && (
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-soft">
                      <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" /> Frete</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {Number((selectedOrder as any).frete) === 0 ? <span className="text-green-500">Grátis</span> : `R$ ${Number((selectedOrder as any).frete).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      </p>
                    </div>
                  )}

                  {/* Pagamento */}
                  {(selectedOrder as any).forma_pagamento && (
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-soft">
                      <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5" /> Pagamento</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {(selectedOrder as any).forma_pagamento} {(selectedOrder as any).parcelas > 1 ? `(${(selectedOrder as any).parcelas}x)` : ''}
                      </p>
                    </div>
                  )}

                  {/* Desconto PIX */}
                  {(selectedOrder as any).desconto_pix > 0 && (
                    <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-xl border border-green-100 dark:border-green-900/30 shadow-soft">
                      <p className="text-xs text-green-600 dark:text-green-400 mb-1 font-bold">Desconto PIX</p>
                      <p className="text-sm font-bold text-green-600 dark:text-green-400">
                        - R$ {Number((selectedOrder as any).desconto_pix).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  )}

                  {/* Desconto Cupom */}
                  {((selectedOrder as any).desconto_cupom > 0 || (selectedOrder as any).cupons?.codigo) && (
                    <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-xl border border-green-100 dark:border-green-900/30 shadow-soft">
                      <p className="text-xs text-green-600 dark:text-green-400 mb-1 font-bold flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Cupom {(selectedOrder as any).cupons?.codigo}</p>
                      <p className="text-sm font-bold text-green-600 dark:text-green-400">
                        {(selectedOrder as any).desconto_cupom > 0 ? `- R$ ${Number((selectedOrder as any).desconto_cupom).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Aplicado'}
                      </p>
                    </div>
                  )}

                  {/* Juros Maquininha */}
                  {(selectedOrder as any).juros_cartao > 0 && (
                    <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-xl border border-orange-100 dark:border-orange-900/30 shadow-soft">
                      <p className="text-xs text-orange-600 dark:text-orange-400 mb-1 font-bold">Taxa Maquininha</p>
                      <p className="text-sm font-bold text-orange-600 dark:text-orange-400">
                        + R$ {Number((selectedOrder as any).juros_cartao).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Itens do Pedido */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3">Itens ({selectedOrder.itens_pedido?.length || 0})</h4>
                <div className="space-y-3">
                  {selectedOrder.itens_pedido?.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                      <img src={item.imagem_url || '/placeholder.png'} alt={item.produto_nome} className="w-12 h-12 rounded-lg object-cover bg-gray-50" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-white break-words">{item.produto_nome}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {item.produto_nome.includes('[Vanta Club]') 
                            ? `${item.produto_preco} pontos` 
                            : `R$ ${item.produto_preco?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`}
                        </p>
                        <p className="text-xs text-gray-500">Qtd: {item.quantidade}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
            
            <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-end">
              <button 
                onClick={() => setSelectedOrder(null)}
                className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-bold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
