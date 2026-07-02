import { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import BlockScreen from '@/components/common/BlockScreen';
import { supabase } from '@/lib/supabase';
import { Loader2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const initialCategory = searchParams.get('categoria');
  const { settings } = useSettings();
  const { perfil } = useAuth();
  const showLoja = settings.acesso_loja === 'todos' || perfil?.cargo === 'Admin';

  const [products, setProducts] = useState<DatabaseProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({
    Categorias: [],
    Marca: [],
    Condição: [],
    Memória: [],
    PrecoMin: '',
    PrecoMax: ''
  });
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) setSearchTerm(q);
  }, [searchParams]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeFilters]);

  const [dbMarcas, setDbMarcas] = useState<string[]>([]);
  const [dbCategorias, setDbCategorias] = useState<string[]>([]);

  useEffect(() => {
    async function fetchFilterLists() {
      const [marcasRes, categoriasRes] = await Promise.all([
        supabase.from('marcas').select('nome').order('nome'),
        supabase.from('categorias').select('nome').order('nome')
      ]);
      setDbMarcas(marcasRes.data?.map(m => m.nome) || []);
      setDbCategorias(categoriasRes.data?.map(c => c.nome) || []);
    }
    fetchFilterLists();
  }, []);

  // Atualiza os filtros descobrindo se a palavra é Marca ou Categoria
  useEffect(() => {
    const cat = searchParams.get('categoria');
    if (cat && (dbMarcas.length > 0 || dbCategorias.length > 0)) {
      const isMarca = dbMarcas.some(m => m.toLowerCase() === cat.toLowerCase());
      if (isMarca) {
        setActiveFilters(prev => ({ ...prev, Marca: [cat], Categorias: [] }));
      } else {
        setActiveFilters(prev => ({ ...prev, Categorias: [cat], Marca: [] }));
      }
    } else if (!cat) {
      // Se tiraram a categoria da URL, limpar
      setActiveFilters(prev => ({ ...prev, Categorias: [], Marca: [] }));
    }
  }, [location.search, dbMarcas, dbCategorias]);

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
      if (!product.nome?.toLowerCase().includes(term) && 
          !product.marca?.toLowerCase().includes(term) &&
          !product.categoria?.toLowerCase().includes(term)) {
        return false;
      }
    }

    if (activeFilters.Categorias?.length > 0) {
      const match = activeFilters.Categorias.some((c: string) => c.toLowerCase() === product.categoria?.toLowerCase());
      if (!match) return false;
    }
    if (activeFilters.Marca?.length > 0) {
      const match = activeFilters.Marca.some((m: string) => m.toLowerCase() === product.marca?.toLowerCase());
      if (!match) return false;
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

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (!showLoja) {
    return (
      <BlockScreen 
        title="Catálogo Fechado" 
        message="Nosso catálogo de produtos está temporariamente indisponível. Volte em breve para conferir as novidades!" 
      />
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 pt-8 lg:pt-16 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header e Busca */}
        <div className="mb-10 text-center animate-slide-up">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">Catálogo Completo</h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-8 text-lg">Encontre o aparelho perfeito para você usando nossos filtros avançados.</p>
          
          <div className="max-w-2xl mx-auto relative group">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400 group-focus-within:text-vanta-blue transition-colors" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por modelo, marca..."
              className="block w-full pl-12 pr-4 py-4 rounded-full border-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-vanta-blue shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(255,255,255,0.05)] transition-all text-base md:text-lg"
            />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <SidebarFilters 
            activeFilters={activeFilters} 
            onFilterChange={setActiveFilters} 
            marcas={dbMarcas}
            categorias={dbCategorias}
          />
          
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
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6">
                  {paginatedProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                
                {totalPages > 1 && (
                  <div className="mt-8 p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-gray-100 dark:border-gray-800">
                    <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                      Mostrando <span className="font-bold text-gray-900 dark:text-white">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> até <span className="font-bold text-gray-900 dark:text-white">{Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)}</span> de <span className="font-bold text-gray-900 dark:text-white">{filteredProducts.length}</span> aparelhos
                    </span>
                    <div className="flex items-center gap-1 bg-white dark:bg-gray-900 p-1 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                      <button
                        onClick={() => {
                          setCurrentPage(prev => Math.max(prev - 1, 1));
                          window.scrollTo({ top: 300, behavior: 'smooth' });
                        }}
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
                                onClick={() => {
                                  setCurrentPage(pageNum);
                                  window.scrollTo({ top: 300, behavior: 'smooth' });
                                }}
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
                        onClick={() => {
                          setCurrentPage(prev => Math.min(prev + 1, totalPages));
                          window.scrollTo({ top: 300, behavior: 'smooth' });
                        }}
                        disabled={currentPage === totalPages}
                        className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </>
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
