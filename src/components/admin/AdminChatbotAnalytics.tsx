import { useState, useEffect } from 'react';
import { getAnalytics, type ChatLog } from '../../lib/chatbot/analytics';
import { MessageSquare, CheckCircle, XCircle, Activity, Smile, Frown, Bot, Download, Trash2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { supabase } from '@/lib/supabase';

export default function AdminChatbotAnalytics() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    const data = await getAnalytics();
    if (data) setAnalytics(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleClearLogs = async () => {
    if (window.confirm('Tem certeza que deseja limpar todos os logs do chatbot? Essa ação não pode ser desfeita.')) {
      setLoading(true);
      await supabase.from('historico_chatbot').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Deleta todos (hack simples pq delete() precisa de filtro)
      await fetchLogs();
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Carregando logs do chatbot...</div>;
  }

  if (!analytics || analytics.total === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        Nenhum log do chatbot disponível. Interaja com o bot para gerar dados.
      </div>
    );
  }

  // Prepara dados para os gráficos
  const intentData = Object.keys(analytics.intentCounts).map(key => ({
    name: key.toUpperCase(),
    value: analytics.intentCounts[key]
  })).sort((a, b) => b.value - a.value);

  const emotionData = [
    { name: 'Feliz / Satisfeito', value: analytics.emotionCounts['happy'] || 0, color: '#10B981' },
    { name: 'Neutro', value: analytics.emotionCounts['neutral'] || 0, color: '#6B7280' },
    { name: 'Irritado / Frustrado', value: analytics.emotionCounts['angry'] || 0, color: '#EF4444' },
  ].filter(d => d.value > 0);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

  const exportData = () => {
    const dataStr = JSON.stringify(analytics.recentLogs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'chatbot_logs.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Bot className="w-8 h-8 text-vanta-blue" />
          Desempenho do Chatbot (IA)
        </h2>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleClearLogs}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl font-medium transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Limpar Logs
          </button>
          <button 
            onClick={exportData}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar Logs
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Conversas */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-vanta-blue rounded-2xl">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total de Mensagens</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.total}</h3>
          </div>
        </div>

        {/* Taxa de Resolução */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-500 rounded-2xl">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Taxa de Resolução</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.resolutionRate.toFixed(1)}%</h3>
          </div>
        </div>

        {/* Resolvidos (Evitou Tickets) */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-2xl">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Sucessos (Evitou Ticket)</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.resolved}</h3>
          </div>
        </div>

        {/* Não Resolvidos (Gerou Ticket) */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-2xl">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Fails (Necessitou Ticket)</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.unresolved}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Assuntos Mais Frequentes</h3>
          {intentData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={intentData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {intentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">Sem dados suficientes</div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Sentimento do Cliente</h3>
          {emotionData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={emotionData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {emotionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
             <div className="flex items-center justify-center h-64 text-gray-500">Sem dados suficientes</div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Últimas Interações (Log em Tempo Real)</h3>
          <span className="text-xs font-medium text-gray-500">Mostrando últimas 50 mensagens</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-900/50 dark:text-gray-400">
              <tr>
                <th className="px-6 py-4">Data/Hora</th>
                <th className="px-6 py-4">Mensagem do Cliente</th>
                <th className="px-6 py-4">Intenção Detectada</th>
                <th className="px-6 py-4">Sentimento</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {analytics.recentLogs.map((log: ChatLog) => (
                <tr key={log.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                    {log.data_hora ? new Date(log.data_hora).toLocaleString('pt-BR') : '-'}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white max-w-[300px] truncate">
                    "{log.pergunta}"
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-vanta-blue rounded-lg text-xs font-bold uppercase">
                      {log.intencao}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {log.emocao === 'happy' ? <Smile className="w-5 h-5 text-green-500" /> : 
                     log.emocao === 'angry' ? <Frown className="w-5 h-5 text-red-500" /> : 
                     <span className="text-gray-400">-</span>}
                  </td>
                  <td className="px-6 py-4">
                    {log.resolvido ? (
                       <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                         <CheckCircle className="w-4 h-4" /> Resolvido
                       </span>
                    ) : (
                       <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
                         <XCircle className="w-4 h-4" /> Fallback
                       </span>
                    )}
                  </td>
                </tr>
              ))}
              {analytics.recentLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Nenhuma interação registrada ainda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
