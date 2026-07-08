import { useState, useEffect } from 'react';
import { getAnalytics, type ChatLog } from '../../lib/chatbot/analytics';
import { MessageSquare, CheckCircle, XCircle, Activity, Smile, Frown, Bot, Download, Trash2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { supabase } from '@/lib/supabase';

export default function AdminChatbotAnalytics() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [filterIntent, setFilterIntent] = useState<string | null>(null);
  const [filterEmotion, setFilterEmotion] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    const data = await getAnalytics();
    if (data) setAnalytics(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const confirmClearLogs = async () => {
    setShowConfirm(false);
    setLoading(true);
    await supabase.from('historico_chatbot').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await fetchLogs();
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
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Bot className="w-8 h-8 text-vanta-blue" />
          <span className="leading-tight">Desempenho do Chatbot (IA)</span>
        </h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <button 
            onClick={() => setShowConfirm(true)}
            className="flex justify-center items-center gap-2 px-4 py-2.5 sm:py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl font-medium transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Limpar Logs
          </button>
          <button 
            onClick={exportData}
            className="flex justify-center items-center gap-2 px-4 py-2.5 sm:py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar Logs
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Conversas */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="p-2.5 sm:p-4 bg-blue-50 dark:bg-blue-900/20 text-vanta-blue rounded-xl sm:rounded-2xl shrink-0">
            <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 line-clamp-1" title="Total de Mensagens">Total de Mensagens</p>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{analytics.total}</h3>
          </div>
        </div>

        {/* Taxa de Resolução */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="p-2.5 sm:p-4 bg-green-50 dark:bg-green-900/20 text-green-500 rounded-xl sm:rounded-2xl shrink-0">
            <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 line-clamp-1" title="Taxa de Resolução">Taxa de Resolução</p>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{analytics.resolutionRate.toFixed(1)}%</h3>
          </div>
        </div>

        {/* Resolvidos (Evitou Tickets) */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="p-2.5 sm:p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-xl sm:rounded-2xl shrink-0">
            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 line-clamp-1" title="Sucessos (Evitou Ticket)">Sucessos (Evitou Ticket)</p>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{analytics.resolved}</h3>
          </div>
        </div>

        {/* Não Resolvidos (Gerou Ticket) */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="p-2.5 sm:p-4 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl sm:rounded-2xl shrink-0">
            <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 line-clamp-1" title="Fallback (Ticket)">Fallback (Ticket)</p>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{analytics.unresolved}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Assuntos Mais Frequentes</h3>
          {intentData.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={intentData}
                    innerRadius={75}
                    outerRadius={95}
                    cornerRadius={8}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    onClick={(data) => setFilterIntent(filterIntent === data.name.toLowerCase() ? null : data.name.toLowerCase())}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    {intentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                      backgroundColor: 'var(--tw-colors-white, #fff)',
                      color: '#1f2937',
                      fontWeight: 'bold'
                    }}
                    itemStyle={{ color: '#4b5563' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    iconType="circle"
                    wrapperStyle={{ paddingTop: '20px' }}
                    formatter={(value) => <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 ml-1">{value}</span>}
                  />
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
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={emotionData}
                    innerRadius={75}
                    outerRadius={95}
                    cornerRadius={8}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    onClick={(data) => {
                      const emotionMap: Record<string, string> = {
                        'Feliz / Satisfeito': 'happy',
                        'Neutro': 'neutral',
                        'Irritado / Frustrado': 'angry'
                      };
                      const emotionValue = emotionMap[data.name];
                      setFilterEmotion(filterEmotion === emotionValue ? null : emotionValue);
                    }}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    {emotionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                      backgroundColor: 'var(--tw-colors-white, #fff)',
                      color: '#1f2937',
                      fontWeight: 'bold'
                    }}
                    itemStyle={{ color: '#4b5563' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    iconType="circle"
                    wrapperStyle={{ paddingTop: '20px' }}
                    formatter={(value) => <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 ml-1">{value}</span>}
                  />
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
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Últimas Interações (Log em Tempo Real)</h3>
            {(filterIntent || filterEmotion) && (
              <button 
                onClick={() => { setFilterIntent(null); setFilterEmotion(null); }}
                className="text-xs px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors font-medium flex items-center gap-1"
              >
                <XCircle className="w-3 h-3" /> Limpar Filtro
              </button>
            )}
          </div>
          <span className="text-xs font-medium text-gray-500">
            {filterIntent || filterEmotion ? 'Mostrando resultados filtrados' : 'Mostrando últimas 50 mensagens'}
          </span>
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
              {analytics.recentLogs
                .filter((log: ChatLog) => !filterIntent || log.intencao === filterIntent)
                .filter((log: ChatLog) => !filterEmotion || log.emocao === filterEmotion)
                .map((log: ChatLog) => (
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
              {analytics.recentLogs
                .filter((log: ChatLog) => !filterIntent || log.intencao === filterIntent)
                .filter((log: ChatLog) => !filterEmotion || log.emocao === filterEmotion).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Nenhuma interação encontrada para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Confirmação de Limpeza de Logs */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-800 scale-in-center">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-8 h-8 text-red-600 dark:text-red-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-4">
              Limpar todos os logs?
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-center mb-8">
              Tem certeza que deseja apagar todo o histórico de interações do chatbot? Esta ação é permanente e não poderá ser desfeita.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-bold transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={confirmClearLogs}
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-500/30 hover:shadow-red-500/50"
              >
                Sim, Limpar Tudo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
