import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Ticket } from 'lucide-react';
import { FAQ_DATA } from './AjudaFAQ';

type Message = {
  id: string;
  type: 'bot' | 'user';
  text: string;
  isAction?: boolean;
};

export default function AjudaChatBot({ onOpenTicket }: { onOpenTicket: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      text: 'Olá! Sou o assistente virtual da VantaTech. Como posso ajudar você hoje?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [failCount, setFailCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const findAnswer = (query: string) => {
    const normalizedQuery = query.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove acentos
      .replace(/[^\w\s]/gi, ''); // remove pontuação

    // Intents hardcoded para conversas simples
    const intents = [
      {
        keywords: ['oi', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'opa'],
        response: 'Olá! Sou o assistente virtual da VantaTech. Tudo bem? Como posso te ajudar hoje?'
      },
      {
        keywords: ['obrigado', 'obrigada', 'valeu', 'agradeco', 'perfeito', 'tchau'],
        response: 'Por nada! Estou sempre aqui se precisar de mais alguma coisa. Tenha um excelente dia!'
      },
      {
        keywords: ['comprar', 'fazer pedido', 'como faco para comprar', 'adicionar ao carrinho'],
        response: 'Para comprar, basta navegar pelos nossos Produtos, escolher o aparelho desejado e clicar em "Adicionar ao Carrinho". Depois é só finalizar a compra no checkout!'
      },
      {
        keywords: ['cade', 'compra nao', 'nao ta aparecendo', 'onde esta', 'nao aparece', 'nao encontro', 'sumiu', 'acompanhar'],
        response: 'Você pode acompanhar seus pedidos e pagamentos na aba "Meus Pedidos" no seu perfil. Lá fica o status em tempo real. Se o seu pedido não estiver aparecendo, pode ser um atraso temporário do sistema de pagamentos. Gostaria de abrir um ticket para nossa equipe de suporte investigar?',
        isAction: true
      },
      {
        keywords: ['atrasado', 'demorando', 'nao chegou', 'prazo'],
        response: 'Caso seu pedido tenha passado do prazo de entrega ou de aprovação, recomendo abrir um ticket de suporte para nossa equipe investigar imediatamente o que houve.',
        isAction: true
      },
      {
        keywords: ['cancelar', 'cancelamento', 'desistir'],
        response: 'O cancelamento pode ser feito até 24h após a compra, desde que o produto não tenha sido enviado. Acesse a aba "Meus Pedidos" e clique em "Cancelar".'
      },
      {
        keywords: ['reembolso', 'devolucao', 'estorno', 'devolver'],
        response: 'O reembolso é processado na mesma forma de pagamento original em até 7 dias úteis após a aprovação do cancelamento ou devolução.'
      },
      {
        keywords: ['garantia', 'defeito', 'quebrado', 'estragou', 'parou de funcionar'],
        response: 'Todos os nossos aparelhos possuem garantia padrão de 90 dias contra defeitos de fabricação. Para acionar a garantia, por favor, abra um ticket detalhando o defeito que ocorreu.',
        isAction: true
      },
      {
        keywords: ['ajuda', 'suporte', 'atendente', 'humano', 'falar com pessoa', 'preciso de ajuda', 'problema'],
        response: 'Eu sou um assistente virtual treinado para tirar dúvidas rápidas, mas se o seu problema for complexo, posso te direcionar para a nossa equipe. Gostaria de abrir um ticket de suporte?',
        isAction: true
      }
    ];

    // Checar intents primeiro
    for (const intent of intents) {
      if (intent.keywords.some(k => normalizedQuery.includes(k))) {
        return { text: intent.response, isAction: intent.isAction };
      }
    }

    // Flatten FAQ
    const allFaqs = FAQ_DATA.flatMap(c => c.items);
    
    // Stop words comuns em português
    const stopWords = ['como', 'para', 'qual', 'quando', 'onde', 'porque', 'por que', 'quem', 'com', 'meu', 'minha', 'seu', 'sua', 'que', 'dos', 'das'];
    
    let bestMatch = null;
    let maxScore = 0;
    
    for (const faq of allFaqs) {
      const qWords = faq.pergunta.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s]/gi, '')
        .split(' ')
        .filter(w => w.length > 2 && !stopWords.includes(w));
        
      let score = 0;
      for (const w of qWords) {
        if (normalizedQuery.includes(w)) {
          score++;
        }
      }
      if (score > maxScore) {
        maxScore = score;
        bestMatch = faq.resposta;
      }
    }
    
    if (maxScore > 0 && bestMatch) {
      return { text: bestMatch, isAction: false };
    }
    
    return null;
  };

  const handleSend = () => {
    if (!input.trim()) return;
    
    const userMsg: Message = { id: Date.now().toString(), type: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simular delay de rede/pensamento
    setTimeout(() => {
      const answer = findAnswer(userMsg.text);
      
      if (answer) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'bot',
          text: answer.text,
          isAction: answer.isAction
        }]);
        setFailCount(0); // Reseta a contagem de falhas
      } else {
        const newFailCount = failCount + 1;
        setFailCount(newFailCount);

        if (newFailCount >= 3) {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            type: 'bot',
            text: 'Não consegui encontrar uma resposta precisa para esse problema na base de conhecimento após algumas tentativas.',
            isAction: true
          }]);
        } else {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            type: 'bot',
            text: 'Desculpe, não entendi muito bem. Poderia reformular a sua pergunta usando outras palavras?'
          }]);
        }
      }
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 bg-vanta-blue text-white rounded-full flex items-center justify-center shadow-md">
            <Bot className="w-6 h-6" />
          </div>
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
        </div>
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">Assistente VantaTech</h3>
          <p className="text-xs text-green-600 dark:text-green-400 font-medium">Online agora</p>
        </div>
      </div>

      {/* Chat Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 bg-white dark:bg-gray-800"
      >
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.type === 'bot' && (
              <div className="w-8 h-8 bg-vanta-blue/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-4 h-4 text-vanta-blue" />
              </div>
            )}
            
            <div className={`max-w-[75%] rounded-2xl p-4 ${
              msg.type === 'user' 
                ? 'bg-vanta-blue text-white rounded-tr-sm' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-sm'
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              
              {msg.isAction && (
                <div className="mt-4">
                  <p className="text-sm font-bold mb-2">Ainda precisa de ajuda?</p>
                  <button 
                    onClick={onOpenTicket}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-vanta-blue"
                  >
                    <Ticket className="w-4 h-4" />
                    Abrir Ticket
                  </button>
                </div>
              )}
            </div>

            {msg.type === 'user' && (
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <User className="w-4 h-4 text-gray-500 dark:text-gray-300" />
              </div>
            )}
          </div>
        ))}
        
        {isTyping && (
          <div className="flex gap-4 justify-start">
            <div className="w-8 h-8 bg-vanta-blue/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <Bot className="w-4 h-4 text-vanta-blue" />
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-tl-sm p-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua dúvida aqui..."
            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl py-4 pl-4 pr-16 focus:outline-none focus:ring-2 focus:ring-vanta-blue focus:border-transparent text-sm transition-all dark:text-white"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="absolute right-2 p-2 bg-vanta-blue text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
