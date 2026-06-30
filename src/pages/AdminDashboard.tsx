import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Users, ShoppingBag, DollarSign, Activity, ListOrdered, BellRing, Package, History } from 'lucide-react';
import AdminProducts from '../components/admin/AdminProducts';
import AdminCategories from '../components/admin/AdminCategories';
import AdminNotifications from '../components/admin/AdminNotifications';
import AdminAttributes from '../components/admin/AdminAttributes';
import AdminOrders from '../components/admin/AdminOrders';
import AdminEntradas from '../components/admin/AdminEntradas';
import AdminSalesHistory from '../components/admin/AdminSalesHistory';

export default function AdminDashboard() {
  const { user, perfil, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'categories' | 'notifications' | 'attributes' | 'sales_history'>('overview');
  const [receitaMensal, setReceitaMensal] = useState(0);

  useEffect(() => {
    async function fetchReceita() {
      try {
        const { data: pedidos } = await supabase
          .from('pedidos')
          .select(`itens_pedido (produto_id, produto_nome, produto_preco, quantidade)`)
          .eq('status', 'Pago');

        const { data: produtos } = await supabase.from('produtos').select('id, galeria');

        if (pedidos && produtos) {
          let totalLucro = 0;
          pedidos.forEach(pedido => {
            pedido.itens_pedido?.forEach((item: any) => {
              let custo = 0;
              if (item.produto_id) {
                const produtoDb = produtos.find(p => p.id === item.produto_id);
                if (produtoDb && produtoDb.galeria) {
                  const variant = produtoDb.galeria.find((g: any) => g.cor && item.produto_nome.includes(g.cor));
                  if (variant && variant.preco_custo) {
                    custo = parseFloat(variant.preco_custo);
                  } else if (produtoDb.galeria[0] && produtoDb.galeria[0].preco_custo) {
                    custo = parseFloat(produtoDb.galeria[0].preco_custo);
                  }
                }
              }
              totalLucro += (item.produto_preco - custo) * item.quantidade;
            });
          });
          setReceitaMensal(totalLucro);
        }
      } catch (err) {
        console.error('Erro ao buscar receita:', err);
      }
    }
    
    if (activeTab === 'overview') {
      fetchReceita();
    }
  }, [activeTab]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  // Proteção da rota: se não estiver logado ou não for Admin, redireciona para a home
  if (!user || perfil?.cargo !== 'Admin') {
    return <Navigate to="/" replace />;
  }

  const stats = [
    { name: 'Total de Clientes', value: '0', icon: Users, change: '+0%', changeType: 'positive' },
    { name: 'Pedidos Hoje', value: '0', icon: ShoppingBag, change: '+0%', changeType: 'positive' },
    { name: 'Receita Mensal', value: `R$ ${receitaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: DollarSign, change: 'Baseado no Lucro', changeType: 'positive' },
    { name: 'Acessos Ativos', value: '1', icon: Activity, change: 'Agora', changeType: 'neutral' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Painel de Administração</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Gerencie seus produtos, menu, clientes e notificações.
            </p>
          </div>
          
          <div className="flex overflow-x-auto bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-gray-700 no-scrollbar w-full">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 whitespace-nowrap text-sm font-medium rounded-md transition-colors ${
                activeTab === 'overview' 
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' 
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 whitespace-nowrap text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                activeTab === 'orders' 
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' 
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <ShoppingBag className="w-4 h-4" /> Vendas
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2 whitespace-nowrap text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                activeTab === 'products' 
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' 
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <Package className="w-4 h-4" /> Produtos
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-4 py-2 whitespace-nowrap text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                activeTab === 'categories' 
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' 
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <ListOrdered className="w-4 h-4" /> Menu do Site
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-4 py-2 whitespace-nowrap text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                activeTab === 'notifications' 
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' 
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <BellRing className="w-4 h-4" /> Disparar Avisos
            </button>
            <button
              onClick={() => setActiveTab('attributes')}
              className={`px-4 py-2 whitespace-nowrap text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                activeTab === 'attributes' 
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' 
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Atributos
            </button>
            <button
              onClick={() => setActiveTab('sales_history')}
              className={`px-4 py-2 whitespace-nowrap text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                activeTab === 'sales_history' 
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' 
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <History className="w-4 h-4" /> Histórico de Vendas
            </button>
          </div>
        </div>

        {activeTab === 'overview' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              {stats.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.name} className="bg-white dark:bg-gray-800 overflow-hidden shadow-soft rounded-xl">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <Icon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{item.name}</dt>
                            <dd>
                              <div className="text-lg font-bold text-gray-900 dark:text-white">{item.value}</div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900/50 px-5 py-3">
                      <div className="text-sm">
                        <span className={`font-medium ${
                          item.changeType === 'positive' ? 'text-green-600 dark:text-green-400' : 'text-gray-500'
                        }`}>
                          {item.change}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 ml-2">desde ontem</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pedidos Recentes na Visão Geral */}
            <div className="mt-8">
              <AdminOrders />
            </div>

            {/* Controle de Entradas e Custos */}
            <AdminEntradas />
          </>
        )}

        {activeTab === 'orders' && <AdminOrders />}
        {activeTab === 'products' && <AdminProducts />}
        {activeTab === 'categories' && <AdminCategories />}
        {activeTab === 'notifications' && <AdminNotifications />}
        {activeTab === 'attributes' && <AdminAttributes />}
        {activeTab === 'sales_history' && <AdminSalesHistory />}
      </div>
    </div>
  );
}
