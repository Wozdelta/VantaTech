import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAlert } from '../../contexts/AlertContext';
import { Loader2, Trash2, Search, History, DollarSign, AlertTriangle } from 'lucide-react';

interface SoldItem {
  id: string; // id do item
  pedido_id: string; // id do pedido
  pedido_numero: number;
  data: string;
  produto_nome: string;
  produto_preco: number; // valor vendido
  quantidade: number;
  custo: number; // valor pago
  lucro: number; // preco - custo
}

export default function AdminSalesHistory() {
  const [soldItems, setSoldItems] = useState<SoldItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      setLoading(true);
      
      // Busca pedidos pagos e os produtos correspondentes para calcular o lucro atual
      const { data: pedidos, error: pedidosError } = await supabase
        .from('pedidos')
        .select(`
          id, numero, criado_em, status, total,
          itens_pedido (id, produto_id, produto_nome, produto_preco, quantidade)
        `)
        .in('status', ['Entregue'])
        .order('criado_em', { ascending: false });

      if (pedidosError) throw pedidosError;

      const { data: produtos, error: produtosError } = await supabase
        .from('produtos')
        .select('id, galeria');

      if (produtosError) throw produtosError;

      const history: SoldItem[] = [];

      pedidos?.forEach(pedido => {
        let totalProdutos = 0;
        pedido.itens_pedido?.forEach((item: any) => {
          totalProdutos += (item.produto_preco || 0) * (item.quantidade || 1);
        });

        let descontoPedido = 0;
        if (pedido.total && totalProdutos > 0 && pedido.total < totalProdutos) {
          descontoPedido = totalProdutos - pedido.total;
        }

        pedido.itens_pedido?.forEach((item: any) => {
          let custo = 0;
          
          if (item.produto_id) {
            const produtoDb = produtos?.find(p => p.id === item.produto_id);
            if (produtoDb && produtoDb.galeria) {
              const variant = produtoDb.galeria.find((g: any) => 
                g.cor && item.produto_nome.includes(g.cor)
              );
              
              if (variant && variant.preco_custo) {
                custo = parseFloat(variant.preco_custo);
              } else if (produtoDb.galeria[0] && produtoDb.galeria[0].preco_custo) {
                custo = parseFloat(produtoDb.galeria[0].preco_custo);
              }
            }
          }

          const proporcao = totalProdutos > 0 ? ((item.produto_preco * item.quantidade) / totalProdutos) : 0;
          const descontoItem = descontoPedido * proporcao;
          const precoVendaRealItemTotal = (item.produto_preco * item.quantidade) - descontoItem;
          const precoVendaUnitarioReal = item.quantidade > 0 ? precoVendaRealItemTotal / item.quantidade : 0;
          
          history.push({
            id: item.id,
            pedido_id: pedido.id,
            pedido_numero: pedido.numero,
            data: pedido.criado_em,
            produto_nome: item.produto_nome,
            produto_preco: precoVendaUnitarioReal,
            quantidade: item.quantidade,
            custo: custo,
            lucro: precoVendaRealItemTotal - (custo * item.quantidade)
          });
        });
      });

      setSoldItems(history);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      showAlert({ title: 'Erro', message: 'Falha ao carregar histórico.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Assinar mudanças na tabela pedidos para atualizar em tempo real
    const channel = supabase
      .channel('pedidos-history')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos' },
        () => {
          fetchHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleDeleteItem = async (pedidoId: string) => {
    setItemToDelete(pedidoId);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('pedidos')
        .delete()
        .eq('id', itemToDelete);

      if (error) throw error;

      showAlert({ title: 'Sucesso', message: 'Venda apagada do histórico.', type: 'success' });
      fetchHistory(); // Recarrega
      setItemToDelete(null);
    } catch (error) {
      console.error('Erro ao apagar:', error);
      showAlert({ title: 'Erro', message: 'Falha ao apagar venda.', type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredItems = soldItems.filter(i => 
    i.produto_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.pedido_numero.toString().includes(searchTerm)
  );

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mt-8">
      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <History className="w-5 h-5 text-vanta-blue" />
              Histórico de Vendas
            </h3>
          </div>
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Buscar modelo ou pedido..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-vanta-blue"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 flex justify-center">
          <Loader2 className="w-8 h-8 text-vanta-blue animate-spin" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 text-center text-gray-500">
          Nenhuma venda concluída encontrada.
        </div>
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data / Pedido</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Produto Vendido</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Valor Venda</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Lucro</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">#{item.pedido_numero}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(item.data).toLocaleDateString('pt-BR')} às {new Date(item.data).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900 dark:text-gray-200">
                        {item.quantidade}x {item.produto_nome}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        R$ {(item.produto_preco * item.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <DollarSign className={`w-3 h-3 ${item.lucro > 0 ? 'text-green-500' : 'text-gray-400'}`} />
                        <span className={`text-sm font-bold ${item.lucro > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                          R$ {item.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleDeleteItem(item.pedido_id)}
                        className="inline-flex items-center justify-center p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-400 hover:text-red-600 rounded-lg transition-colors"
                        title="Apagar Venda"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden grid grid-cols-1 gap-4 p-4 bg-gray-50/50 dark:bg-gray-900/20">
            {filteredItems.map((item) => (
              <div key={item.id} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-4">
                <div className="flex justify-between items-start border-b border-gray-100 dark:border-gray-700 pb-3">
                  <div>
                    <span className="text-sm font-black text-vanta-blue block mb-0.5">#{item.pedido_numero}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(item.data).toLocaleDateString('pt-BR')} às {new Date(item.data).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteItem(item.pedido_id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    title="Apagar Venda"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2">
                    {item.quantidade}x {item.produto_nome}
                  </span>
                </div>

                <div className="flex justify-between items-end pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Lucro</span>
                    <div className="flex items-center gap-1">
                      <DollarSign className={`w-3 h-3 ${item.lucro > 0 ? 'text-green-500' : 'text-gray-400'}`} />
                      <span className={`text-sm font-bold ${item.lucro > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                        R$ {item.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Valor Venda</span>
                    <span className="text-base font-black text-gray-900 dark:text-white">
                      R$ {(item.produto_preco * item.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>

    {/* Delete Confirmation Modal */}
    {itemToDelete && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-4 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-center text-gray-900 dark:text-white mb-2">
              Apagar Venda?
            </h3>
            <p className="text-center text-gray-500 dark:text-gray-400 mb-6">
              Deseja realmente apagar este registro? Isso excluirá o pedido correspondente permanentemente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setItemToDelete(null)}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Apagando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    Apagar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
