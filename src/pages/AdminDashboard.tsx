import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Users, ShoppingBag, DollarSign, Activity } from 'lucide-react';

export default function AdminDashboard() {
  const { user, perfil, loading } = useAuth();

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
    { name: 'Receita Mensal', value: 'R$ 0,00', icon: DollarSign, change: '0%', changeType: 'neutral' },
    { name: 'Acessos Ativos', value: '1', icon: Activity, change: 'Agora', changeType: 'neutral' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Painel de Administração</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Visão geral da VantaTech. Os dados reais serão conectados ao banco de dados em breve.
          </p>
        </div>

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

        {/* Placeholder para tabelas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-800 shadow-soft rounded-xl p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Últimos Pedidos</h2>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingBag className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm text-gray-500">Nenhum pedido recente.</p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 shadow-soft rounded-xl p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Últimos Cadastros</h2>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm text-gray-500">A tabela de usuários será implementada aqui.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
