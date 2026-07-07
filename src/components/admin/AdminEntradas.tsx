import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAlert } from '../../contexts/AlertContext';
import { Loader2, Save, Search, TrendingUp, DollarSign, ChevronLeft, ChevronRight, LayoutGrid, List } from 'lucide-react';

type Product = {
  id: string;
  nome: string;
  preco: number;
  galeria: any[];
};

type EntryItem = {
  productId: string;
  variantIndex: number;
  nome: string;
  cor: string;
  armazenamento: string;
  bateria: string;
  precoVenda: number;
  precoCusto: number | null;
  lucro: number;
  isSaving: boolean;
};

export default function AdminEntradas() {
  const [items, setItems] = useState<EntryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;
  const { showAlert } = useAlert();

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('produtos')
        .select('id, nome, preco, galeria')
        .order('nome');

      if (error) throw error;

      const entryItems: EntryItem[] = [];

      data?.forEach((product: Product) => {
        if (!product.galeria || product.galeria.length === 0) return;

        // Verificar se tem variações (fotos com cor preenchida)
        const hasVariants = product.galeria.some(g => g.cor || g.preco);

        if (hasVariants) {
          product.galeria.forEach((g, index) => {
            if (g.cor || g.preco) {
              const precoVenda = g.preco ? parseFloat(g.preco) : product.preco;
              const precoCusto = g.preco_custo !== undefined && g.preco_custo !== null && g.preco_custo !== '' ? parseFloat(g.preco_custo) : null;
              
              entryItems.push({
                productId: product.id,
                variantIndex: index,
                nome: product.nome,
                cor: g.cor || 'Única',
                armazenamento: g.memoria || '',
                bateria: g.bateria || '',
                precoVenda,
                precoCusto,
                lucro: precoVenda - (precoCusto || 0),
                isSaving: false
              });
            }
          });
        } else {
          // Se não tem variações explícitas, pegar o produto base pela primeira imagem
          const precoVenda = product.preco;
          const precoCusto = product.galeria[0].preco_custo !== undefined && product.galeria[0].preco_custo !== null && product.galeria[0].preco_custo !== '' ? parseFloat(product.galeria[0].preco_custo) : null;
          
          entryItems.push({
            productId: product.id,
            variantIndex: 0, // salvar no json da primeira imagem
            nome: product.nome,
            cor: 'Única',
            armazenamento: '',
            bateria: '',
            precoVenda,
            precoCusto,
            lucro: precoVenda - (precoCusto || 0),
            isSaving: false
          });
        }
      });

      setItems(entryItems);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      showAlert({ title: 'Erro', message: 'Falha ao carregar lista de entradas.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  const handleCustoChange = (productId: string, variantIndex: number, value: string) => {
    const newItems = [...items];
    const itemIndex = newItems.findIndex(i => i.productId === productId && i.variantIndex === variantIndex);
    if (itemIndex > -1) {
      const newCusto = value === '' ? null : (parseFloat(value) || 0);
      newItems[itemIndex].precoCusto = newCusto;
      newItems[itemIndex].lucro = newItems[itemIndex].precoVenda - (newCusto || 0);
      setItems(newItems);
    }
  };

  const handleSaveAll = async () => {
    setIsSavingAll(true);
    try {
      // Agrupar itens por productId para não sobrescrever galerias e fazer menos requests
      const itemsByProduct = items.reduce((acc, item) => {
        if (!acc[item.productId]) acc[item.productId] = [];
        acc[item.productId].push(item);
        return acc;
      }, {} as Record<string, typeof items>);

      for (const [productId, productItems] of Object.entries(itemsByProduct)) {
        const { data: productData, error: fetchError } = await supabase
          .from('produtos')
          .select('galeria')
          .eq('id', productId)
          .single();

        if (fetchError) throw fetchError;

        const updatedGaleria = [...productData.galeria];
        
        productItems.forEach(item => {
          if (updatedGaleria[item.variantIndex]) {
            updatedGaleria[item.variantIndex] = {
              ...updatedGaleria[item.variantIndex],
              preco_custo: item.precoCusto !== null ? item.precoCusto.toString() : ''
            };
          }
        });

        const { error: updateError } = await supabase
          .from('produtos')
          .update({ galeria: updatedGaleria })
          .eq('id', productId);

        if (updateError) throw updateError;
      }
      showAlert({ title: 'Sucesso', message: 'Todos os custos foram salvos!', type: 'success' });
    } catch (error) {
      console.error('Erro ao salvar tudo:', error);
      showAlert({ title: 'Erro', message: 'Falha ao salvar alguns itens.', type: 'error' });
    } finally {
      setIsSavingAll(false);
    }
  };


  const filteredItems = items.filter(i => 
    i.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.cor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = filteredItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const unfilledCount = items.filter(i => i.precoCusto === null).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mt-8">
      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Entrada de Produtos (Lucro)
              {unfilledCount > 0 && (
                <span className="flex items-center justify-center bg-orange-500 text-white text-xs font-bold h-6 min-w-[24px] px-1.5 rounded-md shadow-sm ml-2" title={`${unfilledCount} itens sem custo preenchido`}>
                  {unfilledCount}
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Preencha o valor pago (custo) em cada aparelho para visualizar sua margem de lucro.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  placeholder="Buscar modelo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-vanta-blue"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
                      <div className="lg:hidden flex bg-gray-100 dark:bg-gray-900 p-1.5 rounded-xl shrink-0">
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center justify-center px-3 py-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-gray-800 text-vanta-blue shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
            title="Visão Minimalista (Tabela)"
          >
            <List className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`flex items-center justify-center px-3 py-2 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-white dark:bg-gray-800 text-vanta-blue shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
            title="Visão Detalhada (Cards)"
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
        </div>
            </div>
            <button
              onClick={handleSaveAll}
              disabled={isSavingAll}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-bold whitespace-nowrap disabled:opacity-50 w-full sm:w-auto"
            >
              {isSavingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar Todos
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 flex justify-center">
          <Loader2 className="w-8 h-8 text-vanta-blue animate-spin" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 text-center text-gray-500">
          Nenhum produto encontrado.
        </div>
      ) : (
      <>
<div className={`overflow-x-auto ${viewMode === 'table' ? 'block' : 'hidden'} lg:block`}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Aparelho</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Detalhes</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right whitespace-nowrap">Valor Venda</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Valor Pago (Custo)</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right whitespace-nowrap">Lucro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {paginatedItems.map((item) => (
                <tr key={`${item.productId}-${item.variantIndex}`} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap border-b border-gray-50 dark:border-gray-800 align-top">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{item.nome}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap border-b border-gray-50 dark:border-gray-800 align-top">
                    <div className="flex flex-col text-left">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Cor: <span className="font-medium">{item.cor}</span></span>
                      {(item.armazenamento || item.bateria) && (
                        <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                          {item.armazenamento && <div>Capacidade: <span className="font-medium">{item.armazenamento}</span></div>}
                          {item.bateria && <div>Saúde Bateria: <span className="font-medium">{item.bateria}%</span></div>}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white border-b border-gray-50 dark:border-gray-800 whitespace-nowrap text-right align-top">
                    R$ {item.precoVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap border-b border-gray-50 dark:border-gray-800 align-top">
                    <div className="flex flex-col gap-2">
                      <div className="relative w-full max-w-[150px]">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.precoCusto !== null ? item.precoCusto : ''}
                          onChange={(e) => handleCustoChange(item.productId, item.variantIndex, e.target.value)}
                          disabled={item.isSaving || item.precoCusto === 0}
                          className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-vanta-blue focus:ring-1 focus:ring-vanta-blue transition-colors disabled:opacity-50"
                          placeholder="0.00"
                        />
                      </div>
                      <button
                        onClick={() => {
                          if (item.precoCusto === 0) handleCustoChange(item.productId, item.variantIndex, "");
                          else handleCustoChange(item.productId, item.variantIndex, "0");
                        }}
                        className={`text-[10px] uppercase font-bold px-2 py-1.5 rounded transition-all w-max mt-1 ${item.precoCusto === 0 ? 'bg-vanta-blue/10 text-vanta-blue shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                        title={item.precoCusto === 0 ? "Remover 100% de lucro" : "Marcar 100% de lucro"}
                      >
                        100% Lucro
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap border-b border-gray-50 dark:border-gray-800 align-top">
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-sm font-bold ${item.lucro > 0 ? 'text-green-500 dark:text-green-400' : 'text-gray-500'}`}>
                        R$ {item.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      {item.isSaving && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Salvando...
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

<div className={`p-4 grid ${viewMode === 'cards' ? 'block' : 'hidden'} lg:hidden grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-gray-50/50 dark:bg-gray-900/20`}>
          {paginatedItems.map((item) => (
            <div key={`${item.productId}-${item.variantIndex}`} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none border border-gray-100 dark:border-gray-700 flex flex-col gap-4 relative overflow-hidden group hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-gray-100 dark:border-gray-700 pb-3">
                <span className="text-sm font-black text-gray-900 dark:text-white leading-tight flex-1 pr-2">{item.nome}</span>
                <span className="inline-flex flex-col text-right shrink-0">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Lucro</span>
                  <span className={`text-sm font-black ${item.lucro > 0 ? 'text-green-500 dark:text-green-400' : 'text-gray-400'}`}>
                    R$ {item.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </span>
              </div>

              {/* Body */}
              <div className="flex flex-col gap-1.5 py-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 font-medium">Cor</span>
                  <span className="font-bold text-gray-900 dark:text-gray-200">{item.cor}</span>
                </div>
                {item.armazenamento && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 font-medium">Capacidade</span>
                    <span className="font-bold text-gray-900 dark:text-gray-200">{item.armazenamento}</span>
                  </div>
                )}
                
                {item.bateria && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 font-medium">Saúde Bateria</span>
                    <span className="font-bold text-gray-900 dark:text-gray-200">{item.bateria}%</span>
                  </div>
                )}
              </div>

              {/* Footer (Preços) */}
              <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Valor Venda</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">R$ {item.precoVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-gray-500 font-bold uppercase tracking-wider">Custo (Valor Pago)</label>
                    <button
                      onClick={() => {
                        if (item.precoCusto === 0) handleCustoChange(item.productId, item.variantIndex, "");
                        else handleCustoChange(item.productId, item.variantIndex, "0");
                      }}
                      className={`text-[10px] uppercase font-bold px-2 py-1 rounded transition-all ${item.precoCusto === 0 ? 'bg-vanta-blue/10 text-vanta-blue shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                      title={item.precoCusto === 0 ? "Remover 100% de lucro" : "Marcar 100% de lucro"}
                    >
                      100% Lucro
                    </button>
                  </div>
                  <div className="relative w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.precoCusto !== null ? item.precoCusto : ''}
                      onChange={(e) => handleCustoChange(item.productId, item.variantIndex, e.target.value)}
                      disabled={item.precoCusto === 0}
                      className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold focus:outline-none focus:border-vanta-blue focus:ring-2 focus:ring-vanta-blue/20 transition-all shadow-sm disabled:opacity-50"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </>
      )}

      {!loading && totalPages > 1 && (
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            Mostrando <span className="font-bold text-gray-900 dark:text-white">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> até <span className="font-bold text-gray-900 dark:text-white">{Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)}</span> de <span className="font-bold text-gray-900 dark:text-white">{filteredItems.length}</span> resultados
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

    </div>
  );
}
