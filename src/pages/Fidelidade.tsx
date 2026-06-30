import { useAuth } from '../contexts/AuthContext';
import { Award, Star, Gift, TrendingUp, Copy, CheckCircle2, Share2, Loader2, Lock, LayoutGrid, List } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type Nivel = {
  id: string;
  nome: string;
  pontos_minimos: number;
  cor_hex: string;
};

type Recompensa = {
  id: string;
  nome: string;
  pontos: number;
  badge: string | null;
  imagem_url: string;
  ativo: boolean;
  nivel_id: string | null;
};

export default function Fidelidade() {
  const { user, perfil } = useAuth();
  const [copied, setCopied] = useState(false);
  const [niveis, setNiveis] = useState<Nivel[]>([]);
  const [recompensas, setRecompensas] = useState<Recompensa[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'detailed' | 'minimal'>('detailed');

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: niveisData, error: niveisError } = await supabase
          .from('niveis_fidelidade')
          .select('*')
          .order('pontos_minimos', { ascending: true });
          
        if (niveisError) throw niveisError;
        setNiveis(niveisData || []);

        const { data: recData, error: recError } = await supabase
          .from('recompensas')
          .select('*')
          .eq('ativo', true)
          .order('pontos', { ascending: true });
        
        if (recError) throw recError;
        setRecompensas(recData || []);
      } catch (error) {
        console.error('Erro ao carregar dados de fidelidade:', error);
      } finally {
        setLoading(false);
      }
    }
    if (user) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-gray-500">Você precisa estar logado para ver esta página.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-vanta-blue animate-spin" />
      </div>
    );
  }

  const pontosAtuais = perfil?.pontos || 0;
  
  let nivelAtual = niveis.length > 0 ? niveis[0] : null;
  let proximoNivel = null;
  
  if (niveis.length > 0) {
    for (let i = 0; i < niveis.length; i++) {
      if (pontosAtuais >= niveis[i].pontos_minimos) {
        nivelAtual = niveis[i];
        proximoNivel = niveis[i + 1] || null;
      }
    }
  }

  const nivelNome = nivelAtual?.nome || 'Bronze';
  const isMaxLevel = !proximoNivel;
  const progressPercentage = isMaxLevel ? 100 : Math.min(100, (pontosAtuais / (proximoNivel?.pontos_minimos || 1)) * 100);
  
  const affiliateLink = `https://vantatech-one.vercel.app/?ref=${user.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(affiliateLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-4 bg-vanta-orange/10 rounded-full mb-4">
          <Award className="w-12 h-12 text-vanta-orange" />
        </div>
        <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
          Vanta<span className="text-vanta-orange">Club</span>
        </h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto text-lg">
          O programa de fidelidade feito para você. Compre e acumule pontos para trocar por descontos e brindes exclusivos!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Quadro Azul: Pontos */}
        <div className="bg-gradient-to-br from-gray-900 to-vanta-darkblue rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between h-full">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Star className="w-48 h-48" />
          </div>
          
          <div className="relative z-10 flex-1 flex flex-col">
            <h2 className="text-xl font-medium text-gray-300 mb-2">Seus Pontos Atuais</h2>
            <div className="flex items-end gap-3 mb-8">
              <span className="text-6xl font-black text-vanta-orange">{pontosAtuais}</span>
              <span className="text-xl font-bold mb-2">VantaCoins</span>
            </div>
            
            <div className="mb-4 mt-auto">
              <div className="flex justify-between text-sm font-medium mb-2">
                <span className="text-gray-300">Nível {nivelNome}</span>
                {isMaxLevel ? (
                  <span className="text-vanta-orange font-bold">Nível Máximo Atingido!</span>
                ) : (
                  <span className="text-gray-300">Faltam {proximoNivel.pontos_minimos - pontosAtuais} pts para {proximoNivel.nome}</span>
                )}
              </div>
              <div className="h-3 w-full bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-vanta-orange rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
            <div className="mt-4">
              <Link to="/" className="inline-block px-6 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg font-bold transition-colors">
                Como ganhar mais?
              </Link>
            </div>
          </div>
        </div>
        
        {/* Quadro Laranja: Indique e Ganhe */}
        <div className="bg-gradient-to-br from-vanta-orange to-orange-500 rounded-3xl p-8 shadow-2xl text-white relative overflow-hidden flex flex-col justify-between h-full">
           <div className="absolute top-0 right-0 p-4 opacity-20">
              <Share2 className="w-32 h-32" />
           </div>
           <div className="relative z-10 flex-1 flex flex-col">
             <h3 className="font-bold text-2xl mb-4">Indique e Ganhe!</h3>
             <p className="text-base text-white/90 mb-8 flex-1 leading-relaxed">
               Compartilhe seu link exclusivo. Quando um <strong className="text-white">novo amigo</strong> se cadastrar e realizar a primeira compra através do seu link, os pontos dessa compra vão todos para você! <br/>
               <span className="text-xs opacity-80 mt-2 block">*Válido apenas para novos usuários sem cadastro anterior.</span>
             </p>
             <div className="bg-black/20 p-4 rounded-xl flex items-center justify-between gap-3 border border-white/20 mt-auto">
               <span className="text-sm truncate opacity-90 font-medium">{affiliateLink}</span>
               <button 
                 onClick={handleCopy}
                 className="p-3 bg-white text-vanta-orange rounded-lg hover:bg-orange-50 transition-colors flex-shrink-0 shadow-sm"
                 title="Copiar Link"
               >
                 {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
               </button>
             </div>
           </div>
        </div>
      </div>

      {/* Grid Inferior: Como Funciona */}
      <div className="mb-12">
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-soft">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-bold text-xl text-gray-900 dark:text-white">Como Funciona</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">
            A cada R$ 1,00 gasto na loja, você ou quem comprar pelo seu link acumula 1 VantaCoin. 
          </p>
        </div>
      </div>

      {/* Vitrine de Recompensas */}
      <div className="mb-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-3">
            <div className="p-4 bg-gradient-to-br from-vanta-orange to-orange-500 rounded-full shadow-lg shadow-orange-500/30">
              <Gift className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Vitrine de Recompensas</h2>
          </div>

          <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl shadow-inner border border-gray-200 dark:border-gray-700">
            <button 
              onClick={() => setViewMode('detailed')}
              className={`p-2.5 px-4 rounded-lg flex items-center gap-2 text-sm font-bold transition-all ${viewMode === 'detailed' ? 'bg-white dark:bg-gray-700 text-vanta-blue shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              <LayoutGrid className="w-4 h-4" /> Detalhada
            </button>
            <button 
              onClick={() => setViewMode('minimal')}
              className={`p-2.5 px-4 rounded-lg flex items-center gap-2 text-sm font-bold transition-all ${viewMode === 'minimal' ? 'bg-white dark:bg-gray-700 text-vanta-blue shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              <List className="w-4 h-4" /> Minimalista
            </button>
          </div>
        </div>

        <div className="space-y-16">
          {niveis.map(nivel => {
            const recsNivel = recompensas.filter(r => r.nivel_id === nivel.id || (!r.nivel_id && nivel.pontos_minimos === 0));
            if (recsNivel.length === 0) return null;
            
            const isLocked = nivel.pontos_minimos > (nivelAtual?.pontos_minimos || 0);

            return (
              <div key={nivel.id} className="relative">
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800"></div>
                  <h4 className={`text-2xl font-black flex items-center gap-3 ${isLocked ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                    <span style={{ color: isLocked ? undefined : nivel.cor_hex }}>Nível {nivel.nome}</span>
                    {isLocked && <Lock className="w-5 h-5 opacity-70" />}
                    {isLocked && <span className="text-xs font-bold uppercase tracking-wider text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700">Bloqueado</span>}
                  </h4>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800"></div>
                </div>
                
                {viewMode === 'detailed' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {recsNivel.map(rec => (
                      <div key={rec.id} className={`group bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl overflow-hidden shadow-soft transition-all ${isLocked ? 'opacity-60 grayscale' : 'hover:-translate-y-2 hover:shadow-2xl hover:border-vanta-orange/30'}`}>
                        <div className="aspect-square relative bg-gray-50 dark:bg-gray-900 overflow-hidden">
                          {rec.badge && (
                            <span className={`absolute top-4 left-4 z-10 px-3 py-1 text-[11px] uppercase tracking-wider font-bold rounded-lg shadow-sm backdrop-blur-md border border-white/20 ${isLocked ? 'bg-gray-300/80 text-gray-700' : 'bg-vanta-orange/90 text-white'}`}>
                              {rec.badge}
                            </span>
                          )}
                          <img src={rec.imagem_url} alt={rec.nome} className={`w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal transition-transform duration-500 ${!isLocked && 'group-hover:scale-110'}`} />
                          {isLocked && (
                            <div className="absolute inset-0 bg-white/30 dark:bg-black/40 backdrop-blur-[3px] flex items-center justify-center">
                              <div className="bg-white/90 dark:bg-gray-800/90 p-4 rounded-full shadow-xl border border-gray-200 dark:border-gray-700 backdrop-blur-md">
                                <Lock className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="p-6 relative bg-white dark:bg-gray-800">
                          <h3 className={`font-bold text-lg mb-4 line-clamp-2 leading-tight ${isLocked ? 'text-gray-500' : 'text-gray-900 dark:text-white group-hover:text-vanta-orange transition-colors'}`}>
                            {rec.nome}
                          </h3>
                          <div className="flex items-center gap-2 mt-auto">
                            <Star className={`w-6 h-6 ${isLocked ? 'text-gray-400' : 'text-vanta-orange fill-vanta-orange drop-shadow-sm'}`} />
                            <span className={`font-black text-2xl ${isLocked ? 'text-gray-400' : 'text-vanta-orange'}`}>
                              {rec.pontos.toLocaleString('pt-BR')} <span className="text-sm font-bold opacity-70">pts</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recsNivel.map(rec => (
                      <div key={rec.id} className={`flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-2xl border ${isLocked ? 'border-gray-200 dark:border-gray-700 opacity-60 grayscale' : 'border-gray-100 dark:border-gray-700 hover:border-vanta-orange/40 hover:shadow-lg transition-all group cursor-default'}`}>
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-900 flex-shrink-0 border border-gray-100 dark:border-gray-800">
                          <img src={rec.imagem_url} alt={rec.nome} className={`w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal transition-transform duration-500 ${!isLocked && 'group-hover:scale-110'}`} />
                          {isLocked && (
                             <div className="absolute inset-0 bg-white/40 dark:bg-black/50 backdrop-blur-[2px] flex items-center justify-center">
                               <Lock className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                             </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className={`font-bold text-lg truncate ${isLocked ? 'text-gray-500' : 'text-gray-900 dark:text-white group-hover:text-vanta-orange transition-colors'}`}>
                              {rec.nome}
                            </h3>
                            {rec.badge && (
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase whitespace-nowrap border ${isLocked ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-vanta-orange/10 text-vanta-orange border-vanta-orange/20'}`}>
                                {rec.badge}
                              </span>
                            )}
                          </div>
                          {isLocked && <p className="text-xs font-medium text-gray-400 mt-0.5">Desbloqueia no Nível {nivel.nome}</p>}
                        </div>
                        <div className={`flex flex-col items-end flex-shrink-0 pl-4 border-l ${isLocked ? 'border-gray-200 dark:border-gray-700' : 'border-gray-100 dark:border-gray-700'}`}>
                          <div className="flex items-center gap-1.5">
                            <Star className={`w-5 h-5 ${isLocked ? 'text-gray-400' : 'text-vanta-orange fill-vanta-orange'}`} />
                            <span className={`font-black text-xl ${isLocked ? 'text-gray-400' : 'text-vanta-orange'}`}>{rec.pontos.toLocaleString('pt-BR')}</span>
                          </div>
                          <span className={`text-[11px] font-bold uppercase tracking-wider ${isLocked ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>VantaCoins</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          
          {recompensas.length === 0 && (
            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl shadow-soft">
              <Gift className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 text-xl font-medium">Nenhuma recompensa disponível no momento.</p>
              <p className="text-gray-400 mt-2">Em breve teremos novidades exclusivas!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
