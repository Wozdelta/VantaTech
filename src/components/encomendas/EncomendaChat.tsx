import { useState, useEffect, useRef } from 'react';
import { X, Send, MessageCircle, DollarSign, FileText, CheckCircle, Clock, ShieldCheck } from 'lucide-react';
import CheckoutButton from './CheckoutButton';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useAlert } from '../../contexts/AlertContext';

interface EncomendaChatProps {
  encomenda: any;
  onClose: () => void;
}

export default function EncomendaChat({ encomenda, onClose }: EncomendaChatProps) {
  const { user, perfil } = useAuth();
  const { showAlert } = useAlert();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [orcamentoValorDisplay, setOrcamentoValorDisplay] = useState('');
  const orcamentoNumeric = orcamentoValorDisplay ? Number(orcamentoValorDisplay.replace(/\D/g, '')) / 100 : 0;
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [encomendaDetails, setEncomendaDetails] = useState(encomenda);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Formatador de tempo para o timer (HH:MM:SS)
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('encomendas_mensagens')
        .select('*, perfis(nome_completo, cargo)')
        .eq('encomenda_id', encomenda.id)
        .order('criado_em', { ascending: true });
        
      if (!error && data) {
        setMessages(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`chat_${encomenda.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'encomendas_mensagens', filter: `encomenda_id=eq.${encomenda.id}` },
        () => {
          fetchMessages();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'encomendas_pedidos', filter: `id=eq.${encomenda.id}` },
        (payload) => {
          setEncomendaDetails(payload.new as any);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [encomenda.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    // Hack de segurança: se a mensagem de aprovação for recente (menos de 1 minuto),
    // forçamos o status local para 'Em Andamento' para o Card atualizar na hora.
    const approvalMsg = messages.find(m => m.mensagem.includes('Agora que o pagamento foi aprovado'));
    
    if (approvalMsg) {
      const msgTime = new Date(approvalMsg.criado_em).getTime();
      const isRecent = Date.now() - msgTime < 60000; // 1 minuto
      
      if (isRecent && encomendaDetails?.status !== 'Em Andamento' && encomendaDetails?.status !== 'Concluído') {
        setEncomendaDetails(prev => ({ ...prev, status: 'Em Andamento' }));
      }
      
      // O timer só roda se o status for Em Andamento (evita bugar se o admin voltar o status para testar de novo)
      if (encomendaDetails?.status === 'Em Andamento' || isRecent) {
        const expireTime = msgTime + 3 * 60 * 60 * 1000;
        
        const interval = setInterval(async () => {
          const now = Date.now();
          const diff = expireTime - now;
          
          if (diff <= 0) {
            clearInterval(interval);
            // O tempo acabou! Apagar conversas e fechar o chat
            await supabase.from('encomendas_mensagens').delete().eq('encomenda_id', encomenda.id);
            onClose();
          } else {
            setTimeLeft(diff);
          }
        }, 1000);
        
        return () => clearInterval(interval);
      } else {
        setTimeLeft(null);
      }
    } else {
      setTimeLeft(null);
    }
  }, [messages, encomendaDetails?.status, encomenda.id, onClose]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const msg = newMessage;
    setNewMessage('');

    try {
      await supabase
        .from('encomendas_mensagens')
        .insert([{
          encomenda_id: encomenda.id,
          user_id: user.id,
          mensagem: msg
        }]);
        
      // Atualiza a lista imediatamente para quem enviou
      fetchMessages();
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
    }
  };

  const handleSendOrcamento = async () => {
    if (orcamentoNumeric <= 0 || !user) return;
    
    const payload = {
      valor: orcamentoNumeric,
      marca: encomendaDetails.marca,
      modelo: encomendaDetails.modelo,
      cor: encomendaDetails.cor,
      armazenamento: encomendaDetails.armazenamento,
      estado: encomendaDetails.estado
    };
    const msg = `[ORCAMENTO_JSON]:::${JSON.stringify(payload)}`;
    
    try {
      await supabase
        .from('encomendas_mensagens')
        .insert([{
          encomenda_id: encomenda.id,
          user_id: user.id,
          mensagem: msg
        }]);
        
      await supabase
        .from('encomendas_mensagens')
        .insert([{
          encomenda_id: encomenda.id,
          user_id: user.id,
          mensagem: '⚠️ Lembrando: Esta é apenas uma proposta oficial. Só clique em "Aceitar Proposta" caso esteja 100% de acordo com os valores, o prazo e a política de cancelamento.'
        }]);
        
      setOrcamentoValorDisplay('');
      fetchMessages();
    } catch (err) {
      console.error('Erro ao enviar orçamento:', err);
    }
  };

  const handleManualApproval = async () => {
    if (!user) return;
    
    const confirmed = await showAlert({
      title: 'Aprovar Manualmente',
      message: 'Tem certeza que deseja marcar esta encomenda como PAGA manualmente? O cliente será notificado na hora.',
      type: 'warning',
      showConfirm: true
    });
    
    if (!confirmed) return;
    
    try {
      const { error } = await supabase
        .from('encomendas_pedidos')
        .update({ status: 'Em Andamento' })
        .eq('id', encomenda.id);
        
      if (error) throw error;
      
      await supabase.from('encomendas_mensagens').insert([{
        encomenda_id: encomenda.id,
        user_id: user.id,
        mensagem: "Agora que o pagamento foi aprovado, o código de rastreio será liberado em até 10 dias e você pode localizar seu pedido na mesma aba 'Encomendar Produto'.\n\nEsse chat será deletado em 3 horas. Você tem mais alguma dúvida?"
      }]);
      
      // O hack de segurança já vai detectar a mensagem recém-criada e atualizar o UI no próximo fetch
      fetchMessages();
    } catch (err) {
      console.error(err);
      alert('Erro ao aprovar manualmente');
    }
  };

  const handleSaveDetails = async () => {
    try {
      await supabase
        .from('encomendas_pedidos')
        .update({
          marca: encomendaDetails.marca,
          modelo: encomendaDetails.modelo,
          cor: encomendaDetails.cor,
          armazenamento: encomendaDetails.armazenamento,
          estado: encomendaDetails.estado,
        })
        .eq('id', encomenda.id);
      setIsEditingDetails(false);
    } catch (err) {
      console.error('Erro ao salvar detalhes:', err);
    }
  };

  const autoCorrectDetails = () => {
    const capitalize = (str: string) => {
      if (!str) return str;
      return str.split(' ').map(word => {
        if (word.toLowerCase() === 'iphone') return 'iPhone';
        if (word.toLowerCase() === 'ipad') return 'iPad';
        if (word.toLowerCase() === 'macbook') return 'MacBook';
        if (word.toLowerCase() === 'pro') return 'Pro';
        if (word.toLowerCase() === 'promax' || word.toLowerCase() === 'pro max') return 'Pro Max';
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }).join(' ');
    };

    const formatStorage = (str: string) => {
      if (!str) return str;
      const s = str.trim().toLowerCase();
      const numMatch = s.match(/\d+/);
      if (numMatch) {
        const num = Number(numMatch[0]);
        if (s.includes('t')) return `${num}TB`;
        if (s.includes('g')) return `${num}GB`;
        // Se só tem o número, deduz se é TB (1, 2) ou GB (16, 32, 64, etc)
        if (num <= 4) return `${num}TB`;
        return `${num}GB`;
      }
      return capitalize(str);
    };

    setEncomendaDetails({
      ...encomendaDetails,
      marca: capitalize(encomendaDetails.marca),
      modelo: capitalize(encomendaDetails.modelo),
      cor: capitalize(encomendaDetails.cor),
      armazenamento: formatStorage(encomendaDetails.armazenamento),
      estado: capitalize(encomendaDetails.estado)
    });
  };

  const isUserMsg = (msgUserId: string) => msgUserId === user?.id;

  const handleAcceptProposal = async (msgId: string, payload: any) => {
    setAcceptingId(msgId);
    try {
      const { data, error } = await supabase
        .from('encomendas_pedidos')
        .update({
          status: 'Pagamento pendente',
          valor_total: payload.valor,
          valor_sinal: payload.valor * 0.1
        })
        .eq('id', encomenda.id)
        .select();
        
      if (error) {
        alert('Erro no banco de dados: ' + error.message + '\nVocê rodou o comando SQL para adicionar as colunas valor_total?');
        console.error(error);
        setAcceptingId(null);
        return;
      }

      if (!data || data.length === 0) {
        alert('Erro: O banco não permitiu a atualização (RLS). Rode o comando SQL no Supabase para permitir a atualização do status!');
        setAcceptingId(null);
        return;
      }

      // Mensagem do próprio cliente confirmando
      await supabase.from('encomendas_mensagens').insert([{
        encomenda_id: encomenda.id,
        user_id: user?.id,
        mensagem: '✅ Proposta aceita!'
      }]);
      fetchMessages();
      
      // Atualiza o estado local para desabilitar o botão imediatamente
      setEncomendaDetails(prev => ({ ...prev, status: 'Pagamento pendente' }));

      // Simula o Admin respondendo em background com atraso natural (2 a 5s)
      (async () => {
        try {
          const { data: adminData } = await supabase.from('perfis').select('id').eq('cargo', 'Admin').limit(1).single();
          const adminId = adminData?.id;
          
          if (adminId) {
            const adminMsgs = [
              'Agora basta pagar a taxa de sinal de 10% do valor total do produto.',
              'Após isso, seu produto será solicitado e você poderá acompanhar o rastreio dele no seu próprio painel de encomendas. 📦'
            ];

            for (const text of adminMsgs) {
              const delayMs = Math.floor(Math.random() * (5000 - 2000 + 1)) + 2000;
              await new Promise(r => setTimeout(r, delayMs));
              
              await supabase.from('encomendas_mensagens').insert([{
                encomenda_id: encomenda.id,
                user_id: adminId,
                mensagem: text
              }]);
              // A tela do cliente vai atualizar sozinha graças ao Tempo Real (Realtime)
            }
          }
        } catch (err) {
          console.error('Erro no envio automático do admin:', err);
        }
      })();
      
    } catch (err: any) {
      alert('Erro inesperado: ' + err.message);
      console.error('Erro ao aceitar proposta:', err);
    } finally {
      setAcceptingId(null);
    }
  };

  const renderMessageContent = (msg: any) => {
    let isOrcamento = false;
    let payload: any = null;

    if (msg.mensagem.startsWith('[ORCAMENTO_JSON]:::')) {
      try {
        payload = JSON.parse(msg.mensagem.split(':::')[1]);
        isOrcamento = true;
      } catch (e) {}
    } else if (msg.mensagem.startsWith('[ORCAMENTO]:::')) {
      // Retrocompatibilidade para os primeiros testes que vc fez
      payload = {
        valor: Number(msg.mensagem.split(':::')[1]),
        marca: encomenda.marca,
        modelo: encomenda.modelo,
        cor: encomenda.cor,
        armazenamento: encomenda.armazenamento,
        estado: encomenda.estado
      };
      isOrcamento = true;
    }

    if (isOrcamento && payload) {
      const sinal = payload.valor * 0.1;
      
      return (
        <div className={`border rounded-xl p-4 w-72 shadow-md ${isUserMsg(msg.user_id) ? 'bg-white text-gray-900 border-gray-200' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-vanta-blue/30'}`}>
          <div className="flex items-center gap-2 text-vanta-blue mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
            <CheckCircle className="w-5 h-5" />
            <span className="font-bold text-sm">Proposta de Orçamento</span>
          </div>
          
          <div className="mb-4">
            <div className="font-bold text-gray-900 dark:text-white text-sm mb-1">{payload.marca} {payload.modelo}</div>
            <div className="flex flex-wrap gap-1.5">
              {payload.cor && <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] px-2 py-0.5 rounded font-medium">{payload.cor}</span>}
              {payload.armazenamento && <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] px-2 py-0.5 rounded font-medium">{payload.armazenamento}</span>}
              <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] px-2 py-0.5 rounded font-medium">{payload.estado}</span>
            </div>
          </div>

          <div className="space-y-1 mb-4">
            <div className="text-xs text-gray-500 dark:text-gray-400">Valor Total</div>
            <div className="font-black text-xl">{(payload.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
          </div>
          
          <div className="space-y-2">
            <div className="bg-orange-50 dark:bg-orange-900/20 p-2.5 rounded-lg border border-orange-100 dark:border-orange-800/30">
              <div className="text-[10px] uppercase font-bold text-orange-600 dark:text-orange-400 mb-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Prazo de Entrega
              </div>
              <div className="font-bold text-orange-800 dark:text-orange-300 text-sm">2 Meses <span className="font-medium text-xs opacity-80">(pode chegar antes)</span></div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-2.5 rounded-lg border border-blue-100 dark:border-blue-800/30">
              <div className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 mb-0.5">Sinal para Encomendar (10%)</div>
              <div className="font-black text-blue-800 dark:text-blue-300">{sinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
            </div>
            
            <div className="bg-red-50 dark:bg-red-900/20 p-2.5 rounded-lg border border-red-100 dark:border-red-800/30">
              <div className="text-[10px] uppercase font-bold text-red-600 dark:text-red-400 mb-0.5">Multa de Cancelamento (5%)</div>
              <div className="font-bold text-red-800 dark:text-red-300">{((payload.valor * 0.1) * 0.05).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
            </div>
          </div>

          {perfil?.cargo !== 'Admin' && encomendaDetails.status !== 'Cancelado' && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => handleAcceptProposal(msg.id, payload)}
                disabled={acceptingId === msg.id || encomendaDetails.status === 'Pagamento pendente' || encomendaDetails.status === 'Em Andamento' || encomendaDetails.status === 'Concluído'}
                className={`w-full py-2.5 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 ${
                  acceptingId === msg.id || encomendaDetails.status === 'Pagamento pendente' || encomendaDetails.status === 'Em Andamento' || encomendaDetails.status === 'Concluído'
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-green-500 hover:bg-green-600 text-white shadow-sm hover:shadow-md'
                }`}
              >
                {acceptingId === msg.id ? (
                  <span className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : encomendaDetails.status === 'Pagamento pendente' || encomendaDetails.status === 'Em Andamento' || encomendaDetails.status === 'Concluído' ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Proposta Aceita
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Aceitar Proposta
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      );
    }
    
    return <div className="whitespace-pre-wrap">{msg.mensagem}</div>;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      <div className={`relative bg-white dark:bg-gray-800 rounded-3xl w-full ${perfil?.cargo === 'Admin' ? 'max-w-4xl' : 'max-w-2xl'} h-[85vh] min-h-[600px] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-vanta-blue/10 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-vanta-blue" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-3">
                Chat da Encomenda
                {timeLeft !== null && (
                  <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2.5 py-1 rounded-md text-xs font-bold border border-red-200 dark:border-red-800 flex items-center gap-1.5 animate-pulse" title="Tempo restante antes do chat ser deletado permanentemente">
                    <Clock className="w-3.5 h-3.5" />
                    {formatTime(timeLeft)} para apagar as mensagens
                  </span>
                )}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {encomenda.marca} {encomenda.modelo}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full shadow-sm transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Column: Chat */}
          <div className="flex-1 flex flex-col border-r border-gray-100 dark:border-gray-700 relative">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30 dark:bg-gray-900/50 custom-scrollbar absolute inset-0 bottom-[81px]">
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin w-8 h-8 border-4 border-vanta-blue border-t-transparent rounded-full" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-10">
                  Nenhuma mensagem ainda.
                </div>
              ) : (
                messages.map((msg) => {
                  const isOrcamento = msg.mensagem.startsWith('[ORCAMENTO_JSON]:::') || msg.mensagem.startsWith('[ORCAMENTO]:::');
                  const isCheckout = msg.mensagem.startsWith('[CHECKOUT_LINK]:::');
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col max-w-[85%] ${isUserMsg(msg.user_id) ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                    >
                      <div className="text-xs text-gray-400 mb-1 px-1 flex items-center gap-2">
                        {msg.perfis?.nome_completo || 'Usuário'}
                        {msg.perfis?.cargo === 'Admin' && (
                          <span className="bg-vanta-blue/10 text-vanta-blue px-1.5 py-0.5 rounded text-[10px] font-bold">ADMIN</span>
                        )}
                      </div>
                      <div 
                        className={`rounded-2xl ${isOrcamento || isCheckout ? 'bg-transparent' : 'px-4 py-3 shadow-sm'} ${
                          !isOrcamento && !isCheckout && isUserMsg(msg.user_id) 
                            ? 'bg-vanta-blue text-white rounded-tr-sm' 
                            : (!isOrcamento && !isCheckout ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-600 rounded-tl-sm' : '')
                        }`}
                      >
                        {isCheckout ? (
                          <div className="bg-gradient-to-br from-gray-900 to-black dark:from-gray-800 dark:to-gray-900 rounded-3xl p-6 shadow-2xl border border-gray-800 my-4 min-w-[320px] max-w-sm relative overflow-hidden group">
                            {/* Efeito de brilho de fundo */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
                            
                            <div className="relative">
                              <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 bg-green-500/20 text-green-400 rounded-2xl flex items-center justify-center shrink-0 border border-green-500/30">
                                    <DollarSign className="w-6 h-6" />
                                  </div>
                                  <div>
                                    <div className="font-black text-white text-lg leading-tight">Sinal da Encomenda</div>
                                    <div className="flex items-center gap-1 text-xs text-gray-400 font-medium mt-1">
                                      <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
                                      Pagamento Seguro
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-white/5 rounded-2xl p-4 mb-6 backdrop-blur-sm border border-white/10">
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Valor do Sinal</span>
                                <span className="text-3xl font-black text-white tracking-tight">
                                  {Number(encomendaDetails?.valor_sinal || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                              </div>
                              
                              {encomendaDetails?.status === 'Em Andamento' || encomendaDetails?.status === 'Concluído' ? (
                                <div className="w-full py-3.5 bg-green-500/20 text-green-400 font-black rounded-xl flex items-center justify-center gap-2 cursor-not-allowed border border-green-500/30">
                                  <CheckCircle className="w-5 h-5" />
                                  PAGAMENTO APROVADO
                                </div>
                              ) : (
                                <a 
                                  href={msg.mensagem.split(':::')[1]}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full py-3.5 bg-green-500 hover:bg-green-400 text-black font-black rounded-xl transition-all shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:shadow-[0_0_30px_rgba(34,197,94,0.6)] flex items-center justify-center gap-2 hover:scale-[1.02]"
                                >
                                  Ir para o Pagamento
                                </a>
                              )}
                              
                              <div className="text-center mt-4">
                                <span className="text-[10px] text-gray-500 font-medium tracking-wide">
                                  Processado via InfinitePay
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : renderMessageContent(msg)}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1 px-1">
                        {new Date(msg.criado_em).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 absolute bottom-0 left-0 right-0 h-[81px]">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full px-5 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-vanta-blue transition-colors"
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="w-12 h-12 bg-vanta-blue hover:bg-vanta-darkblue text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-md"
                >
                  <Send className="w-5 h-5 -ml-1" />
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Admin Panel */}
          {perfil?.cargo === 'Admin' && encomendaDetails.status === 'Pagamento pendente' ? (
            <div className="w-80 bg-green-50/50 dark:bg-green-900/10 p-6 overflow-y-auto custom-scrollbar flex flex-col border-l border-gray-100 dark:border-gray-700">
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-500 rounded-full flex items-center justify-center mb-2">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-green-700 dark:text-green-400">Proposta Aceita!</h3>
                <p className="text-xs text-green-600 dark:text-green-500">
                  O cliente aceitou o orçamento e está aguardando o link de pagamento do sinal.
                </p>
                <div className="w-full bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-green-100 dark:border-green-800/30 my-4">
                  <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Valor do Sinal</div>
                  <div className="text-2xl font-black text-gray-900 dark:text-white">
                    {Number(encomendaDetails.valor_sinal || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                </div>
                <CheckoutButton 
                  encomendaId={encomenda.id}
                  valorOriginal={Number(encomendaDetails.valor_sinal || 0)}
                  nomeProduto={`${encomendaDetails.marca} ${encomendaDetails.modelo}`}
                  clienteNome={encomenda.perfis?.nome_completo || 'Cliente'}
                  clienteEmail={(encomenda.perfis as any)?.email || ''}
                  label="Gerar Link PIX"
                  onSuccess={async (url) => {
                    await supabase.from('encomendas_mensagens').insert([{
                      encomenda_id: encomenda.id,
                      user_id: user?.id, // Sent by Admin
                      mensagem: `[CHECKOUT_LINK]:::${url}`
                    }]);
                    fetchMessages();
                  }}
                  onError={(err) => alert('Erro: ' + err)}
                />
                
                <button
                  onClick={handleManualApproval}
                  className="w-full py-2.5 mt-2 bg-transparent border-2 border-green-500/20 hover:border-green-500 text-green-600 dark:text-green-500 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  Aprovar Manualmente
                </button>
              </div>
            </div>
          ) : perfil?.cargo === 'Admin' && encomendaDetails.status === 'Pendente' ? (
            <div className="w-80 bg-gray-50/80 dark:bg-gray-900/50 p-6 overflow-y-auto custom-scrollbar flex flex-col border-l border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-vanta-blue" />
                  Detalhes
                </h3>
                <div className="flex gap-2">
                  {isEditingDetails && (
                    <button 
                      onClick={autoCorrectDetails}
                      title="Auto-corrigir texto (Ex: iphone -> iPhone, 256 -> 256GB)"
                      className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white px-2 py-1 rounded-full font-bold transition-colors flex items-center gap-1"
                    >
                      🪄 Corrigir
                    </button>
                  )}
                  <button 
                    onClick={() => isEditingDetails ? handleSaveDetails() : setIsEditingDetails(true)}
                    className="text-xs bg-vanta-blue/10 text-vanta-blue hover:bg-vanta-blue hover:text-white px-3 py-1 rounded-full font-bold transition-colors"
                  >
                    {isEditingDetails ? 'Salvar' : 'Editar'}
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 space-y-3 mb-6">
                {!isEditingDetails ? (
                  <>
                    <div className="text-xs text-gray-500">Marca: <span className="font-bold text-gray-900 dark:text-white">{encomendaDetails.marca}</span></div>
                    <div className="text-xs text-gray-500">Aparelho: <span className="font-bold text-gray-900 dark:text-white">{encomendaDetails.modelo}</span></div>
                    <div className="text-xs text-gray-500">Cor: <span className="font-bold text-gray-900 dark:text-white">{encomendaDetails.cor || 'N/A'}</span></div>
                    <div className="text-xs text-gray-500">Armaz.: <span className="font-bold text-gray-900 dark:text-white">{encomendaDetails.armazenamento || 'N/A'}</span></div>
                    <div className="text-xs text-gray-500">Estado: <span className="font-bold text-gray-900 dark:text-white">{encomendaDetails.estado}</span></div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Marca</label>
                      <input type="text" value={encomendaDetails.marca} onChange={e => setEncomendaDetails({...encomendaDetails, marca: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs px-3 py-1.5 rounded-lg outline-none focus:border-vanta-blue text-gray-900 dark:text-white" />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Aparelho</label>
                      <input type="text" value={encomendaDetails.modelo} onChange={e => setEncomendaDetails({...encomendaDetails, modelo: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs px-3 py-1.5 rounded-lg outline-none focus:border-vanta-blue text-gray-900 dark:text-white" />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Cor</label>
                      <input type="text" value={encomendaDetails.cor} onChange={e => setEncomendaDetails({...encomendaDetails, cor: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs px-3 py-1.5 rounded-lg outline-none focus:border-vanta-blue text-gray-900 dark:text-white" />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Armazenamento</label>
                      <input type="text" value={encomendaDetails.armazenamento} onChange={e => setEncomendaDetails({...encomendaDetails, armazenamento: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs px-3 py-1.5 rounded-lg outline-none focus:border-vanta-blue text-gray-900 dark:text-white" />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Estado</label>
                      <input type="text" value={encomendaDetails.estado} onChange={e => setEncomendaDetails({...encomendaDetails, estado: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs px-3 py-1.5 rounded-lg outline-none focus:border-vanta-blue text-gray-900 dark:text-white" />
                    </div>
                  </div>
                )}
              </div>

              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-green-500" />
                Enviar Orçamento
              </h3>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                <label className="text-xs font-bold text-gray-500 block mb-2">Valor Total</label>
                <input
                  type="text"
                  value={orcamentoValorDisplay}
                  onChange={e => {
                    const raw = e.target.value.replace(/\D/g, '');
                    if (!raw) {
                      setOrcamentoValorDisplay('');
                      return;
                    }
                    const amount = Number(raw) / 100;
                    setOrcamentoValorDisplay(amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
                  }}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-vanta-blue mb-4 font-bold"
                  placeholder="R$ 0,00"
                />
                
                {orcamentoNumeric > 0 && (
                  <div className="mb-4 space-y-2">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800/30">
                      <div className="text-[10px] uppercase font-bold text-blue-800 dark:text-blue-300">Sinal Obrigatório (10%)</div>
                      <div className="font-black text-blue-900 dark:text-blue-100">{(orcamentoNumeric * 0.1).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                    </div>
                    <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-800/30">
                      <div className="text-[10px] uppercase font-bold text-red-800 dark:text-red-300">Multa de Cancelamento (5%)</div>
                      <div className="font-black text-red-900 dark:text-red-100">{((orcamentoNumeric * 0.1) * 0.05).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleSendOrcamento}
                  disabled={orcamentoNumeric <= 0}
                  className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  Enviar Proposta
                </button>
              </div>
            </div>
          ) : null}
        </div>

      </div>
    </div>
  );
}
