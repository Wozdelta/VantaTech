import { useState, useEffect } from 'react';
// Forcing Vite recompilation
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { Users, ShoppingBag, DollarSign, Activity, ListOrdered, BellRing, Package, History, Award, Tag, LogOut, LayoutDashboard, Moon, Sun, ShieldCheck, PackageSearch, MessageCircle, Bot } from 'lucide-react';
import AdminProducts from '../components/admin/AdminProducts';
import AdminCategories from '../components/admin/AdminCategories';
import AdminNotifications from '../components/admin/AdminNotifications';
import AdminAttributes from '../components/admin/AdminAttributes';
import AdminOrders from '../components/admin/AdminOrders';
import AdminEntradas from '../components/admin/AdminEntradas';
import AdminSalesHistory from '../components/admin/AdminSalesHistory';
import AdminFidelidade from '../components/admin/AdminFidelidade';
import AdminCupons from '../components/admin/AdminCupons';
import AdminControle from '../components/admin/AdminControle';
import AdminEncomendas from '../components/admin/AdminEncomendas';
import AdminTabelaPrecos from '../components/admin/AdminTabelaPrecos';
import AdminTickets from '../components/admin/AdminTickets';
import AdminChatbotAnalytics from '../components/admin/AdminChatbotAnalytics';

