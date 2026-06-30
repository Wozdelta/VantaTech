import { ShoppingCart, Eye } from 'lucide-react';
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

export default function ProductCard({ product }: { product: DatabaseProduct }) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  };

  return (
    <Link to={`/produto/${product.id}`} className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-hover hover:-translate-y-1 transition-all duration-300 flex flex-col h-full relative text-left">
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

      {/* Image */}
      <div className="relative w-full h-56 sm:h-64 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center p-2 overflow-hidden">
        {product.imagem_url ? (
          <img src={product.imagem_url} alt={product.nome} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-24 h-32 bg-gray-200 dark:bg-gray-700 rounded-lg shadow-inner flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
            <span className="text-gray-400 dark:text-gray-500 font-bold text-sm rotate-[-45deg]">FOTO</span>
          </div>
        )}

      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-1">{product.marca}</div>
        <h3 className="font-bold text-gray-900 dark:text-white leading-tight mb-2 group-hover:text-vanta-blue dark:group-hover:text-blue-400 transition-colors line-clamp-2">
          {product.nome}
        </h3>

        <div className="flex flex-wrap gap-1 mb-4">
          <span className="text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-sm">
            {product.condicao?.replace(/premium/i, '').trim() || product.condicao}
          </span>
          {product.memoria && product.memoria.split(',').map((mem, idx) => (
            <span key={idx} className="text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-sm">
              {mem.trim()}
            </span>
          ))}
        </div>

        <div className="mt-auto pt-2">
          {product.preco_antigo && (
            <div className="text-xs text-gray-400 dark:text-gray-500 line-through mb-0.5">
              {formatPrice(product.preco_antigo)}
            </div>
          )}
          <div className="text-xl font-extrabold text-vanta-darkblue dark:text-blue-400">
            {formatPrice(product.preco)}
          </div>
        </div>

      </div>
    </Link>
  );
}
