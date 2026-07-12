import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAlert } from '../../contexts/AlertContext';
import { Ticket, Search, Filter, MessageCircle, Clock, ShieldAlert, Send, ArrowLeft, CheckCircle2, User, ChevronRight, Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useRealtimeUpdate } from '../../hooks/useRealtimeUpdate';
import { CustomSelect } from '../ui/CustomSelect';

const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateString)).replace(' de ', ' ');
};

export default function AdminTickets() {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tableExists, setTableExists] = useState(true);
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);
  const [otherTyping, setOtherTyping] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<any>(null);
  const lastTypingTime = useRef(0);

  useEffect(() => {
    fetchTickets();
  }, []);

  useRealtimeUpdate(['tickets'], fetchTickets);

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);
      
      const channel = supabase
        .channel(`ticket_messages_${selectedTicket.id}`, {
          config: { broadcast: { ack: false } }
        })
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'ticket_messages',
            filter: `ticket_id=eq.${selectedTicket.id}`
          },
          (payload) => {
            // Apenas adiciona se a mensagem já não estiver lá (pode acontecer se o próprio admin enviou e o state já atualizou via fetchMessages ou manualmente no handleSendMessage)
            setMessages((prev) => {
              if (prev.find(m => m.id === payload.new.id)) return prev;
              return [...prev, payload.new as any];
            });
            setOtherTyping(false); // limpa o digitando se chegou msg
          }
        )
        .on(
          'broadcast',
          { event: 'typing' },
          (payload) => {
            if (payload.payload.user_id !== user?.id) {
              setOtherTyping(true);
              if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
              typingTimeoutRef.current = setTimeout(() => setOtherTyping(false), 3000);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'tickets',
            filter: `id=eq.${selectedTicket.id}`
          },
          (payload) => {
            setSelectedTicket((prev: any) => prev?.id === payload.new.id ? { ...prev, ...payload.new } : prev);
            setTickets((prev) => prev.map(t => t.id === payload.new.id ? { ...t, ...payload.new } : t));
          }
        )
        .subscribe();

      channelRef.current = channel;

      return () => {
        supabase.removeChannel(channel);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      };
    }
  }, [selectedTicket]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sendingMsg, otherTyping]);

  const handleTyping = () => {
    const now = Date.now();
    if (now - lastTypingTime.current > 2000) {
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'typing',
          payload: { user_id: user?.id }
        }).catch(console.error);
      }
      lastTypingTime.current = now;
    }
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('atualizado_em', { ascending: false });

      if (error) {
        if (error.message.includes('relation "public.tickets" does not exist') || error.code === '42P01') {
          setTableExists(false);
        }
        throw error;
      }
      
      let finalTickets = data || [];
      
      if (finalTickets.length > 0) {
        const userIds = [...new Set(finalTickets.map(t => t.user_id))];
        const { data: perfisData } = await supabase
          .from('perfis')
          .select('*')
          .in('id', userIds);
          
        if (perfisData) {
          const perfisMap = perfisData.reduce((acc: any, p: any) => {
            acc[p.id] = p;
            return acc;
          }, {});
          
          finalTickets = finalTickets.map(t => ({
            ...t,
            user: perfisMap[t.user_id] || null
          }));
        }
      }
      
      setTickets(finalTickets);
      setTableExists(true);
    } catch (err: any) {
      console.error(err);
      showAlert({ type: 'error', message: err?.message || 'Erro ao carregar tickets. Veja o console.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('criado_em', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: string, userId: string, ticketAssunto: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: newStatus, atualizado_em: new Date().toISOString() })
        .eq('id', ticketId);

      if (error) throw error;

      showAlert({ type: 'success', message: `Status alterado para ${newStatus}` });
      window.dispatchEvent(new Event('update_counts'));
      
      // Update local state
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }

      // Notifica o usuário
      await supabase.from('notificacoes').insert({
        usuario_id: userId,
        titulo: 'Status do Chamado Atualizado',
        mensagem: `Seu ticket "${ticketAssunto}" agora está: ${newStatus}`,
        lida: false
      });

    } catch (err) {
      console.error(err);
      showAlert({ type: 'error', message: 'Erro ao atualizar status.' });
    }
  };

  const handleDeleteTicket = (ticketId: string) => {
    setTicketToDelete(ticketId);
  };

  const performDeleteTicket = async () => {
    if (!ticketToDelete) return;

    try {
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', ticketToDelete);

      if (error) throw error;

      showAlert({ type: 'success', message: 'Ticket apagado com sucesso' });
      setTickets(prev => prev.filter(t => t.id !== ticketToDelete));
      if (selectedTicket?.id === ticketToDelete) {
        setSelectedTicket(null);
      }
    } catch (err) {
      console.error(err);
      showAlert({ type: 'error', message: 'Erro ao apagar ticket' });
    } finally {
      setTicketToDelete(null);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket || !user) return;
    
    setSendingMsg(true);
    try {
      const { error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: selectedTicket.id,
          sender_id: user.id,
          conteudo: newMessage,
          is_admin: true
        });

      if (error) throw error;
      
      // Atualiza o updatedAt e status se estiver 'Aberto' ou 'Em análise'
      const newStatus = (selectedTicket.status === 'Aberto' || selectedTicket.status === 'Em análise') ? 'Respondido' : selectedTicket.status;
      
      await supabase.from('tickets').update({ 
        atualizado_em: new Date().toISOString(),
        status: newStatus,
        especialista_id: user.id
      }).eq('id', selectedTicket.id);

      setNewMessage('');
      fetchMessages(selectedTicket.id);
      fetchTickets();
      if (selectedTicket.status !== newStatus) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
      
      // Notifica usuário
      await supabase.from('notificacoes').insert({
        usuario_id: selectedTicket.user_id,
        titulo: 'Nova Resposta no Suporte',
        mensagem: `A VantaTech respondeu ao seu ticket: ${selectedTicket.assunto}`,
        lida: false
      });

    } catch (err) {
      console.error(err);
      showAlert({ type: 'error', message: 'Erro ao enviar mensagem.' });
    } finally {
      setSendingMsg(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Aberto': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Em análise': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Aguardando cliente': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'Respondido': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'Resolvido': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'Fechado': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.assunto.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.user?.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const abertos = tickets.filter(t => t.status === 'Aberto').length;
  const emAnalise = tickets.filter(t => t.status === 'Em análise' || t.status === 'Respondido').length;
  const fechados = tickets.filter(t => t.status === 'Resolvido' || t.status === 'Fechado').length;

  if (!tableExists) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-10 text-center shadow-sm border border-gray-100 dark:border-gray-700">
        <ShieldAlert className="w-12 h-12 text-vanta-orange mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Tabelas Inexistentes</h3>
        <p className="text-gray-500 mt-2 mb-4">A base de dados de tickets não foi encontrada. Você precisa rodar o script SQL de ativação da Central de Ajuda.</p>
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl text-left font-mono text-sm overflow-x-auto">
          <code>O script encontra-se no artefato de Setup SQL fornecido.</code>
        </div>
      </div>
    );
  }

  if (selectedTicket) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col h-[calc(100dvh-130px)] md:h-[750px] animate-fade-in">
        {/* Chat Header */}
        <div className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-start md:items-center gap-3 md:gap-4">
            <button 
              onClick={() => setSelectedTicket(null)}
              className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-100 transition-colors shrink-0 shadow-sm"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-bold text-base md:text-lg text-gray-900 dark:text-white line-clamp-2 md:line-clamp-1">
                  {selectedTicket.assunto}
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 md:gap-2 text-[11px] md:text-xs text-gray-500 font-medium">
                <span className={`px-2 py-0.5 rounded-full font-bold ${getStatusColor(selectedTicket.status)}`}>
                  {selectedTicket.status}
                </span>
                <span className="hidden md:inline">•</span>
                <span>#{selectedTicket.id.split('-')[0].toUpperCase()}</span>
                <span className="hidden md:inline">•</span>
                <span className="flex items-center gap-1 line-clamp-1"><User className="w-3 h-3"/> {selectedTicket.user?.nome_completo}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 justify-end w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t border-gray-200 dark:border-gray-700 md:border-none">
            <span className="text-xs font-bold text-gray-500 uppercase">Alterar Status:</span>
            <div className="relative">
              <button
                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-vanta-blue dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600 transition-colors"
              >
                {selectedTicket.status}
                <ChevronRight className={`w-4 h-4 transition-transform ${isStatusDropdownOpen ? 'rotate-90' : 'rotate-0'}`} />
              </button>
              
              {isStatusDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden z-50 animate-scale-in origin-top-right">
                  {['Aberto', 'Em análise', 'Aguardando cliente', 'Respondido', 'Resolvido', 'Fechado'].map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        handleUpdateStatus(selectedTicket.id, status, selectedTicket.user_id, selectedTicket.assunto);
                        setIsStatusDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        selectedTicket.status === status 
                          ? 'bg-vanta-blue/10 text-vanta-blue font-bold' 
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-vanta-blue dark:hover:text-vanta-blue'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => handleDeleteTicket(selectedTicket.id)}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800/50"
              title="Apagar Chamado"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6"
        >
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 max-w-[85%] ${msg.is_admin ? 'ml-auto flex-row-reverse' : ''}`}>
              <div className="flex-shrink-0">
                {msg.is_admin ? (
                  <div className="w-8 h-8 bg-vanta-blue text-white rounded-full flex items-center justify-center font-bold text-xs shadow-sm">
                    V
                  </div>
                ) : (
                  selectedTicket?.user?.avatar_url ? (
                    <img src={selectedTicket.user.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full object-cover shadow-sm border border-gray-100" />
                  ) : (
                    <div className="w-8 h-8 bg-gray-400 text-white rounded-full flex items-center justify-center font-bold text-xs shadow-sm">
                      {selectedTicket?.user?.nome_completo?.charAt(0) || '?'}
                    </div>
                  )
                )}
              </div>
              
              <div className={`flex flex-col gap-1 ${msg.is_admin ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    {msg.is_admin ? 'Equipe VantaTech' : (selectedTicket?.user?.nome_completo || 'Cliente')}
                  </span>
                  {msg.is_admin && (
                    <span className="text-[10px] bg-vanta-blue/10 text-vanta-blue px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                      Suporte
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(msg.criado_em))}
                  </span>
                </div>
                
                <div className={`p-4 rounded-2xl text-sm whitespace-pre-wrap shadow-sm ${
                  msg.is_admin 
                    ? 'bg-vanta-blue text-white rounded-tr-sm' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-sm border border-gray-200/50 dark:border-gray-700/50'
                }`}>
                  {msg.conteudo}
                </div>
              </div>
            </div>
          ))}

          {otherTyping && (
            <div className="flex gap-3 max-w-[85%] items-start">
              <div className="flex-shrink-0">
                {selectedTicket?.user?.avatar_url ? (
                  <img src={selectedTicket.user.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full object-cover shadow-sm border border-gray-100" />
                ) : (
                  <div className="w-8 h-8 bg-gray-400 text-white rounded-full flex items-center justify-center font-bold text-xs shadow-sm">
                    {selectedTicket?.user?.nome_completo?.charAt(0) || '?'}
                  </div>
                )}
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-2xl rounded-tl-sm text-gray-500 text-sm flex gap-1 items-center">
                 <span className="text-xs font-bold mr-1">Digitando</span>
                 <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                 <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                 <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          )}

          {sendingMsg && (
            <div className="flex gap-3 max-w-[85%] ml-auto flex-row-reverse">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full animate-pulse" />
              <div className="bg-vanta-blue/50 p-4 rounded-2xl rounded-tr-sm text-white text-sm flex gap-1">
                 <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                 <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                 <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="relative flex items-end gap-2">
            <textarea
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              placeholder="Escreva sua resposta para o cliente..."
              rows={1}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-vanta-blue dark:text-white transition-all resize-none max-h-32 min-h-[56px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sendingMsg}
              className="p-4 bg-vanta-blue text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 dark:bg-gray-700 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
              <Ticket className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500 dark:text-gray-400" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Total</p>
              <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{tickets.length}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-3xl shadow-sm border border-yellow-100 dark:border-yellow-900/30">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Abertos</p>
              <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{abertos}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-3xl shadow-sm border border-blue-100 dark:border-blue-900/30">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 leading-tight line-clamp-1">Em Análise</p>
              <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{emAnalise}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-3xl shadow-sm border border-green-100 dark:border-green-900/30">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900/30 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 leading-tight line-clamp-1">Resolvidos</p>
              <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{fechados}</h3>
            </div>
          </div>
        </div>
      </div>


      {/* Modal de Confirmação de Exclusão */}
      {ticketToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-scale-in border border-gray-100 dark:border-gray-700 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Apagar Ticket?</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Tem certeza que deseja apagar este ticket permanentemente? Essa ação não pode ser desfeita.
            </p>
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={() => setTicketToDelete(null)}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={performDeleteTicket}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-red-600/20"
              >
                Sim, apagar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header e Filtros */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="relative w-full md:w-auto flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar tickets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-vanta-blue dark:text-white transition-all"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-gray-400" />
          <CustomSelect
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            className="w-48"
            options={[
              { value: 'all', label: 'Todos os Status' },
              { value: 'Aberto', label: 'Aberto' },
              { value: 'Em análise', label: 'Em análise' },
              { value: 'Aguardando cliente', label: 'Aguardando cliente' },
              { value: 'Respondido', label: 'Respondido' },
              { value: 'Resolvido', label: 'Resolvido' },
              { value: 'Fechado', label: 'Fechado' }
            ]}
          />
        </div>
      </div>

      {/* Tabela de Tickets Desktop */}
      <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 text-xs uppercase tracking-wider text-gray-500 font-bold">
                <th className="p-4">Ticket</th>
                <th className="p-4">Usuário</th>
                <th className="p-4">Categoria</th>
                <th className="p-4">Status</th>
                <th className="p-4">Última Atualização</th>
                <th className="p-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-vanta-blue" />
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500 font-medium">
                    Nenhum ticket encontrado.
                  </td>
                </tr>
              ) : (
                filteredTickets.map(ticket => (
                  <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors group">
                    <td className="p-4">
                      <div className="font-bold text-gray-900 dark:text-white line-clamp-1 max-w-xs">{ticket.assunto}</div>
                      <div className="text-xs text-gray-500">#{ticket.id.split('-')[0].toUpperCase()}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {ticket.user?.avatar_url ? (
                           <img src={ticket.user.avatar_url} className="w-6 h-6 rounded-full" alt="avatar" />
                        ) : (
                           <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-500">
                             {ticket.user?.nome_completo?.charAt(0) || '?'}
                           </div>
                        )}
                        <div className="font-medium text-gray-900 dark:text-white text-sm line-clamp-1">
                          {ticket.user?.nome_completo || 'Usuário'}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-md font-medium">
                        {ticket.categoria}
                      </span>
                    </td>
                    <td className="p-4">
                      <CustomSelect
                        value={ticket.status}
                        onChange={(val) => handleUpdateStatus(ticket.id, val, ticket.user_id, ticket.assunto)}
                        className="w-40"
                        options={[
                          { value: 'Aberto', label: 'Aberto' },
                          { value: 'Em análise', label: 'Em análise' },
                          { value: 'Aguardando cliente', label: 'Aguardando cliente' },
                          { value: 'Respondido', label: 'Respondido' },
                          { value: 'Resolvido', label: 'Resolvido' },
                          { value: 'Fechado', label: 'Fechado' }
                        ]}
                      />
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(ticket.atualizado_em)}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedTicket(ticket)}
                          className="p-2 text-gray-400 hover:text-vanta-blue hover:bg-vanta-blue/10 rounded-xl transition-colors"
                          title="Responder Chamado"
                        >
                          <MessageCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTicket(ticket.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors"
                          title="Apagar Chamado"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lista de Tickets Mobile */}
      <div className="lg:hidden grid grid-cols-1 gap-4">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-vanta-blue" />
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-8 text-center text-gray-500 font-medium">
            Nenhum ticket encontrado.
          </div>
        ) : (
          filteredTickets.map(ticket => (
            <div key={ticket.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-3">
              <div className="flex justify-between items-start gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
                <div className="min-w-0">
                  <div className="font-bold text-gray-900 dark:text-white line-clamp-1">{ticket.assunto}</div>
                  <div className="text-xs text-gray-500">#{ticket.id.split('-')[0].toUpperCase()}</div>
                </div>
                <CustomSelect
                  value={ticket.status}
                  onChange={(val) => handleUpdateStatus(ticket.id, val, ticket.user_id, ticket.assunto)}
                  className="w-36 shrink-0"
                  options={[
                    { value: 'Aberto', label: 'Aberto' },
                    { value: 'Em análise', label: 'Em análise' },
                    { value: 'Aguardando cliente', label: 'Aguardando cliente' },
                    { value: 'Respondido', label: 'Respondido' },
                    { value: 'Resolvido', label: 'Resolvido' },
                    { value: 'Fechado', label: 'Fechado' }
                  ]}
                />
              </div>
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  {ticket.user?.avatar_url ? (
                     <img src={ticket.user.avatar_url} className="w-6 h-6 rounded-full shrink-0" alt="avatar" />
                  ) : (
                     <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-500 shrink-0">
                       {ticket.user?.nome_completo?.charAt(0) || '?'}
                     </div>
                  )}
                  <span className="font-medium text-gray-900 dark:text-white line-clamp-1 max-w-[120px]">{ticket.user?.nome_completo || 'Usuário'}</span>
                </div>
                <span className="text-xs text-gray-500 shrink-0">{formatDate(ticket.atualizado_em)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700 mt-1">
                <span className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-2 py-1 rounded-md font-medium">
                  {ticket.categoria}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSelectedTicket(ticket)}
                    className="p-2 text-gray-500 hover:text-vanta-blue hover:bg-vanta-blue/10 rounded-xl transition-colors bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTicket(ticket.id)}
                    className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
