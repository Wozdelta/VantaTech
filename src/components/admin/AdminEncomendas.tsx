import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAlert } from '../../contexts/AlertContext';
import { Search, Loader2, MessageCircle, MoreVertical, Trash2 } from 'lucide-react';
import EncomendaChat from '../encomendas/EncomendaChat';

const CancelTimer = ({ enc, onExpired }: { enc: any, onExpired: (id: string) => void }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (enc.status !== 'Cancelado' || !enc.cancelado_em) return;

    const checkTime = () => {
      const cancelTime = new Date(enc.cancelado_em).getTime();
      const deleteTime = cancelTime + 10 * 60 * 1000;
      const now = new Date().getTime();
      const diff = deleteTime - now;

      if (diff <= 0) {
        onExpired(enc.id);
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    checkTime();
    const interval = setInterval(checkTime, 1000);
    return () => clearInterval(interval);
  }, [enc, onExpired]);

  if (enc.status !== 'Cancelado' || !enc.cancelado_em || !timeLeft) return null;

  return (
    <div className="text-[10px] text-red-500 font-bold mt-2 animate-pulse text-center">
      Deletando em: {timeLeft}
    </div>
  );
};

export default function AdminEncomendas() {
  const [encomendas, setEncomendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'Pendentes' | 'Em Andamento' | 'Histórico'>('Pendentes');
  const [activeChat, setActiveChat] = useState<any | null>(null);
  const { showAlert } = useAlert();

  const fetchEncomendas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('encomendas_pedidos')
        .select('*, perfis(*), encomendas_mensagens(mensagem, criado_em)')
        .order('criado_em', { ascending: false });
        
      if (error) throw error;
      setEncomendas(data || []);
    } catch (err) {
      console.error('Erro ao buscar encomendas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEncomendas();
  }, []);

  const handleUpdateStatus = async (id: string, novoStatus: string) => {
    try {
      const updateData: any = { status: novoStatus };
      if (novoStatus === 'Cancelado') {
        updateData.cancelado_em = new Date().toISOString();
      } else {
        updateData.cancelado_em = null;
      }

      const { error } = await supabase
        .from('encomendas_pedidos')
        .update(updateData)
        .eq('id', id);
        
      if (error) throw error;
      
      const enc = encomendas.find(e => e.id === id);
      if (enc && enc.usuario_id) {
        await supabase.from('notificacoes').insert({
          usuario_id: enc.usuario_id,
          titulo: `Status da Encomenda`,
          mensagem: `Sua encomenda do ${enc.marca} ${enc.modelo} mudou para: ${novoStatus}.`,
          lida: false
        });
      }
      
      showAlert({ type: 'success', message: 'Status atualizado com sucesso!' });
      fetchEncomendas();
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      showAlert({ type: 'error', message: 'Erro ao atualizar status.' });
    }
  };

  const handleDeleteManual = async (id: string) => {
    const confirmed = await showAlert({
      title: 'Deletar Encomenda',
      message: 'Tem certeza que deseja deletar permanentemente esta encomenda?',
      type: 'warning',
      showConfirm: true
    });
    if (!confirmed) return;

    try {
      await supabase.from('encomendas_pedidos').delete().eq('id', id);
      setEncomendas(prev => prev.filter(e => e.id !== id));
      showAlert({ type: 'success', message: 'Encomenda deletada.' });
    } catch (err) {
      console.error('Erro ao deletar encomenda manual:', err);
      showAlert({ type: 'error', message: 'Erro ao deletar encomenda.' });
    }
  };

  const handleDeleteCancelado = async (id: string) => {
    try {
      await supabase.from('encomendas_pedidos').delete().eq('id', id);
      setEncomendas(prev => prev.filter(e => e.id !== id));
      showAlert({ type: 'success', message: 'Encomenda cancelada foi deletada automaticamente.' });
    } catch (err) {
      console.error('Erro ao deletar encomenda cancelada:', err);
    }
  };

  const filteredByTab = encomendas.filter(enc => {
    if (activeTab === 'Pendentes') return enc.status === 'Pendente' || enc.status === 'Pagamento pendente';
    if (activeTab === 'Em Andamento') return enc.status === 'Em Andamento';
    return enc.status === 'Concluído' || enc.status === 'Cancelado';
  });

  const filtered = filteredByTab.filter(enc => 
    enc.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enc.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enc.perfis?.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-black text-gray-900 dark:text-white">Gerenciar Encomendas</h2>
        
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Buscar encomenda ou cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-vanta-blue transition-colors"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {(['Pendentes', 'Em Andamento', 'Histórico'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === tab 
                ? 'bg-vanta-blue text-white shadow-md shadow-blue-500/20' 
                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
            }`}
          >
            {tab === 'Histórico' ? 'Concluídos/Cancelados' : tab}
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === tab ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'}`}>
              {encomendas.filter(e => {
                if (tab === 'Pendentes') return e.status === 'Pendente' || e.status === 'Pagamento pendente';
                if (tab === 'Em Andamento') return e.status === 'Em Andamento';
                return e.status === 'Concluído' || e.status === 'Cancelado';
              }).length}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-vanta-blue" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400">
            Nenhuma encomenda encontrada.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-300 font-bold border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Aparelho</th>
                  <th className="px-6 py-4">Especificações</th>
                  <th className="px-6 py-4">Financeiro</th>
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
                {filtered.map(enc => (
                  <tr key={enc.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold">{enc.perfis?.nome_completo || 'Desconhecido'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 dark:text-white">{enc.marca} {enc.modelo}</div>
                      <div className="text-xs inline-block mt-1 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{enc.estado}</div>
                    </td>
                    <td className="px-6 py-4 text-xs space-y-1">
                      <div><span className="font-bold">Cor:</span> {enc.cor || '-'}</div>
                      <div><span className="font-bold">Armaz.:</span> {enc.armazenamento || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      {enc.valor_total ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 w-10">Total</span>
                            <span className="font-black text-sm text-gray-900 dark:text-white">{Number(enc.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 w-10">Sinal</span>
                            <span className="font-bold text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-md">{Number(enc.valor_sinal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-600 italic font-medium">Em negociação...</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs whitespace-nowrap">
                      {new Date(enc.criado_em).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={enc.status}
                        onChange={(e) => handleUpdateStatus(enc.id, e.target.value)}
                        className={`text-xs font-bold rounded-full px-3 py-1 outline-none cursor-pointer border ${
                          enc.status === 'Concluído' ? 'bg-green-100 text-green-700 border-green-200' :
                          enc.status === 'Em Andamento' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                          enc.status === 'Pagamento pendente' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                          enc.status === 'Cancelado' ? 'bg-red-100 text-red-700 border-red-200' :
                          'bg-orange-100 text-orange-700 border-orange-200'
                        }`}
                      >
                        <option value="Pendente">Pendente</option>
                        <option value="Pagamento pendente">Pagamento pendente</option>
                        <option value="Em Andamento">Em Andamento</option>
                        <option value="Concluído">Concluído</option>
                        <option value="Cancelado">Cancelado</option>
                      </select>
                      <CancelTimer enc={enc} onExpired={handleDeleteCancelado} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(() => {
                          const approvalMsg = enc.encomendas_mensagens?.find((m: any) => m.mensagem.includes('Agora que o pagamento foi aprovado'));
                          const isExpired = approvalMsg && (Date.now() - new Date(approvalMsg.criado_em).getTime()) > 3 * 60 * 60 * 1000;
                          
                          if (isExpired || enc.status === 'Concluído' || enc.status === 'Cancelado') {
                            return <span className="text-xs text-gray-400 font-medium whitespace-nowrap">Chat Encerrado</span>;
                          }

                          return (
                            <button
                              onClick={() => setActiveChat(enc)}
                              className="inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-vanta-blue/10 text-vanta-blue hover:bg-vanta-blue hover:text-white rounded-lg transition-colors font-bold text-xs"
                            >
                              <MessageCircle className="w-4 h-4" />
                              Chat
                            </button>
                          );
                        })()}
                        <button
                          onClick={() => handleDeleteManual(enc.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Deletar Encomenda"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {activeChat && (
        <EncomendaChat 
          encomenda={activeChat} 
          onClose={() => {
            setActiveChat(null);
            fetchEncomendas();
          }} 
        />
      )}
    </div>
  );
}
