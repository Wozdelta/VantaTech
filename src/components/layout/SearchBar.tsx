import { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

type Suggestion = {
  id: string;
  nome: string;
  marca: string;
  imagem_url: string;
  preco: number;
};

export default function SearchBar({ className, onSearch }: { className?: string; onSearch?: () => void }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!query.trim()) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('produtos')
          .select('id, nome, marca, imagem_url, preco')
          .eq('ativo', true)
          .or(`nome.ilike.%${query}%,marca.ilike.%${query}%`)
          .limit(5);

        if (error) throw error;
        setSuggestions(data || []);
        setIsOpen(true);
      } catch (error) {
        console.error('Erro ao buscar sugestões:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(() => {
      fetchSuggestions();
    }, 300);

    return () => clearTimeout(debounce);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      if (onSearch) onSearch();
      navigate(`/produtos?q=${encodeURIComponent(query.trim())}`); // Pass via URL ou Navbar lida com isso? 
      // Vamos passar pela rota /produtos e ler o query param lá ou apenas setSearchTerm(query) na Products page se for possível.
      // Melhor usar um state global, ou passar ?search= na URL. Na página Produtos.tsx nós adicionamos isso.
    }
  };

  const handleSelect = (id: string) => {
    setIsOpen(false);
    setQuery('');
    if (onSearch) onSearch();
    navigate(`/produto/${id}`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  };

  return (
    <div ref={wrapperRef} className={`relative group ${className || ''}`}>
      <form onSubmit={handleSearch} className="relative w-full">
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (query.trim()) setIsOpen(true); }}
          placeholder="Buscar produtos..." 
          className="w-full h-10 md:h-12 pl-4 pr-12 md:pl-6 md:pr-16 rounded-full border border-gray-200/80 dark:border-gray-700/50 bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-md dark:text-white outline-none transition-all duration-500 focus:bg-white dark:focus:bg-gray-900 focus:border-vanta-blue/50 focus:ring-4 focus:ring-vanta-blue/10 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] focus:shadow-[0_4px_25px_rgba(29,142,255,0.15)] text-sm md:text-base font-medium placeholder:text-gray-400"
        />
        <button type="submit" className="absolute right-1 md:right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full bg-vanta-blue text-white hover:bg-vanta-darkblue hover:scale-105 hover:shadow-[0_0_15px_rgba(29,142,255,0.4)] transition-all duration-300">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 md:w-4 md:h-4 stroke-[2.5]" />}
        </button>
      </form>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 animate-fade-in">
          {suggestions.length > 0 ? (
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Sugestões</div>
              {suggestions.map((item) => (
                <button 
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex-shrink-0 flex items-center justify-center overflow-hidden p-1">
                    {item.imagem_url ? (
                      <img src={item.imagem_url} alt={item.nome} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" />
                    ) : (
                      <Search className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-bold text-gray-900 dark:text-white break-words leading-tight">{item.nome}</p>
                    <p className="text-xs text-gray-500">{item.marca}</p>
                  </div>
                  <div className="text-sm font-bold text-vanta-darkblue dark:text-blue-400 whitespace-nowrap pl-2">
                    {formatPrice(item.preco)}
                  </div>
                </button>
              ))}
              <div className="border-t border-gray-100 dark:border-gray-700 mt-2">
                <button 
                  onClick={handleSearch}
                  className="w-full py-3 text-sm font-bold text-vanta-blue hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  Ver todos os resultados
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400 text-sm">
              Nenhum produto encontrado para "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
