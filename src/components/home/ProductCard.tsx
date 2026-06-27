import type { Product } from '@/lib/data';
import { ShoppingCart, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ProductCard({ product }: { product: Product }) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  };

  return (
    <div className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-hover hover:-translate-y-1 transition-all duration-300 flex flex-col h-full relative">
      {/* Badges */}
      {product.badge && (
        <div className="absolute top-3 left-3 z-10">
          <span className={`text-xs font-bold px-2 py-1 rounded-md text-white shadow-sm ${product.badge === 'Oferta' ? 'bg-vanta-orange' :
              product.badge === 'Novo' ? 'bg-green-500' : 'bg-vanta-darkblue'
            }`}>
            {product.badge}
          </span>
        </div>
      )}

      {/* Image Placeholder */}
      <div className="relative w-full aspect-[4/5] bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center p-6 overflow-hidden">
        <div className="w-24 h-32 bg-gray-200 dark:bg-gray-700 rounded-lg shadow-inner flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
          <span className="text-gray-400 dark:text-gray-500 font-bold text-sm rotate-[-45deg]">FOTO</span>
        </div>

        {/* Quick Actions overlay */}
        <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
          <button className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg text-gray-700 dark:text-gray-300 hover:text-vanta-blue dark:hover:text-vanta-blue hover:scale-110 transition-all">
            <Eye className="w-5 h-5" />
          </button>
          <button className="p-3 bg-vanta-blue rounded-full shadow-lg text-white hover:bg-vanta-darkblue hover:scale-110 transition-all">
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-1">{product.brand}</div>
        <h3 className="font-bold text-gray-900 dark:text-white leading-tight mb-2 group-hover:text-vanta-blue dark:group-hover:text-blue-400 transition-colors line-clamp-2">
          {product.name}
        </h3>

        <div className="flex flex-wrap gap-1 mb-4">
          <span className="text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-sm">
            {product.condition}
          </span>
          <span className="text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-sm">
            {product.memory}
          </span>
        </div>

        <div className="mt-auto pt-2">
          {product.oldPrice && (
            <div className="text-xs text-gray-400 dark:text-gray-500 line-through mb-0.5">
              {formatPrice(product.oldPrice)}
            </div>
          )}
          <div className="text-xl font-extrabold text-vanta-darkblue dark:text-blue-400">
            {formatPrice(product.price)}
          </div>
        </div>

        <Link
          to={`/produto/${product.id}`}
          className="mt-4 w-full block text-center py-2.5 rounded-lg border border-vanta-blue text-vanta-blue dark:border-blue-500 dark:text-blue-500 font-semibold group-hover:bg-gradient-primary group-hover:text-white group-hover:border-transparent transition-all duration-300"
        >
          Ver Produto
        </Link>
      </div>
    </div>
  );
}
