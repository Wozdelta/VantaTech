import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Search } from 'lucide-react';
import SidebarFilters from '@/components/home/SidebarFilters';
import ProductCard from '@/components/home/ProductCard';

type DatabaseProduct = {
  id: string;
  nome: string;
  marca: string;
  condicao: string;
  memoria: string;
  cor: string;
  preco: number;
  preco_antigo: number | null;
  badge: string | null;
  categoria: string;
  imagem_url: string;
};

export default function Produtos() {
  const [products, setProducts] = useState<DatabaseProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
    window.scrollTo(0, 0);
  }, []);

  async function fetchProducts() {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('ativo', true)
        .order('criado_em', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = products.filter(product => {
    // Busca por texto (nome ou marca)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!product.nome.toLowerCase().includes(term) && !product.marca.toLowerCase().includes(term)) {
        return false;
      }
    }

    if (activeFilters.Categorias?.length > 0) {
      if (!activeFilters.Categorias.includes(product.categoria)) return false;
    }
    if (activeFilters.Marca?.length > 0) {
      if (!activeFilters.Marca.includes(product.marca)) return false;
    }
    if (activeFilters.Condição?.length > 0) {
      const match = activeFilters.Condição.some((c: string) => c.toLowerCase() === product.condicao?.toLowerCase());
      if (!match) return false;
    }
    if (activeFilters['Memória']?.length > 0) {
      const productMemories = product.memoria ? product.memoria.split(',').map(m => m.trim().toLowerCase()) : [];
      const hasMatch = activeFilters['Memória'].some((mem: string) => productMemories.includes(mem.toLowerCase()));
      if (!hasMatch) return false;
    }
    if (activeFilters.PrecoMin) {
      if (product.preco < Number(activeFilters.PrecoMin)) return false;
    }
    if (activeFilters.PrecoMax) {
      if (product.preco > Number(activeFilters.PrecoMax)) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header e Busca */}
        <div className="mb-10 text-center animate-slide-up">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">Catálogo Completo</h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-8 text-lg">Encontre o aparelho perfeito para você usando nossos filtros avançados.</p>
          
          <div className="max-w-2xl mx-auto relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-6 w-6 text-gray-400 group-focus-within:text-vanta-blue transition-colors" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por modelo, marca..."
              className="block w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-vanta-blue focus:border-transparent transition-all shadow-sm text-lg"
            />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <SidebarFilters onFilterChange={setActiveFilters} />
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Resultados da Busca</h2>
              <div className="text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full">
                {filteredProducts.length} aparelho{filteredProducts.length !== 1 && 's'}
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-vanta-blue" />
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-gray-800 border-dashed">
                <div className="bg-white dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Nenhum aparelho encontrado</h3>
                <p className="text-gray-500 dark:text-gray-400">Tente ajustar seus filtros ou mudar o termo da busca.</p>
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setActiveFilters({});
                  }}
                  className="mt-6 text-vanta-blue font-bold hover:underline"
                >
                  Limpar todos os filtros
                </button>
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}
