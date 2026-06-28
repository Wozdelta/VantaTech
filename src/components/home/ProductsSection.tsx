import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

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

export default function ProductsSection() {
  const [products, setProducts] = useState<DatabaseProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('ativo', true)
        .order('criado_em', { ascending: false })
        .limit(8);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pt-8">
      <div className="flex flex-col gap-8">
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-vanta-darkblue dark:text-white">Destaques</h2>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-vanta-blue" />
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400">Nenhum produto cadastrado no momento.</p>
            </div>
          )}
          
          {!loading && products.length > 0 && (
            <div className="mt-12 text-center">
               <Link to="/produtos" className="inline-block px-8 py-3 rounded-full border-2 border-vanta-blue dark:border-blue-500 text-vanta-blue dark:text-blue-500 font-bold hover:bg-vanta-blue dark:hover:bg-blue-500 hover:text-white dark:hover:text-white transition-colors duration-300">
                 Carregar mais produtos
               </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
