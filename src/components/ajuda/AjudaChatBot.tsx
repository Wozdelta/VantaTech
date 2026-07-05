import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Ticket, Copy, ThumbsUp, ThumbsDown, Package, Check, RefreshCw } from 'lucide-react';
import { processMessage, ChatResponse } from '../lib/chatbot/engine';
import { ChatContext, createContext } from '../lib/chatbot/context';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

type Message = {
  id: string;
  type: 'bot' | 'user';
  text: string;
  timestamp: Date;
  suggestions?: string[];
  action?: ChatResponse['action'];
  actionData?: any;
};

export default function AjudaChatBot({ onOpenTicket }: { onOpenTicket: () => void }) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      text: 'Olá! Sou o assistente virtual da VantaTech. Como posso ajudar você hoje?',
      timestamp: new Date(),
      suggestions: ['Comprar Produto', 'Rastrear Pedido', 'Abrir Ticket']
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingText, setTypingText] = useState('Analisando sua solicitação...');
  const [context, setContext] = useState<ChatContext>(createContext());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isTyping]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAction = (action?: string, actionData?: any) => {
    if (action === 'OPEN_TICKET') onOpenTicket();
    if (action === 'OPEN_TRACKING') {
      navigate('/perfil?tab=encomendas');
    }
    if (action === 'VIEW_ORDERS') {
      navigate('/perfil?tab=encomendas');
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    
    const userMsg: Message = { 
      id: Date.now().toString(), 
      type: 'user', 
      text,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Varia o texto de digitação baseado no tamanho da query
    if (text.toLowerCase().includes('pedido') || text.toLowerCase().includes('rastreio')) {
      setTypingText('Consultando sistema...');
    } else {
      setTypingText('Preparando resposta...');
    }

    // Calcular delay fake para parecer humano (mín 800ms, máx 2500ms)
    const delay = Math.min(Math.max(text.length * 30, 800), 2500);

    setTimeout(async () => {
      try {
        const response = await processMessage(text, context);
        
        setContext(response.newContext);
        
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'bot',
          text: response.text,
          timestamp: new Date(),
          suggestions: response.suggestions,
          action: response.action,
          actionData: response.actionData
        }]);
      } catch (error) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'bot',
          text: 'Desculpe, enfrentei um problema interno ao processar sua solicitação. Gostaria de abrir um ticket para nossa equipe?',
          timestamp: new Date(),
          action: 'OPEN_TICKET',
          suggestions: ['Abrir Ticket']
        }]);
      } finally {
        setIsTyping(false);
      }
    }, delay);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      {/* Chat Header */}
      <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-vanta-blue to-blue-600 text-white rounded-full flex items-center justify-center shadow-md">
              <Bot className="w-6 h-6" />
            </div>
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full animate-pulse"></div>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Assistente IA VantaTech
            </h3>
            <p className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
              Online e pronto para ajudar
            </p>
          </div>
        </div>
        <button onClick={() => { setMessages([messages[0]]); setContext(createContext()); }} className="p-2 text-gray-400 hover:text-vanta-blue hover:bg-blue-50 dark:hover:bg-gray-800 rounded-full transition-colors" title="Reiniciar Conversa">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Chat Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
              key={msg.id} 
              className={`flex gap-4 ${msg.type === 'user' ? 'justify-end' : 'justify-start'} group`}
            >
              {msg.type === 'bot' && (
                <div className="w-10 h-10 bg-gradient-to-br from-vanta-blue to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}
              
              <div className="flex flex-col gap-1 max-w-[80%]">
                <div className={`flex items-center gap-2 ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'} mb-1`}>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    {msg.type === 'bot' ? 'Assistente' : 'Você'}
                  </span>
                  <span className="text-[10px] font-medium text-gray-400">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className={`rounded-2xl p-4 shadow-sm ${
                  msg.type === 'user' 
                    ? 'bg-vanta-blue text-white rounded-tr-sm' 
                    : 'bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-sm border border-gray-100 dark:border-gray-600'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  
                  {msg.action && (
                    <div className="mt-4 border-t border-gray-200 dark:border-gray-600 pt-3">
                      <button 
                        onClick={() => handleAction(msg.action, msg.actionData)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-900 transition-all text-vanta-blue shadow-sm w-full justify-center group-hover:border-vanta-blue/50"
                      >
                        {msg.action === 'OPEN_TICKET' ? <Ticket className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                        {msg.action === 'OPEN_TICKET' ? 'Abrir Ticket Agora' : 'Acessar Painel'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Ações da mensagem do bot (Copiar/Avaliar) */}
                {msg.type === 'bot' && (
                  <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleCopy(msg.id, msg.text)} className="p-1.5 text-gray-400 hover:text-vanta-blue hover:bg-blue-50 dark:hover:bg-gray-800 rounded-md transition-colors flex items-center gap-1 text-xs font-medium">
                      {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedId === msg.id ? 'Copiado' : 'Copiar'}
                    </button>
                    <button className="p-1.5 text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-gray-800 rounded-md transition-colors">
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-gray-800 rounded-md transition-colors">
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Sugestões (Quick Replies) */}
                {msg.suggestions && msg.suggestions.length > 0 && msg.id === messages[messages.length - 1].id && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-wrap gap-2 mt-3"
                  >
                    {msg.suggestions.map((sug, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(sug)}
                        className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-vanta-blue dark:text-blue-400 text-xs font-bold rounded-full hover:bg-vanta-blue hover:text-white transition-all border border-blue-100 dark:border-blue-800/30"
                      >
                        {sug}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>

              {msg.type === 'user' && (
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                  <User className="w-5 h-5 text-gray-500 dark:text-gray-300" />
                </div>
              )}
            </motion.div>
          ))}
          
          {isTyping && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex gap-4 justify-start"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-vanta-blue to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Assistente</span>
                <div className="bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-2xl rounded-tl-sm p-4 flex items-center gap-3 w-fit shadow-sm">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-vanta-blue/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-vanta-blue/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-vanta-blue/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 animate-pulse">
                    {typingText}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chat Input */}
      <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 z-10">
        <div className="relative flex items-center group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua dúvida aqui..."
            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-2xl py-4 pl-4 pr-16 focus:outline-none focus:ring-2 focus:ring-vanta-blue focus:border-transparent text-sm transition-all dark:text-white shadow-sm group-hover:border-gray-300 dark:group-hover:border-gray-500"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isTyping}
            className="absolute right-2 p-3 bg-vanta-blue text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-center text-[10px] font-medium text-gray-400 mt-3">
          IA baseada no motor de NLP Local da VantaTech. Respostas podem ser geradas automaticamente.
        </p>
      </div>
    </div>
  );
}
