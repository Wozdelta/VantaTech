import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Users, ShoppingBag, DollarSign, Activity, ListOrdered, BellRing, Package, History, Award, Tag } from 'lucide-react';
import AdminProducts from '../components/admin/AdminProducts';
import AdminCategories from '../components/admin/AdminCategories';
import AdminNotifications from '../components/admin/AdminNotifications';
import AdminAttributes from '../components/admin/AdminAttributes';
import AdminOrders from '../components/admin/AdminOrders';
import AdminEntradas from '../components/admin/AdminEntradas';
import AdminSalesHistory from '../components/admin/AdminSalesHistory';
import AdminFidelidade from '../components/admin/AdminFidelidade';
import AdminCupons from '../components/admin/AdminCupons';

export default function AdminDashboard() {
  const { user, perfil, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'categories' | 'notifications' | 'attributes' | 'sales_history' | 'fidelidade' | 'cupons'>('overview');
  const [receitaMensal, setReceitaMensal] = useState(0);
  const [margemLucro, setMargemLucro] = useState(0);
  const [totalPedidos, setTotalPedidos] = useState(0);
  const [crescimentoPedidos, setCrescimentoPedidos] = useState(0);
  const [totalClientes, setTotalClientes] = useState(0);
  const [crescimentoClientes, setCrescimentoClientes] = useState(0);

  useEffect(() => {
    async function fetchReceita() {
      try {
        const { data: pedidos } = await supabase
          .from('pedidos')
          .select(`total, itens_pedido (produto_id, produto_nome, produto_preco, quantidade)`)
          .in('status', ['Entregue']);

        const { data: produtos } = await supabase.from('produtos').select('id, galeria');

        if (pedidos && produtos) {
          let totalLucro = 0;
          let totalVendas = 0;
          pedidos.forEach(pedido => {
            let totalProdutos = 0;
            pedido.itens_pedido?.forEach((item: any) => {
              totalProdutos += (item.produto_preco || 0) * (item.quantidade || 1);
            });

            let descontoPedido = 0;
            if (pedido.total && totalProdutos > 0 && pedido.total < totalProdutos) {
              descontoPedido = totalProdutos - pedido.total;
            }

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

              const proporcao = totalProdutos > 0 ? ((item.produto_preco * item.quantidade) / totalProdutos) : 0;
              const descontoItem = descontoPedido * proporcao;
              const vendaRealItem = (item.produto_preco * item.quantidade) - descontoItem;

              totalVendas += vendaRealItem;
              totalLucro += vendaRealItem - (custo * item.quantidade);
            });
          });
          setReceitaMensal(totalLucro);
          setMargemLucro(totalVendas > 0 ? (totalLucro / totalVendas) * 100 : 0);
        }

        // Buscar todos os pedidos para contar total e calcular crescimento
        const { data: todosPedidos } = await supabase.from('pedidos').select('criado_em');
        if (todosPedidos) {
          setTotalPedidos(todosPedidos.length);

          const hoje = new Date();
          const ontem = new Date();
          ontem.setDate(hoje.getDate() - 1);

          const inicioHoje = new Date(hoje.setHours(0, 0, 0, 0)).getTime();

          const totalPedidosHoje = todosPedidos.length;
          const totalPedidosAteOntem = todosPedidos.filter(p => new Date(p.criado_em).getTime() < inicioHoje).length;

          if (totalPedidosAteOntem > 0) {
            setCrescimentoPedidos(((totalPedidosHoje - totalPedidosAteOntem) / totalPedidosAteOntem) * 100);
          } else if (totalPedidosHoje > 0) {
            setCrescimentoPedidos(100);
          } else {
            setCrescimentoPedidos(0);
          }
        }

        // Buscar total de clientes cadastrados (perfis)
        const { data: todosClientes } = await supabase.from('perfis').select('*');
        if (todosClientes) {
          setTotalClientes(todosClientes.length);

          const hoje = new Date();
          const ontem = new Date();
          ontem.setDate(hoje.getDate() - 1);

          const inicioHoje = new Date(hoje.setHours(0, 0, 0, 0)).getTime();

          const totalClientesHoje = todosClientes.length;
          const totalClientesAteOntem = todosClientes.filter(c => {
            const dataStr = c.created_at || c.criado_em;
            if (!dataStr) return true; // Se não tem data, assume que é antigo
            return new Date(dataStr).getTime() < inicioHoje;
          }).length;

          if (totalClientesAteOntem > 0) {
            setCrescimentoClientes(((totalClientesHoje - totalClientesAteOntem) / totalClientesAteOntem) * 100);
          } else if (totalClientesHoje > 0) {
            setCrescimentoClientes(100);
          } else {
            setCrescimentoClientes(0);
          }
        }
      } catch (err) {
        console.error('Erro ao buscar receita:', err);
      }
    }

    if (activeTab === 'overview') {
      fetchReceita();
    }

    // Assinar mudanças no banco de dados para atualizar em tempo real
    const channel = supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos' },
        () => {
          if (activeTab === 'overview') {
            fetchReceita();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'perfis' },
        () => {
          if (activeTab === 'overview') {
            fetchReceita();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTab]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  // Proteção da rota: se não estiver logado ou não for Admin, redireciona para a home
  if (!user || perfil?.cargo !== 'Admin') {
    return <Navigate to="/" replace />;
  }

  const stats = [
    { name: 'Total de Clientes', value: totalClientes.toString(), icon: Users, change: `${crescimentoClientes > 0 ? '+' : ''}${crescimentoClientes.toFixed(0)}%`, changeType: crescimentoClientes >= 0 ? 'positive' : 'negative' },
    { name: 'Total de pedidos', value: totalPedidos.toString(), icon: ShoppingBag, change: `${crescimentoPedidos > 0 ? '+' : ''}${crescimentoPedidos.toFixed(0)}%`, changeType: crescimentoPedidos >= 0 ? 'positive' : 'negative' },
    { name: 'Receita Total', value: `R$ ${receitaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: DollarSign, change: `${margemLucro.toFixed(0)}%`, changeType: 'positive' },
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

          <div className="flex overflow-x-auto justify-start md:justify-center bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-gray-700 no-scrollbar w-full">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 whitespace-nowrap text-sm font-medium rounded-md transition-colors ${activeTab === 'overview'
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 whitespace-nowrap text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${activeTab === 'orders'
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
            >
              <ShoppingBag className="w-4 h-4" /> Pedidos
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2 whitespace-nowrap text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${activeTab === 'products'
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
            >
              <Package className="w-4 h-4" /> Produtos
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-4 py-2 whitespace-nowrap text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${activeTab === 'categories'
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
            >
              <ListOrdered className="w-4 h-4" /> Menu do Site
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-4 py-2 whitespace-nowrap text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${activeTab === 'notifications'
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
            >
              <BellRing className="w-4 h-4" /> Disparar Avisos
            </button>
            <button
              onClick={() => setActiveTab('attributes')}
              className={`px-4 py-2 whitespace-nowrap text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${activeTab === 'attributes'
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
            >
              Atributos
            </button>
            <button
              onClick={() => setActiveTab('fidelidade')}
              className={`px-4 py-2 whitespace-nowrap text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${activeTab === 'fidelidade'
                ? 'bg-vanta-orange/10 text-vanta-orange dark:bg-vanta-orange/20 dark:text-orange-400'
                : 'text-gray-500 hover:text-vanta-orange dark:text-gray-400 dark:hover:text-orange-400'
                }`}
            >
              <Award className="w-4 h-4" /> Fidelidade
            </button>
            <button
              onClick={() => setActiveTab('cupons')}
              className={`px-4 py-2 whitespace-nowrap text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${activeTab === 'cupons'
                ? 'bg-vanta-blue/10 text-vanta-blue dark:bg-blue-900/20 dark:text-blue-400'
                : 'text-gray-500 hover:text-vanta-blue dark:text-gray-400 dark:hover:text-blue-400'
                }`}
            >
              <Tag className="w-4 h-4" /> Cupons
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
                        <span className={`font-medium ${item.changeType === 'positive' ? 'text-green-600 dark:text-green-400' : 'text-gray-500'
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

        {activeTab === 'orders' && (
          <div className="space-y-8">
            <AdminOrders />
            <AdminSalesHistory />
          </div>
        )}
        {activeTab === 'products' && <AdminProducts />}
        {activeTab === 'categories' && <AdminCategories />}
        {activeTab === 'notifications' && <AdminNotifications />}
        {activeTab === 'attributes' && <AdminAttributes />}
        {activeTab === 'fidelidade' && <AdminFidelidade />}
        {activeTab === 'cupons' && <AdminCupons />}
      </div>
    </div>
  );
}
