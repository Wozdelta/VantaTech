import { useState } from 'react';
import { Search, ChevronRight, FileText, Ticket } from 'lucide-react';
import { FAQ_DATA } from './AjudaFAQ';

export default function AjudaSearch({ onOpenTicket }: { onOpenTicket: () => void }) {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);

  // Busca plana em todos os itens de FAQ
  const allFaqs = FAQ_DATA.flatMap(categoria => 
    categoria.items.map(item => ({
      ...item,
      categoria: categoria.categoria
    }))
  );

  const results = allFaqs.filter(
    faq => faq.pergunta.toLowerCase().includes(query.toLowerCase()) || faq.resposta.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative z-20">
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100 dark:border-gray-700 text-center relative overflow-hidden">
        {/* BG Decoration */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-vanta-blue/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-vanta-orange/5 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white">
            Como podemos ajudar você?
          </h2>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-6 w-6 text-gray-400" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowResults(e.target.value.length > 0);
              }}
              onFocus={() => setShowResults(query.length > 0)}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
              className="block w-full pl-12 pr-4 py-4 md:text-lg bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-vanta-blue focus:bg-white dark:focus:bg-gray-800 rounded-2xl shadow-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-0 transition-all"
              placeholder="Digite seu problema (ex: meu pedido está atrasado)..."
            />
          </div>

          {/* Resultados */}
          {showResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden text-left max-h-[400px] overflow-y-auto z-50">
              {results.length > 0 ? (
                <div className="p-2">
                  <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Resultados sugeridos
                  </div>
                  {results.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        // Poderia abrir um modal com a resposta ou scrolar até o FAQ
                        alert(`Resposta:\n${item.resposta}`);
                      }}
                      className="w-full flex flex-col items-start gap-1 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors text-left group"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <FileText className="w-4 h-4 text-vanta-blue opacity-70 group-hover:opacity-100 transition-opacity" />
                        <span className="font-bold text-gray-900 dark:text-white text-sm">{item.pergunta}</span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 ml-6">{item.resposta}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center space-y-4">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto">
                    <Search className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Não encontramos uma solução.</h3>
                    <p className="text-sm text-gray-500 mt-1">Ainda precisa de ajuda?</p>
                  </div>
                  <button 
                    onClick={onOpenTicket}
                    className="inline-flex items-center gap-2 px-6 py-2 bg-vanta-blue text-white rounded-xl font-bold hover:bg-blue-600 transition-colors"
                  >
                    <Ticket className="w-4 h-4" />
                    Abrir Ticket
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
