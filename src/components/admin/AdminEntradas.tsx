import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAlert } from '../../contexts/AlertContext';
import { Loader2, Save, Search, TrendingUp, DollarSign } from 'lucide-react';

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
  precoCusto: number;
  lucro: number;
  isSaving: boolean;
};

export default function AdminEntradas() {
  const [items, setItems] = useState<EntryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSavingAll, setIsSavingAll] = useState(false);
  const { showAlert } = useAlert();

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
              const precoCusto = g.preco_custo ? parseFloat(g.preco_custo) : 0;
              
              entryItems.push({
                productId: product.id,
                variantIndex: index,
                nome: product.nome,
                cor: g.cor || 'Única',
                armazenamento: g.memoria || '',
                bateria: g.bateria || '',
                precoVenda,
                precoCusto,
                lucro: precoVenda - precoCusto,
                isSaving: false
              });
            }
          });
        } else {
          // Se não tem variações explícitas, pegar o produto base pela primeira imagem
          const precoVenda = product.preco;
          const precoCusto = product.galeria[0].preco_custo ? parseFloat(product.galeria[0].preco_custo) : 0;
          
          entryItems.push({
            productId: product.id,
            variantIndex: 0, // salvar no json da primeira imagem
            nome: product.nome,
            cor: 'Única',
            armazenamento: '',
            bateria: '',
            precoVenda,
            precoCusto,
            lucro: precoVenda - precoCusto,
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

  const handleCustoChange = (index: number, value: string) => {
    const newItems = [...items];
    const newCusto = parseFloat(value) || 0;
    newItems[index].precoCusto = newCusto;
    newItems[index].lucro = newItems[index].precoVenda - newCusto;
    setItems(newItems);
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
              preco_custo: item.precoCusto.toString()
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

  const unfilledCount = items.filter(i => !i.precoCusto || i.precoCusto === 0).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mt-8">
      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Entrada de Produtos (Lucro)
              {unfilledCount > 0 && (
                <span className="flex items-center justify-center bg-orange-500 text-white text-xs font-bold w-6 h-6 rounded-md shadow-sm ml-2" title={`${unfilledCount} itens sem custo preenchido`}>
                  {unfilledCount}
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Preencha o valor pago (custo) em cada aparelho para visualizar sua margem de lucro.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Buscar modelo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-vanta-blue"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
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
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Aparelho</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Detalhes</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Valor Venda</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor Pago (Custo)</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Lucro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredItems.map((item, index) => (
                <tr key={`${item.productId}-${item.variantIndex}`} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{item.nome}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Cor: <span className="font-medium">{item.cor}</span></span>
                      {(item.armazenamento || item.bateria) && (
                        <span className="text-xs text-gray-500">
                          {item.armazenamento} {item.armazenamento && item.bateria && ' | '} {item.bateria && `${item.bateria}% Bat.`}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      R$ {item.precoVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="relative w-32">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.precoCusto || ''}
                        onChange={(e) => handleCustoChange(index, e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-vanta-blue focus:ring-1 focus:ring-vanta-blue font-medium transition-colors"
                        placeholder="0.00"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className={`text-sm font-bold ${item.lucro > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                      R$ {item.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
