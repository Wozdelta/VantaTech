import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Ticket, Search, Clock, CheckCircle2, MessageCircle, XCircle, ArrowLeft, Send, ShieldAlert, FileText, Loader2, ChevronRight } from 'lucide-react';
import AjudaTicketForm from './AjudaTicketForm';
import { useAlert } from '../../contexts/AlertContext';

const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateString)).replace(' de ', ' ');
};

export default function AjudaMeusTickets({ user, perfil }: { user: any, perfil: any }) {
  const { showAlert } = useAlert();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [isOpeningNew, setIsOpeningNew] = useState(false);
  const [tableExists, setTableExists] = useState(true);
  const [otherTyping, setOtherTyping] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<any>(null);
  const lastTypingTime = useRef(0);

  useEffect(() => {
    fetchTickets();
  }, [user]);

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
            setMessages((prev) => {
              if (prev.find(m => m.id === payload.new.id)) return prev;
              return [...prev, payload.new as any];
            });
            setOtherTyping(false);
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
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('atualizado_em', { ascending: false });

      if (error) {
        if (error.message.includes('relation "public.tickets" does not exist') || error.code === '42P01') {
          setTableExists(false);
        }
        throw error;
      }
      
      setTickets(data || []);
      setTableExists(true);
    } catch (err) {
      console.error(err);
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
          is_admin: false
        });

      if (error) throw error;
      
      // Atualiza o updatedAt do ticket
      await supabase.from('tickets').update({ atualizado_em: new Date().toISOString() }).eq('id', selectedTicket.id);

      setNewMessage('');
      fetchMessages(selectedTicket.id);
      fetchTickets();
      
      // Notifica admin
      const { data: admins } = await supabase.from('perfis').select('id').eq('cargo', 'Admin');
      if (admins && admins.length > 0) {
        await supabase.from('notificacoes').insert(
          admins.map(admin => ({
            usuario_id: admin.id,
            titulo: 'Nova Resposta no Ticket',
            mensagem: `Ticket #${selectedTicket.id.split('-')[0].toUpperCase()}`,
            lida: false
          }))
        );
      }

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
      case 'Respondido': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'Resolvido': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'Fechado': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  if (!user) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-10 text-center shadow-sm border border-gray-100 dark:border-gray-700">
        <ShieldAlert className="w-12 h-12 text-vanta-orange mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Acesso Restrito</h3>
        <p className="text-gray-500 mt-2">Você precisa estar logado para acessar seus tickets.</p>
      </div>
    );
  }

  if (!tableExists) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-10 text-center shadow-sm border border-gray-100 dark:border-gray-700">
        <ShieldAlert className="w-12 h-12 text-vanta-orange mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Sistema em Manutenção</h3>
        <p className="text-gray-500 mt-2 mb-4">A base de dados de tickets não foi encontrada. O administrador precisa rodar o script SQL de ativação.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-vanta-blue animate-spin" />
      </div>
    );
  }

  // Visualização de um Ticket Específico (Chat)
  if (selectedTicket) {
    const isClosed = selectedTicket.status === 'Resolvido' || selectedTicket.status === 'Fechado';
    return (
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col h-[700px] animate-fade-in">
        {/* Chat Header */}
        <div className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSelectedTicket(null)}
              className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-1">
                  {selectedTicket.assunto}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${getStatusColor(selectedTicket.status)}`}>
                  {selectedTicket.status}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium">
                Ticket #{selectedTicket.id.split('-')[0].toUpperCase()} • {formatDate(selectedTicket.criado_em)}
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6"
        >
          {/* Informações Iniciais do Chamado */}
          <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 mb-6 text-sm">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 font-medium mb-2">
              <FileText className="w-4 h-4" /> Detalhes do Chamado
            </div>
            <p className="text-gray-700 dark:text-gray-300"><strong>Categoria:</strong> {selectedTicket.categoria}</p>
            {selectedTicket.pedido_id && (
              <p className="text-gray-700 dark:text-gray-300"><strong>Pedido Relacionado:</strong> #{selectedTicket.pedido_id.split('-')[0].toUpperCase()}</p>
            )}
          </div>

          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 max-w-[85%] ${msg.sender_id === user.id ? 'ml-auto flex-row-reverse' : ''}`}>
              <div className="flex-shrink-0">
                {!msg.is_admin && perfil?.avatar_url ? (
                  <img src={perfil.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full object-cover shadow-sm border border-gray-100" />
                ) : (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${msg.is_admin ? 'bg-vanta-blue' : 'bg-gray-400'}`}>
                    {msg.is_admin ? 'V' : (perfil?.nome_completo?.charAt(0) || '?')}
                  </div>
                )}
              </div>
              
              <div className={`flex flex-col gap-1 ${msg.sender_id === user.id ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    {msg.is_admin ? 'Suporte VantaTech' : (perfil?.nome_completo || 'Você')}
                  </span>
                  {msg.is_admin && (
                    <span className="text-[10px] bg-vanta-blue/10 text-vanta-blue px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                      Oficial
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(msg.criado_em))}
                  </span>
                </div>
                
                <div className={`p-4 rounded-2xl text-sm whitespace-pre-wrap shadow-sm ${
                  msg.sender_id === user.id 
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
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm bg-vanta-blue">
                  V
                </div>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-2xl rounded-tl-sm text-gray-500 text-sm flex gap-1 items-center">
                 <span className="text-xs font-bold mr-1">Suporte digitando</span>
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
          {isClosed ? (
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 font-medium">Este ticket foi fechado e não pode receber novas respostas.</p>
              <button 
                onClick={() => {
                  setSelectedTicket(null);
                  setIsOpeningNew(true);
                }}
                className="mt-2 text-vanta-blue text-sm font-bold hover:underline"
              >
                Abrir novo ticket
              </button>
            </div>
          ) : !messages.some(m => m.is_admin) ? (
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-700/30">
              <p className="text-sm text-yellow-700 dark:text-yellow-500 font-medium flex items-center justify-center gap-2">
                <Clock className="w-4 h-4" />
                Aguarde um administrador analisar seu chamado e enviar a primeira resposta.
              </p>
            </div>
          ) : (
            <div className="relative flex items-end gap-2">
              <textarea
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                placeholder="Escreva sua resposta..."
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
          )}
        </div>
      </div>
    );
  }

  // Formulário de Abertura (Caso clique em "Abrir novo ticket")
  if (isOpeningNew) {
    return (
      <div className="space-y-6">
        <button 
          onClick={() => setIsOpeningNew(false)}
          className="flex items-center gap-2 text-gray-500 hover:text-vanta-blue font-bold text-sm bg-white dark:bg-gray-800 px-4 py-2 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar aos Meus Tickets
        </button>
        <AjudaTicketForm onSuccess={() => {
          setIsOpeningNew(false);
          fetchTickets();
        }} />
      </div>
    );
  }

  // Listagem de Tickets
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white">Meus Tickets</h2>
        <button 
          onClick={() => setIsOpeningNew(true)}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-vanta-blue text-white rounded-xl font-bold hover:bg-blue-600 transition-colors shadow-md"
        >
          <Ticket className="w-4 h-4" />
          Abrir Novo Ticket
        </button>
      </div>

      {tickets.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-10 md:p-16 text-center shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <Ticket className="w-10 h-10 text-gray-300 dark:text-gray-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Nenhum ticket aberto</h3>
          <p className="text-gray-500 max-w-sm mx-auto mb-8">
            Você não possui nenhum chamado de suporte no histórico. Nossa equipe está sempre pronta para ajudar!
          </p>
          <button 
            onClick={() => setIsOpeningNew(true)}
            className="px-8 py-3 bg-vanta-blue text-white rounded-xl font-bold hover:bg-blue-600 transition-all shadow-md hover:shadow-lg inline-block"
          >
            Preciso de Ajuda
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {tickets.map(ticket => (
            <button
              key={ticket.id}
              onClick={() => setSelectedTicket(ticket)}
              className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-vanta-blue/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 text-left group"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-vanta-blue transition-colors line-clamp-1 text-lg">
                    {ticket.assunto}
                  </h4>
                  <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold whitespace-nowrap ${getStatusColor(ticket.status)}`}>
                    {ticket.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500 font-medium">
                  <span>#{ticket.id.split('-')[0].toUpperCase()}</span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                  <span>{ticket.categoria}</span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDate(ticket.atualizado_em)}
                  </span>
                </div>
              </div>
              <div className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-900 text-gray-400 group-hover:bg-vanta-blue group-hover:text-white transition-colors">
                <ChevronRight className="w-5 h-5" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
