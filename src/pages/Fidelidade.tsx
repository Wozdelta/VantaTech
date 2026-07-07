import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { Copy, Gift, Star, Target, CheckCircle2, Share2, Award, Crown, Diamond, LayoutGrid, List, Lock, Check, Medal, Trophy, Loader2, Ticket, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAlert } from '../contexts/AlertContext';
import { useCart } from '../contexts/CartContext';

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
  cupom_valor?: number | null;
  cupom_tipo?: string | null;
};

type Historico = {
  id: string;
  tipo: 'entrada' | 'saida';
  quantidade: number;
  descricao: string;
  created_at: string;
};

export default function Fidelidade() {
  const { user, perfil, refreshPerfil } = useAuth();
  const { showAlert } = useAlert();
  const { addToCart, items } = useCart();
  const [copied, setCopied] = useState(false);
  const [niveis, setNiveis] = useState<Nivel[]>([]);
  const [recompensas, setRecompensas] = useState<Recompensa[]>([]);
  const [historico, setHistorico] = useState<Historico[]>([]);
  const [loading, setLoading] = useState(true);
  const [resgatandoId, setResgatandoId] = useState<string | null>(null);
  const [modalType, setModalType] = useState<'points' | 'history' | 'levels' | null>(null);
  const { settings } = useSettings();

  const showFidelidade = settings?.acesso_fidelidade === 'todos' || perfil?.cargo === 'Admin';
  const [viewMode, setViewMode] = useState<'detailed' | 'minimal'>('detailed');

  useEffect(() => {
    async function fetchData() {
      try {
        const [
          { data: niveisData, error: niveisError },
          { data: recData, error: recError },
          { data: histData, error: histError }
        ] = await Promise.all([
          supabase.from('niveis_fidelidade').select('*').order('pontos_minimos', { ascending: true }),
          supabase.from('recompensas').select('*').eq('ativo', true).order('pontos', { ascending: true }),
          supabase.from('historico_pontos').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(20)
        ]);
          
        if (niveisError) throw niveisError;
        setNiveis(niveisData || []);

        if (recError) throw recError;
        setRecompensas(recData || []);

        if (histError) console.error('Erro ao buscar histórico:', histError);
        setHistorico(histData || []);
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
  const pontosAcumulados = perfil?.pontos_acumulados || 0;
  
  let nivelAtual = niveis.length > 0 ? niveis[0] : null;
  let proximoNivel = null;
  
  if (niveis.length > 0) {
    for (let i = 0; i < niveis.length; i++) {
      if (pontosAcumulados >= niveis[i].pontos_minimos) {
        nivelAtual = niveis[i];
        proximoNivel = niveis[i + 1] || null;
      }
    }
  }

  const nivelNome = nivelAtual?.nome || 'Bronze';
  const isMaxLevel = !proximoNivel;
  const progressPercentage = isMaxLevel ? 100 : Math.min(100, (pontosAcumulados / (proximoNivel?.pontos_minimos || 1)) * 100);
  
  const affiliateLink = `https://vantatech-one.vercel.app/?ref=${user.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(affiliateLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pontosPendentes = items.reduce((acc, item) => acc + ((item.pointsCost || 0) * item.quantity), 0);
  const pontosDisponiveis = pontosAtuais - pontosPendentes;

  const handleResgatar = async (recompensa: Recompensa) => {
    if (pontosDisponiveis < recompensa.pontos) {
      showAlert({ title: 'Pontos Insuficientes', message: 'Você não tem saldo suficiente de VantaCoins (verifique os itens já no carrinho).', type: 'warning' });
      return;
    }
    
    setResgatandoId(recompensa.id);
    try {
      if (recompensa.cupom_valor && recompensa.cupom_tipo) {
        // Resgate de Cupom (Direto, sem cupom base)
        const novoCodigo = `R${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        
        const novoCupom = {
          codigo: novoCodigo,
          tipo_desconto: recompensa.cupom_tipo,
          valor_desconto: recompensa.cupom_valor,
          quantidade_disponivel: 1, 
          ativo: true,
          user_id: user?.id,
          categoria_nome: null,
          valor_minimo: null,
          valor_maximo: null,
          nivel_id: null
        };
        
        const { error: insertError } = await supabase.from('cupons').insert(novoCupom);
        if (insertError) throw insertError;
        
        const novosPontos = pontosAtuais - recompensa.pontos;
        await supabase.from('perfis').update({ pontos: novosPontos }).eq('id', user?.id);
        
        await supabase.from('historico_pontos').insert({
          user_id: user?.id,
          tipo: 'saida',
          quantidade: recompensa.pontos,
          descricao: `Resgate: ${recompensa.nome}`
        });

        // Atualizar lista
        const { data: hData } = await supabase.from('historico_pontos').select('*').eq('user_id', user?.id).order('created_at', { ascending: false }).limit(20);
        if (hData) setHistorico(hData);
        
        await refreshPerfil();
        showAlert({ title: 'Resgate Concluído!', message: `Você ganhou o cupom! Seu código é ${novoCodigo} e já está salvo na sua aba Meus Cupons.`, type: 'success' });
      } else {
        // Produto físico -> Apenas adicionar ao carrinho
        addToCart({
          productId: recompensa.id,
          name: `[Vanta Club] ${recompensa.nome}`,
          price: 0,
          image: recompensa.imagem_url,
          quantity: 1,
          pointsCost: recompensa.pontos,
        });
        
        showAlert({ title: 'Resgatado!', message: 'A recompensa foi adicionada ao seu carrinho!', type: 'success' });
      }
    } catch (err) {
      console.error(err);
      showAlert({ title: 'Erro', message: 'Houve um erro ao resgatar a recompensa.', type: 'error' });
    } finally {
      setResgatandoId(null);
    }
  };

  if (!showFidelidade) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 text-vanta-orange rounded-full flex items-center justify-center mb-6">
          <Award className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-4 text-center">
          Clube Vanta em Breve!
        </h1>
        <p className="text-gray-500 text-center max-w-md">
          O melhor clube de vantagens está chegando. Prepare-se para acumular pontos e resgatar prêmios incríveis!
        </p>
      </div>
    );
  }

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
        <div className="bg-gradient-to-br from-gray-900 to-vanta-darkblue rounded-3xl p-8 text-white shadow-2xl relative flex flex-col justify-between h-full">
          <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Star className="w-48 h-48" />
            </div>
          </div>
          
          <div className="relative z-10 flex-1 flex flex-col">
            <h2 className="text-xl font-medium text-gray-300 mb-2">Seus Pontos Atuais</h2>
            <div className="flex flex-wrap md:flex-nowrap items-end gap-x-2 gap-y-1 md:gap-3 mb-8">
              <span className="text-5xl md:text-6xl font-black text-vanta-orange break-all md:break-normal">{pontosAtuais}</span>
              <span className="text-lg md:text-xl font-bold mb-1 md:mb-2">VantaCoins</span>
            </div>
            
            <div className="mb-4 mt-auto">
              <div className="flex justify-between text-sm font-medium mb-2">
                <span className="text-gray-300">Nível {nivelNome}</span>
                {isMaxLevel ? (
                  <span className="text-vanta-orange font-bold">Nível Máximo Atingido!</span>
                ) : (
                  <span className="text-gray-300">Faltam {proximoNivel.pontos_minimos - pontosAcumulados} pts para {proximoNivel.nome}</span>
                )}
              </div>
              <div className="relative" onMouseLeave={() => setModalType(null)}>
                <div 
                  className="h-3 w-full bg-white/20 rounded-full overflow-hidden cursor-pointer hover:bg-white/30 transition-colors"
                  onClick={() => setModalType(modalType === 'levels' ? null : 'levels')}
                  onMouseEnter={() => setModalType('levels')}
                  title="Ver metas de pontos dos níveis"
                >
                  <div 
                    className="h-full bg-vanta-orange rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                
                {/* Janela Flutuante de Níveis (Popover) */}
                {modalType === 'levels' && (
                  <div className="absolute top-full left-0 right-0 md:left-auto md:right-0 mt-3 w-full md:w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-4 z-50 animate-in fade-in slide-in-from-top-2">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Crown className="w-4 h-4 text-vanta-orange" />
                      Metas por Nível
                    </h4>
                    <div className="space-y-2">
                      {niveis.map((n, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <span className="font-medium text-gray-600 dark:text-gray-300">{n.nome}</span>
                          <span className="font-bold text-vanta-orange">{n.pontos_minimos.toLocaleString('pt-BR')} pts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4">
              <Link to="/ajuda#vantaclub" className="inline-block px-6 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg font-bold transition-colors">
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
               <span className="text-sm break-words opacity-90 font-medium">{affiliateLink}</span>
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

      {/* Grid Inferior: Como Funciona e Histórico */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Como Funciona */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-soft h-full">
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

        {/* Histórico de Pontos */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-soft h-full flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <List className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-bold text-xl text-gray-900 dark:text-white">Seu Extrato</h3>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 max-h-[250px] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-track]:bg-transparent">
            {historico.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Nenhuma movimentação ainda.</p>
            ) : (
              historico.map(item => (
                <div key={item.id} className="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors border border-gray-100 dark:border-gray-700/50">
                  <div className="flex flex-col min-w-0 pr-4">
                    <span className="font-medium text-gray-900 dark:text-white text-sm break-words">{item.descricao}</span>
                    <span className="text-xs text-gray-500">{new Date(item.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className={`font-black whitespace-nowrap ${item.tipo === 'entrada' ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                    {item.tipo === 'entrada' ? '+' : '-'}{item.quantidade} <span className="text-xs font-bold opacity-70">pts</span>
                  </div>
                </div>
              ))
            )}
          </div>
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
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                    {recsNivel.map(rec => (
                      <div key={rec.id} className={`group bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl md:rounded-3xl overflow-hidden shadow-soft transition-all flex flex-col h-full ${isLocked ? 'opacity-60 grayscale' : 'hover:-translate-y-2 hover:shadow-2xl hover:border-vanta-orange/30'}`}>
                        <div className="aspect-square relative bg-gray-50 dark:bg-gray-900 overflow-hidden">
                          {rec.badge && (
                            <span className={`absolute top-2 left-2 md:top-4 md:left-4 z-10 px-2 md:px-3 py-1 text-[9px] md:text-[11px] uppercase tracking-wider font-bold rounded-lg shadow-sm backdrop-blur-md border border-white/20 ${isLocked ? 'bg-gray-300/80 text-gray-700' : (rec.cupom_valor ? 'bg-white text-vanta-orange shadow-xl border-none' : 'bg-vanta-orange/90 text-white')}`}>
                              {rec.badge}
                            </span>
                          )}
                          {rec.cupom_valor ? (
                            <div className="w-full h-full bg-gradient-to-br from-vanta-orange to-orange-600 flex flex-col items-center justify-center text-white p-2 md:p-4">
                              <Ticket className={`w-8 h-8 md:w-12 md:h-12 mb-1 md:mb-2 opacity-80 transition-transform duration-500 ${!isLocked && 'group-hover:scale-110'}`} />
                              <span className="font-black text-xl md:text-2xl text-center leading-tight">
                                {rec.cupom_tipo === 'porcentagem' ? `${rec.cupom_valor}%` : `R$ ${rec.cupom_valor}`}
                              </span>
                              <span className="text-[10px] md:text-xs uppercase tracking-widest opacity-80 font-bold mt-1 text-center">Desconto</span>
                            </div>
                          ) : (
                            <img src={rec.imagem_url} alt={rec.nome} className={`w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal transition-transform duration-500 ${!isLocked && 'group-hover:scale-110'}`} />
                          )}
                          {isLocked && (
                            <div className="absolute inset-0 bg-white/30 dark:bg-black/40 backdrop-blur-[3px] flex items-center justify-center">
                              <div className="bg-white/90 dark:bg-gray-800/90 p-3 md:p-4 rounded-full shadow-xl border border-gray-200 dark:border-gray-700 backdrop-blur-md">
                                <Lock className="w-6 h-6 md:w-8 md:h-8 text-gray-400 dark:text-gray-500" />
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="p-4 md:p-6 relative bg-white dark:bg-gray-800 flex flex-col flex-1">
                          <h3 className={`font-bold text-sm md:text-lg mb-3 md:mb-4 break-words leading-tight ${isLocked ? 'text-gray-500' : 'text-gray-900 dark:text-white group-hover:text-vanta-orange transition-colors'}`}>
                            {rec.nome}
                          </h3>
                          <div className="flex items-center gap-1 md:gap-2 mt-auto">
                            <Star className={`w-4 h-4 md:w-6 md:h-6 ${isLocked ? 'text-gray-400' : 'text-vanta-orange fill-vanta-orange drop-shadow-sm'}`} />
                            <span className={`font-black text-lg md:text-2xl ${isLocked ? 'text-gray-400' : 'text-vanta-orange'}`}>
                              {rec.pontos.toLocaleString('pt-BR')} <span className="text-xs md:text-sm font-bold opacity-70">pts</span>
                            </span>
                          </div>
                          
                          <button
                            onClick={() => !isLocked && handleResgatar(rec)}
                            disabled={isLocked || resgatandoId === rec.id}
                            className={`w-full mt-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300
                              ${isLocked ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700/50 dark:text-gray-500' :
                              resgatandoId === rec.id ? 'bg-vanta-orange/50 text-white cursor-wait' :
                              pontosAtuais >= rec.pontos ? 'bg-vanta-orange text-white shadow-md shadow-vanta-orange/20 hover:bg-orange-600 hover:shadow-lg hover:-translate-y-0.5' :
                              'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800'}`}
                          >
                            {resgatandoId === rec.id ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : isLocked ? (
                              'Bloqueado'
                            ) : pontosAtuais >= rec.pontos ? (
                              'Resgatar Agora'
                            ) : (
                              'Pontos Insuficientes'
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recsNivel.map(rec => (
                      <div key={rec.id} className={`flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-2xl border ${isLocked ? 'border-gray-200 dark:border-gray-700 opacity-60 grayscale' : 'border-gray-100 dark:border-gray-700 hover:border-vanta-orange/40 hover:shadow-lg transition-all group cursor-default'}`}>
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-900 flex-shrink-0 border border-gray-100 dark:border-gray-800">
                          {rec.cupom_valor ? (
                            <div className="w-full h-full bg-gradient-to-br from-vanta-orange to-orange-600 flex flex-col items-center justify-center text-white p-2">
                              <Ticket className="w-6 h-6 mb-1 opacity-80" />
                              <span className="font-black text-sm text-center leading-none">
                                {rec.cupom_tipo === 'porcentagem' ? `${rec.cupom_valor}%` : `R$ ${rec.cupom_valor}`}
                              </span>
                            </div>
                          ) : (
                            <img src={rec.imagem_url} alt={rec.nome} className={`w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal transition-transform duration-500 ${!isLocked && 'group-hover:scale-110'}`} />
                          )}
                          {isLocked && (
                             <div className="absolute inset-0 bg-white/40 dark:bg-black/50 backdrop-blur-[2px] flex items-center justify-center">
                               <Lock className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                             </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className={`font-bold text-lg break-words ${isLocked ? 'text-gray-500' : 'text-gray-900 dark:text-white group-hover:text-vanta-orange transition-colors'}`}>
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
                        
                        <div className="pl-4 border-l border-gray-100 dark:border-gray-700 ml-auto">
                           <button
                            onClick={() => !isLocked && handleResgatar(rec)}
                            disabled={isLocked || resgatandoId === rec.id}
                            className={`px-4 py-2.5 rounded-xl font-bold flex items-center justify-center transition-all duration-300 min-w-[120px]
                              ${isLocked ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700/50 dark:text-gray-500' :
                              resgatandoId === rec.id ? 'bg-vanta-orange/50 text-white cursor-wait' :
                              pontosAtuais >= rec.pontos ? 'bg-vanta-orange text-white shadow-md shadow-vanta-orange/20 hover:bg-orange-600 hover:shadow-lg hover:-translate-y-0.5' :
                              'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800'}`}
                          >
                            {resgatandoId === rec.id ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : isLocked ? (
                              'Bloqueado'
                            ) : pontosAtuais >= rec.pontos ? (
                              'Resgatar'
                            ) : (
                              'Sem saldo'
                            )}
                          </button>
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