export default function AdminDashboard() {
  const { user, perfil, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'categories' | 'notifications' | 'attributes' | 'sales_history' | 'fidelidade' | 'cupons' | 'controle' | 'encomendas' | 'tabela_precos' | 'tickets' | 'chatbot'>('overview');
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  };

  const [receitaMensal, setReceitaMensal] = useState(0);
  const [margemLucro, setMargemLucro] = useState(0);
  const [totalPedidos, setTotalPedidos] = useState(0);
  const [crescimentoPedidos, setCrescimentoPedidos] = useState(0);
  const [totalClientes, setTotalClientes] = useState(0);
  const [crescimentoClientes, setCrescimentoClientes] = useState(0);
  const [topUser, setTopUser] = useState({ nome: 'Nenhum', pontos: 0 });
  
  const [pendingPedidosCount, setPendingPedidosCount] = useState(0);
  const [pendingFidelidadeCount, setPendingFidelidadeCount] = useState(0);
  const [pendingEncomendasCount, setPendingEncomendasCount] = useState(0);
  const [pendingTicketsCount, setPendingTicketsCount] = useState(0);

  useEffect(() => {
    if (perfil?.cargo !== 'Admin') return;
    
    const fetchCounts = async () => {
      const { data: pendingPedidos } = await supabase
        .from('pedidos')
        .select(`total, itens_pedido(produto_nome)`)
        .eq('status', 'Pendente');

      let fidelidadeC = 0;
      let regularC = 0;

      if (pendingPedidos) {
        pendingPedidos.forEach((p: any) => {
          if (Number(p.total) === 0 && p.itens_pedido?.some((i: any) => i.produto_nome.includes('[Vanta Club]'))) {
            fidelidadeC++;
          } else {
            regularC++;
          }
        });
      }
      setPendingPedidosCount(regularC);
      setPendingFidelidadeCount(fidelidadeC);
      
      try {
        const { count: encomendasCount } = await supabase
          .from('encomendas_pedidos')
          .select('*', { count: 'exact', head: true })
          .in('status', ['Pendente', 'Pagamento pendente']);

        setPendingEncomendasCount(encomendasCount || 0);
      } catch (err) {
        setPendingEncomendasCount(0);
      }
      
      try {
        const { count } = await supabase.from('tickets').select('id', { count: 'exact', head: true }).eq('status', 'Aberto');
        setPendingTicketsCount(count || 0);
      } catch (err) {}
    };

    fetchCounts();

    const channel = supabase
      .channel('counts-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, fetchCounts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'encomendas_pedidos' }, fetchCounts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, fetchCounts)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [perfil]);

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

        // Buscar top usuário em pontos
        const { data: topUserDb } = await supabase
          .from('perfis')
          .select('nome_completo, pontos')
          .order('pontos', { ascending: false })
          .limit(1);
        
        if (topUserDb && topUserDb.length > 0) {
          setTopUser({ nome: topUserDb[0].nome_completo || 'Sem Nome', pontos: topUserDb[0].pontos || 0 });
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
    { name: 'Total de Clientes', value: totalClientes.toString(), icon: Users, change: `${crescimentoClientes > 0 ? '+' : ''}${crescimentoClientes.toFixed(0)}%`, changeType: crescimentoClientes >= 0 ? 'positive' : 'negative', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { name: 'Total de pedidos', value: totalPedidos.toString(), icon: ShoppingBag, change: `${crescimentoPedidos > 0 ? '+' : ''}${crescimentoPedidos.toFixed(0)}%`, changeType: crescimentoPedidos >= 0 ? 'positive' : 'negative', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30' },
    { name: 'Receita Total', value: `R$ ${receitaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: DollarSign, change: `${margemLucro.toFixed(0)}%`, changeType: 'positive', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
    { name: 'Maior Pontuador', value: topUser.nome.split(' ')[0], icon: Award, change: `${topUser.pontos} pts`, changeType: 'positive', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  ];

  const navItems = [
    { id: 'overview', label: 'Visão Geral', icon: Activity },
    { id: 'orders', label: 'Pedidos', icon: ShoppingBag, badge: pendingPedidosCount },
    { id: 'products', label: 'Produtos', icon: Package },
    { id: 'categories', label: 'Menu do Site', icon: ListOrdered },
    { id: 'notifications', label: 'Avisos', icon: BellRing },
    { id: 'tickets', label: 'Suporte', icon: MessageCircle, badge: pendingTicketsCount },
    { id: 'fidelidade', label: 'Fidelidade', icon: Award, badge: pendingFidelidadeCount },
    { id: 'cupons', label: 'Cupons', icon: Tag },
    { id: 'encomendas', label: 'Encomendas', icon: PackageSearch, badge: pendingEncomendasCount },
    { id: 'tabela_precos', label: 'Tabela de Preços', icon: DollarSign },
    { id: 'chatbot', label: 'Chatbot IA', icon: Bot },
    { id: 'controle', label: 'Controle', icon: ShieldCheck },
  ] as const;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 h-full shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-vanta-blue to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
            Vanta<span className="text-vanta-blue">Admin</span>
          </h2>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all duration-300 ${
                  isActive 
                    ? 'bg-vanta-blue text-white shadow-md shadow-blue-500/20 translate-x-1' 
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'}`} />
                <span className="flex-1 text-left">{item.label}</span>
                {/* @ts-ignore */}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    isActive ? 'bg-white text-vanta-blue' : 'bg-red-500 text-white'
                  }`}>
                    {/* @ts-ignore */}
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-100 dark:border-gray-700">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Voltar para a Loja
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Mobile Nav */}
        <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 p-4">
          <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 whitespace-nowrap rounded-lg text-sm font-bold transition-colors ${
                    isActive 
                      ? 'bg-vanta-blue text-white' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                  {/* @ts-ignore */}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] leading-none ${
                      isActive ? 'bg-white text-vanta-blue' : 'bg-red-500 text-white'
                    }`}>
                      {/* @ts-ignore */}
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Topbar Desktop */}
        <header className="hidden lg:flex items-center justify-between px-8 py-5 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-0">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">
              {navItems.find(i => i.id === activeTab)?.label}
            </h1>
            <p className="text-sm text-gray-500">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-4">
             <button
               onClick={toggleTheme}
               className="p-2 text-gray-500 hover:text-vanta-blue dark:text-gray-400 dark:hover:text-vanta-orange bg-gray-100 dark:bg-gray-800 rounded-full transition-colors"
               title="Alternar Tema"
             >
               {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
             </button>
             <div className="px-4 py-2 bg-vanta-orange/10 text-vanta-orange rounded-full text-sm font-bold">
               Olá, {perfil?.nome_completo?.split(' ')[0] || 'Admin'} 👋
             </div>
          </div>
        </header>
        
        {/* Mobile Header (Sair) */}
        <div className="lg:hidden flex justify-end px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 font-bold hover:text-vanta-blue"
          >
            <LogOut className="w-4 h-4" />
            Voltar para a Loja
          </Link>
        </div>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="w-full pb-12">
            
            {activeTab === 'overview' && (
              <>
                {/* Stats Grid Premium */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10">
                  {stats.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.name} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-gray-100 dark:border-gray-700/50 hover:-translate-y-1 transition-transform duration-300">
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${item.bg}`}>
                            <Icon className={`h-7 w-7 ${item.color}`} aria-hidden="true" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{item.name}</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{item.value}</p>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm">
                          <span className={`inline-flex items-center px-2 py-1 rounded-md font-bold ${
                            item.changeType === 'positive' 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                            {item.change}
                          </span>
                          <span className="text-gray-400 dark:text-gray-500 ml-2 font-medium">desde ontem</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-8">
                  <AdminOrders />
                  <AdminEntradas />
                </div>
              </>
            )}

            {activeTab === 'orders' && (
              <div className="space-y-8">
                <AdminOrders />
                <AdminSalesHistory />
              </div>
            )}
            
            {activeTab === 'products' && <AdminProducts />}
            
            {activeTab === 'categories' && (
              <div className="space-y-8">
                <AdminCategories />
                <AdminAttributes />
              </div>
            )}
            
            {activeTab === 'notifications' && <AdminNotifications />}
            
            {activeTab === 'fidelidade' && <AdminFidelidade />}
            
            {activeTab === 'cupons' && <AdminCupons />}
            {activeTab === 'encomendas' && <AdminEncomendas />}
            {activeTab === 'tabela_precos' && <AdminTabelaPrecos />}
            {activeTab === 'tickets' && <AdminTickets />}
            {activeTab === 'chatbot' && <AdminChatbotAnalytics />}
            {activeTab === 'controle' && <AdminControle />}
          </div>
        </main>
      </div>
    </div>
  );
}
