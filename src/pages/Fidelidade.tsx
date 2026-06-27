import { useAuth } from '../contexts/AuthContext';
import { Award, Star, Gift, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Fidelidade() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-gray-500">Você precisa estar logado para ver esta página.</p>
      </div>
    );
  }

  // Placeholder de pontos
  const pontosAtuais = 0;
  const pontosProximoNivel = 1000;

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="md:col-span-2 bg-gradient-to-br from-gray-900 to-vanta-darkblue rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Star className="w-48 h-48" />
          </div>
          
          <div className="relative z-10">
            <h2 className="text-xl font-medium text-gray-300 mb-2">Seus Pontos Atuais</h2>
            <div className="flex items-end gap-3 mb-8">
              <span className="text-6xl font-black text-vanta-orange">{pontosAtuais}</span>
              <span className="text-xl font-bold mb-2">VantaCoins</span>
            </div>
            
            <div className="mb-4">
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
            <Link to="/" className="inline-block mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg font-bold transition-colors">
              Como ganhar mais?
            </Link>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-soft">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white">Como Funciona</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              A cada R$ 1,00 gasto na loja, você acumula 1 VantaCoin. 
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-soft">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Gift className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white">Recompensas</h3>
            </div>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <li className="flex items-center gap-2">• 1.000 pts = Capinha Grátis</li>
              <li className="flex items-center gap-2">• 2.500 pts = Película Premium</li>
              <li className="flex items-center gap-2">• 5.000 pts = R$ 150 de Desconto</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
