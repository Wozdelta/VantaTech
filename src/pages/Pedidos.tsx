import { useAuth } from '../contexts/AuthContext';
import { Package, Clock, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Pedidos() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-gray-500">Você precisa estar logado para ver esta página.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
          <Package className="w-8 h-8 mr-3 text-vanta-blue" />
          Meus Pedidos
        </h1>
      </div>
      
      {/* Estado Vazio (Placeholder) */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft p-12 text-center">
        <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Você ainda não fez nenhum pedido</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
          Quando você comprar seus produtos, o histórico, rastreio e status aparecerão aqui.
        </p>
        <Link to="/" className="inline-flex items-center justify-center px-8 py-3 bg-vanta-blue text-white font-bold rounded-xl hover:bg-vanta-darkblue transition-colors hover:-translate-y-1">
          Ir para as compras
        </Link>
      </div>
      
      {/* Exemplo de Layout para Pedidos Futuros */}
      <div className="mt-12 opacity-50 pointer-events-none">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-gray-400" />
          Exemplo de histórico futuro
        </h3>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
            <div>
              <p className="text-sm text-gray-500">Pedido <span className="font-bold text-gray-900 dark:text-white">#0001</span></p>
              <p className="text-xs text-gray-400">Realizado em 27/06/2026</p>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              Entregue
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-900 rounded-lg flex items-center justify-center">
              <span className="text-xs font-bold text-gray-400">FOTO</span>
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white">iPhone 15 Pro Max</p>
              <p className="text-sm font-semibold text-vanta-blue">R$ 7.999,00</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
