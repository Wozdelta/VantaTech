import { ArrowRight, Search, Plane, SearchCheck, Rocket } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HeroBanner() {
  return (
    <div className="relative bg-white dark:bg-gray-900 rounded-[32px] shadow-[0_8px_40px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_40px_rgb(0,0,0,0.1)] border border-gray-100 dark:border-gray-800 mt-6 transition-colors duration-300 p-6 sm:p-10 lg:p-16 overflow-hidden sm:overflow-visible">
      
      {/* Decorative background container (clipped) */}
      <div className="absolute inset-0 overflow-hidden rounded-[32px] pointer-events-none">
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" 
             style={{ backgroundImage: 'radial-gradient(#1D8EFF 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
        </div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-vanta-blue/10 to-transparent rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center relative z-10">
        
        {/* Left Content */}
        <div className="flex flex-col items-start space-y-8 animate-slide-up">

          
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-vanta-darkblue dark:text-white leading-[1.05] tracking-tight transition-colors duration-300">
            Melhores valores da{' '}
            <br className="hidden sm:block" />
            <span className="text-vanta-orange">região de Araraquara</span>
          </h1>
          
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-lg leading-relaxed transition-colors duration-300">
            Os melhores smartphones novos e seminovos. Desempenho máximo, qualidade impecável e preços que fazem sentido para você.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 w-full sm:w-auto">
            <Link 
              to="/produtos" 
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 text-white font-bold text-lg rounded-full bg-vanta-blue hover:bg-vanta-darkblue shadow-[0_8px_25px_rgba(29,142,255,0.4)] hover:shadow-[0_12px_35px_rgba(29,142,255,0.6)] hover:-translate-y-1 transition-all duration-300"
            >
              Comprar Agora
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>


        </div>

        {/* Right Content - Dynamic Banner Composition */}
        <div className="relative h-[300px] sm:h-[450px] lg:h-[550px] w-full flex items-center justify-center animate-slide-up group mt-12 lg:mt-0 perspective-1000">
           
           {/* Ambient Glow behind the whole composition */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-vanta-blue/20 dark:bg-vanta-blue/10 rounded-full blur-[120px] pointer-events-none"></div>

           {/* Fundo orgânico brilhante para destacar a imagem */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-vanta-blue/20 via-transparent to-vanta-orange/10 rounded-full blur-[100px] pointer-events-none"></div>

           {/* Imagem principal tratada como um Card Premium */}
           <div className="relative z-10 w-[110%] sm:w-[115%] md:w-[125%] flex items-center justify-center">
             <div className="relative w-full aspect-[4/3] sm:aspect-video md:aspect-[4/3] lg:aspect-[4/3] rounded-[40px] p-2 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-white/60 dark:border-gray-700/50">
               <img 
                 src="/Phone.png" 
                 alt="Smartphones Premium" 
                 className="w-full h-full object-cover rounded-[32px] shadow-inner transition-transform duration-1000" 
               />
               
               {/* Reflexo de vidro em cima da imagem */}
               <div className="absolute inset-0 rounded-[40px] bg-gradient-to-tr from-white/20 via-transparent to-transparent pointer-events-none"></div>
             </div>
           </div>

           {/* Floating Widgets */}
           <div className="absolute top-4 left-0 sm:-left-4 md:top-10 md:-left-16 lg:-left-24 px-4 py-3 md:px-6 md:py-4 scale-[0.75] sm:scale-90 md:scale-100 origin-left bg-white/90 dark:bg-gray-800/95 backdrop-blur-xl border border-white/60 dark:border-gray-700 shadow-[0_15px_35px_rgba(0,0,0,0.1)] dark:shadow-[0_15px_35px_rgba(0,0,0,0.3)] rounded-2xl flex items-center gap-3.5 transition-all duration-500 hover:-translate-y-3 hover:scale-105 z-20">
             <div className="bg-green-100 dark:bg-green-900/40 p-2 md:p-2.5 rounded-xl border border-green-200/50 dark:border-green-800/50">
               <Plane className="w-4 h-4 md:w-5 md:h-5 text-green-600 dark:text-green-400" />
             </div>
             <span className="font-extrabold text-gray-800 dark:text-gray-100 text-sm md:text-base tracking-tight">Importados</span>
           </div>

           <div className="absolute bottom-4 sm:bottom-16 left-0 sm:-left-4 md:bottom-24 md:-left-12 lg:-left-20 px-4 py-3 md:px-6 md:py-4 scale-[0.75] sm:scale-90 md:scale-100 origin-left bg-white/90 dark:bg-gray-800/95 backdrop-blur-xl border border-white/60 dark:border-gray-700 shadow-[0_15px_35px_rgba(0,0,0,0.1)] dark:shadow-[0_15px_35px_rgba(0,0,0,0.3)] rounded-2xl flex items-center gap-3.5 transition-all duration-500 hover:-translate-y-3 hover:scale-105 delay-100 z-20">
             <div className="bg-blue-100 dark:bg-blue-900/40 p-2 md:p-2.5 rounded-xl border border-blue-200/50 dark:border-blue-800/50">
               <SearchCheck className="w-4 h-4 md:w-5 md:h-5 text-vanta-blue dark:text-blue-400" />
             </div>
             <span className="font-extrabold text-gray-800 dark:text-gray-100 text-sm md:text-base tracking-tight">Produto Revisado</span>
           </div>

           <div className="absolute top-24 sm:top-28 right-0 sm:-right-4 md:top-32 md:-right-16 lg:-right-24 px-4 py-3 md:px-6 md:py-4 scale-[0.75] sm:scale-90 md:scale-100 origin-right bg-white/90 dark:bg-gray-800/95 backdrop-blur-xl border border-white/60 dark:border-gray-700 shadow-[0_15px_35px_rgba(0,0,0,0.1)] dark:shadow-[0_15px_35px_rgba(0,0,0,0.3)] rounded-2xl flex items-center gap-3.5 transition-all duration-500 hover:-translate-y-3 hover:scale-105 delay-75 z-20">
             <div className="bg-orange-100 dark:bg-orange-900/40 p-2 md:p-2.5 rounded-xl border border-orange-200/50 dark:border-orange-800/50">
               <Rocket className="w-4 h-4 md:w-5 md:h-5 text-vanta-orange dark:text-orange-400" />
             </div>
             <span className="font-extrabold text-gray-800 dark:text-gray-100 text-sm md:text-base tracking-tight">Envio Rápido</span>
           </div>

           <div className="absolute -bottom-4 sm:bottom-6 right-0 sm:-right-4 md:bottom-12 md:-right-16 lg:-right-24 px-4 py-3 md:px-7 md:py-5 scale-[0.75] sm:scale-90 md:scale-100 origin-right bg-white/90 dark:bg-gray-800/95 backdrop-blur-xl border border-white/60 dark:border-gray-700 shadow-[0_15px_35px_rgba(0,0,0,0.1)] dark:shadow-[0_15px_35px_rgba(0,0,0,0.3)] rounded-2xl flex flex-col items-center justify-center transition-all duration-500 hover:-translate-y-3 hover:scale-105 delay-150 z-20">
             <span className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-bold mb-1 uppercase tracking-widest">Economia de</span>
             <span className="font-black text-xl md:text-3xl leading-none bg-clip-text text-transparent bg-gradient-to-r from-vanta-darkblue to-vanta-blue dark:from-white dark:to-blue-200">Até 40%</span>
           </div>

        </div>
      </div>
    </div>
  );
}
