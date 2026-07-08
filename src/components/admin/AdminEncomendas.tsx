import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAlert } from '../../contexts/AlertContext';
import { Search, Loader2, MessageCircle, MoreVertical, Trash2, Package, Check, X as CloseIcon, User } from 'lucide-react';
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
  const [trackingInput, setTrackingInput] = useState<{ id: string, codigo: string } | null>(null);
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
      if (enc && enc.user_id) {
        await supabase.from('notificacoes').insert({
          usuario_id: enc.user_id,
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
      // 1. Deletar as mensagens associadas para não dar erro de restrição de chave estrangeira
      const { error: msgError } = await supabase.from('encomendas_mensagens').delete().eq('encomenda_id', id);
      if (msgError) throw msgError;
      
      // 2. Deletar a encomenda em si e retornar o dado deletado para confirmar que RLS não bloqueou
      const { data, error } = await supabase.from('encomendas_pedidos').delete().eq('id', id).select();
      
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('O banco de dados bloqueou a exclusão. Possível falta de permissão na tabela (RLS).');
      }

      setEncomendas(prev => prev.filter(e => e.id !== id));
      showAlert({ type: 'success', message: 'Encomenda deletada com sucesso.' });
    } catch (err: any) {
      console.error('Erro ao deletar encomenda manual:', err);
      showAlert({ type: 'error', message: `Erro ao deletar: ${err.message || 'Desconhecido'}` });
    }
  };

  const handleDeleteCancelado = async (id: string) => {
    try {
      await supabase.from('encomendas_mensagens').delete().eq('encomenda_id', id);
      const { error } = await supabase.from('encomendas_pedidos').delete().eq('id', id);
      if (error) throw error;
      
      setEncomendas(prev => prev.filter(e => e.id !== id));
      showAlert({ type: 'success', message: 'Encomenda deletada automaticamente.' });
    } catch (err) {
      console.error('Erro ao deletar encomenda cancelada:', err);
    }
  };

  const handleSaveTracking = async (id: string) => {
    if (!trackingInput?.codigo) return;
    try {
      const { error } = await supabase
        .from('encomendas_pedidos')
        .update({ codigo_rastreio: trackingInput.codigo })
        .eq('id', id);

      if (error) throw error;
      
      const enc = encomendas.find(e => e.id === id);
      if (enc && enc.user_id) {
        await supabase.from('notificacoes').insert({
          usuario_id: enc.user_id,
          titulo: `Código de Rastreio Disponível`,
          mensagem: `O código de rastreio da sua encomenda (${enc.marca} ${enc.modelo}) é: ${trackingInput.codigo}. Você já pode acompanhá-la!`,
          lida: false
        });
      }

      setTrackingInput(null);
      showAlert({ type: 'success', message: 'Código de rastreio salvo e cliente notificado!' });
      fetchEncomendas();
    } catch (err) {
      console.error('Erro ao salvar rastreio:', err);
      showAlert({ type: 'error', message: 'Erro ao vincular código de rastreio.' });
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
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 p-4 md:p-6">
            {filtered.map(enc => (
              <div key={enc.id} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                  <div className="flex flex-col gap-2">
                    <div className="font-bold text-gray-900 dark:text-white text-lg line-clamp-1">
                      {enc.marca} {enc.modelo}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-gray-500 bg-white dark:bg-gray-700 px-2 py-0.5 rounded-md border border-gray-200 dark:border-gray-600">
                        {enc.estado}
                      </span>
                      <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                         <User className="w-3.5 h-3.5" />
                         <span className="truncate max-w-[150px]">{enc.perfis?.nome_completo || 'Desconhecido'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-5 flex-1 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                       <p className="text-[10px] uppercase font-bold text-gray-400">Data</p>
                       <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{new Date(enc.criado_em).toLocaleDateString('pt-BR')}</p>
                     </div>
                     <div className="space-y-1">
                       <p className="text-[10px] uppercase font-bold text-gray-400">Total / Sinal</p>
                       {enc.valor_total ? (
                         <div className="flex flex-col gap-1">
                           <span className="font-black text-sm text-gray-900 dark:text-white leading-none">{Number(enc.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                           <span className="font-bold text-[10px] text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded inline-block w-fit border border-green-100 dark:border-green-800">
                             Sinal: {Number(enc.valor_sinal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                           </span>
                         </div>
                       ) : (
                         <span className="text-[11px] text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 border border-orange-100 dark:border-orange-800 rounded-md font-bold whitespace-nowrap">Em negociação</span>
                       )}
                     </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                     <div className="flex items-center gap-1.5">
                       <span className="font-bold text-gray-400 uppercase">Cor:</span> 
                       <span className="font-bold text-gray-700 dark:text-gray-300 truncate max-w-[100px]" title={enc.cor || '-'}>{enc.cor || '-'}</span>
                     </div>
                     <div className="flex items-center gap-1.5">
                       <span className="font-bold text-gray-400 uppercase">Armaz:</span> 
                       <span className="font-bold text-gray-700 dark:text-gray-300 truncate max-w-[100px]" title={enc.armazenamento || '-'}>{enc.armazenamento || '-'}</span>
                     </div>
                  </div>
                </div>

                <div className="p-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/30 space-y-4">
                   <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                     <div className="w-full sm:w-auto relative">
                        <select
                          value={enc.status}
                          onChange={(e) => handleUpdateStatus(enc.id, e.target.value)}
                          className={`text-xs font-bold rounded-xl px-3 py-2 outline-none cursor-pointer border w-full sm:w-auto transition-colors appearance-none pr-8 ${
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
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                           <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                        <CancelTimer enc={enc} onExpired={handleDeleteCancelado} />
                     </div>

                     <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                       {(() => {
                         const approvalMsg = enc.encomendas_mensagens?.find((m: any) => m.mensagem.includes('Agora que o pagamento foi aprovado'));
                         const isExpired = approvalMsg && (Date.now() - new Date(approvalMsg.criado_em).getTime()) > 3 * 60 * 60 * 1000;
                         
                         if (isExpired || enc.status === 'Concluído' || enc.status === 'Cancelado') {
                           return <span className="text-[10px] text-gray-400 font-bold uppercase whitespace-nowrap bg-gray-200/50 dark:bg-gray-700 px-3 py-1.5 rounded-lg">Chat Encerrado</span>;
                         }

                         return (
                           <button
                             onClick={() => setActiveChat(enc)}
                             className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-vanta-blue/10 text-vanta-blue hover:bg-vanta-blue hover:text-white rounded-xl transition-colors font-bold text-xs"
                           >
                             <MessageCircle className="w-4 h-4" />
                             Chat
                           </button>
                         );
                       })()}
                       <button
                         onClick={() => handleDeleteManual(enc.id)}
                         className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors shrink-0"
                         title="Deletar Encomenda"
                       >
                         <Trash2 className="w-5 h-5" />
                       </button>
                     </div>
                   </div>

                   {enc.status === 'Em Andamento' && (
                     <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                       {trackingInput?.id === enc.id ? (
                         <div className="flex items-center gap-2">
                           <input 
                             type="text"
                             value={trackingInput.codigo}
                             onChange={e => setTrackingInput({ ...trackingInput, codigo: e.target.value })}
                             placeholder="NL123456789BR"
                             className="w-full text-xs px-3 py-2 border border-vanta-blue/30 rounded-xl focus:outline-none focus:border-vanta-blue uppercase bg-white dark:bg-gray-800"
                             autoFocus
                           />
                           <button onClick={() => handleSaveTracking(enc.id)} className="p-2 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors" title="Salvar Rastreio">
                             <Check className="w-4 h-4" />
                           </button>
                           <button onClick={() => setTrackingInput(null)} className="p-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors" title="Cancelar">
                             <CloseIcon className="w-4 h-4" />
                           </button>
                         </div>
                       ) : (
                         <button 
                           onClick={() => setTrackingInput({ id: enc.id, codigo: enc.codigo_rastreio || '' })}
                           className="text-xs font-bold flex items-center justify-center gap-2 w-full py-2.5 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 hover:text-vanta-blue hover:border-vanta-blue transition-colors hover:bg-vanta-blue/5"
                         >
                           <Package className="w-4 h-4" />
                           {enc.codigo_rastreio ? 'Editar Rastreio' : 'Vincular Código de Rastreio'}
                         </button>
                       )}
                       {enc.codigo_rastreio && trackingInput?.id !== enc.id && (
                         <div className="text-xs text-vanta-blue font-bold mt-2 text-center bg-vanta-blue/10 rounded-xl py-2 flex items-center justify-center gap-2">
                           <Package className="w-4 h-4"/>
                           {enc.codigo_rastreio}
                         </div>
                       )}
                     </div>
                   )}
                </div>
              </div>
            ))}
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
