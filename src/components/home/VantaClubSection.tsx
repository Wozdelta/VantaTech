import { Link } from 'react-router-dom';
import { Award, Gift, TrendingUp, ChevronRight } from 'lucide-react';

export default function VantaClubSection() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative overflow-hidden">
      {/* Background Decorativo */}
      <div className="absolute inset-0 bg-gradient-to-br from-vanta-darkblue via-vanta-blue to-vanta-orange opacity-[0.03] dark:opacity-10 rounded-3xl -z-10"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-vanta-orange/10 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-vanta-blue/10 rounded-full blur-3xl -z-10 transform -translate-x-1/2 translate-y-1/2"></div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Lado Esquerdo: Texto */}
        <div className="space-y-6">
          
          <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white leading-tight">
            Compre, acumule <span className="text-vanta-blue">VantaCoins</span> e resgate prêmios!
          </h2>
          
          <p className="text-lg text-gray-600 dark:text-gray-400">
            No Vanta Club, toda compra vira moedas. Suba de nível, ganhe descontos exclusivos e resgate produtos de graça.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row gap-4">
            <Link 
              to="/fidelidade" 
              className="inline-flex justify-center items-center gap-2 px-8 py-4 bg-vanta-blue text-white font-bold rounded-xl hover:bg-vanta-darkblue hover:-translate-y-1 shadow-[0_10px_20px_rgba(29,142,255,0.2)] transition-all"
            >
              Conhecer o Clube
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Lado Direito: Cards de Benefícios */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700 hover:-translate-y-1 transition-transform group">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6 text-vanta-blue" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Suba de Nível</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Comece no Bronze e evolua até o Diamante para desbloquear cupons secretos e vantagens únicas.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700 hover:-translate-y-1 transition-transform sm:translate-y-8 group">
            <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Gift className="w-6 h-6 text-vanta-orange" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Troque por Prêmios</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Use seus VantaCoins para resgatar descontos valiosos no carrinho ou produtos inteiros de graça.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
