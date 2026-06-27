import SidebarFilters from './SidebarFilters';
import ProductCard from './ProductCard';
import { PRODUCTS } from '@/lib/data';

export default function ProductsSection() {
  return (
    <div className="pt-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <SidebarFilters />
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-vanta-darkblue dark:text-white">Nossos Aparelhos</h2>
            <div className="text-sm text-gray-500 dark:text-gray-400">Exibindo {PRODUCTS.length} resultados</div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {PRODUCTS.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          
          <div className="mt-12 text-center">
             <button className="px-8 py-3 rounded-full border-2 border-vanta-blue dark:border-blue-500 text-vanta-blue dark:text-blue-500 font-bold hover:bg-vanta-blue dark:hover:bg-blue-500 hover:text-white dark:hover:text-white transition-colors duration-300">
               Carregar mais produtos
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
