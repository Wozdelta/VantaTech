import { useAuth } from '../contexts/AuthContext';
import { Award, Star, Gift, TrendingUp, Copy, CheckCircle2, Share2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Fidelidade() {
  const { user, perfil } = useAuth();
  const [copied, setCopied] = useState(false);

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-gray-500">Você precisa estar logado para ver esta página.</p>
      </div>
    );
  }

  const pontosAtuais = perfil?.pontos || 0;
  const pontosProximoNivel = 1000;
  
  const affiliateLink = `${window.location.origin}/?ref=${user.id}`;

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
                <span className="text-gray-300">Nível Bronze</span>
                <span className="text-gray-300">Faltam {pontosProximoNivel - pontosAtuais} pts para Prata</span>
              </div>
              <div className="h-3 w-full bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-vanta-orange rounded-full" 
                  style={{ width: `${(pontosAtuais / pontosProximoNivel) * 100}%` }}
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

      {/* Grid Inferior: Como Funciona e Recompensas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
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
        
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-soft h-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <Gift className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-bold text-xl text-gray-900 dark:text-white">Recompensas</h3>
          </div>
          <ul className="text-gray-600 dark:text-gray-400 space-y-4 text-lg">
            <li className="flex items-center gap-3"><span className="text-vanta-orange font-bold">•</span> 1.000 pts = Capinha Grátis</li>
            <li className="flex items-center gap-3"><span className="text-vanta-orange font-bold">•</span> 2.500 pts = Película Premium</li>
            <li className="flex items-center gap-3"><span className="text-vanta-orange font-bold">•</span> 5.000 pts = R$ 150 de Desconto</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
