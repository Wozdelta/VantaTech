import { ArrowRight, Search, Plane, SearchCheck, Rocket } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HeroBanner() {
  return (
    <div className="relative overflow-hidden bg-white dark:bg-gray-900 rounded-[32px] shadow-[0_8px_40px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_40px_rgb(0,0,0,0.1)] border border-gray-100 dark:border-gray-800 mt-6 transition-colors duration-300 p-10 lg:p-16">
      
      {/* Decorative background lines/shapes */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#1D8EFF 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-vanta-blue/10 to-transparent rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center relative z-10">
        
        {/* Left Content */}
        <div className="flex flex-col items-start space-y-8 animate-slide-up">

          
          <h1 className="text-5xl lg:text-7xl font-extrabold text-vanta-darkblue dark:text-white leading-[1.05] tracking-tight transition-colors duration-300">
            Melhores valores da<br/>
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
            
            <Link 
              to="/produtos" 
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 text-vanta-darkblue dark:text-white font-bold text-lg rounded-full bg-transparent border-2 border-gray-200 dark:border-gray-700 hover:border-vanta-blue dark:hover:border-vanta-blue hover:text-vanta-blue dark:hover:text-vanta-blue hover:-translate-y-1 transition-all duration-300"
            >
              <Search className="w-5 h-5" />
              Explorar Catálogo
            </Link>
          </div>


        </div>

        {/* Right Content - Dynamic Banner Composition */}
        <div className="relative h-[450px] lg:h-[550px] w-full flex items-center justify-center animate-slide-up group mt-12 lg:mt-0 perspective-1000">
           
           {/* Ambient Glow behind the whole composition */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-vanta-blue/20 dark:bg-vanta-blue/10 rounded-full blur-[120px] pointer-events-none"></div>

           {/* Main Banner Card */}
           <div className="relative w-full h-full bg-gradient-to-tr from-white to-gray-50/50 dark:from-gray-800/90 dark:to-gray-900/90 rounded-[40px] border border-white/80 dark:border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] flex flex-col items-center justify-center overflow-hidden transition-all duration-700 hover:shadow-[0_20px_60px_-15px_rgba(29,142,255,0.15)] backdrop-blur-sm">
             
             {/* Tech Background details inside banner */}
             <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-60"></div>
             
             {/* Inner Glow for the Phone */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

             <div className="z-10 flex items-center justify-center w-full h-full p-6 lg:p-10 relative">
               <img src="/Phone.png" alt="iPhone Banner" className="w-full h-full object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.2)] transition-transform duration-700 group-hover:scale-105 group-hover:-translate-y-4" />
             </div>
           </div>

           {/* Floating Widgets */}
           <div className="absolute top-4 -left-2 sm:left-2 md:top-10 md:-left-8 lg:-left-12 px-5 py-3.5 md:px-6 md:py-4 scale-[0.7] sm:scale-90 md:scale-100 origin-left bg-white/90 dark:bg-gray-800/95 backdrop-blur-xl border border-white/60 dark:border-gray-700 shadow-[0_15px_35px_rgba(0,0,0,0.1)] dark:shadow-[0_15px_35px_rgba(0,0,0,0.3)] rounded-2xl flex items-center gap-3.5 transition-all duration-500 hover:-translate-y-3 hover:scale-105 z-20">
             <div className="bg-green-100 dark:bg-green-900/40 p-2.5 rounded-xl border border-green-200/50 dark:border-green-800/50">
               <Plane className="w-5 h-5 text-green-600 dark:text-green-400" />
             </div>
             <span className="font-extrabold text-gray-800 dark:text-gray-100 text-sm md:text-base tracking-tight">Importados</span>
           </div>

           <div className="absolute bottom-16 -left-2 sm:left-2 md:bottom-24 md:-left-6 lg:-left-10 px-5 py-3.5 md:px-6 md:py-4 scale-[0.7] sm:scale-90 md:scale-100 origin-left bg-white/90 dark:bg-gray-800/95 backdrop-blur-xl border border-white/60 dark:border-gray-700 shadow-[0_15px_35px_rgba(0,0,0,0.1)] dark:shadow-[0_15px_35px_rgba(0,0,0,0.3)] rounded-2xl flex items-center gap-3.5 transition-all duration-500 hover:-translate-y-3 hover:scale-105 delay-100 z-20">
             <div className="bg-blue-100 dark:bg-blue-900/40 p-2.5 rounded-xl border border-blue-200/50 dark:border-blue-800/50">
               <SearchCheck className="w-5 h-5 text-vanta-blue dark:text-blue-400" />
             </div>
             <span className="font-extrabold text-gray-800 dark:text-gray-100 text-sm md:text-base tracking-tight">Produto Revisado</span>
           </div>

           <div className="absolute top-28 -right-2 sm:right-2 md:top-32 md:-right-6 lg:-right-10 px-5 py-3.5 md:px-6 md:py-4 scale-[0.7] sm:scale-90 md:scale-100 origin-right bg-white/90 dark:bg-gray-800/95 backdrop-blur-xl border border-white/60 dark:border-gray-700 shadow-[0_15px_35px_rgba(0,0,0,0.1)] dark:shadow-[0_15px_35px_rgba(0,0,0,0.3)] rounded-2xl flex items-center gap-3.5 transition-all duration-500 hover:-translate-y-3 hover:scale-105 delay-75 z-20">
             <div className="bg-orange-100 dark:bg-orange-900/40 p-2.5 rounded-xl border border-orange-200/50 dark:border-orange-800/50">
               <Rocket className="w-5 h-5 text-vanta-orange dark:text-orange-400" />
             </div>
             <span className="font-extrabold text-gray-800 dark:text-gray-100 text-sm md:text-base tracking-tight">Envio Rápido</span>
           </div>

           <div className="absolute bottom-6 -right-2 sm:right-2 md:bottom-12 md:-right-8 lg:-right-12 px-5 py-4 md:px-7 md:py-5 scale-[0.7] sm:scale-90 md:scale-100 origin-right bg-white/90 dark:bg-gray-800/95 backdrop-blur-xl border border-white/60 dark:border-gray-700 shadow-[0_15px_35px_rgba(0,0,0,0.1)] dark:shadow-[0_15px_35px_rgba(0,0,0,0.3)] rounded-2xl flex flex-col items-center justify-center transition-all duration-500 hover:-translate-y-3 hover:scale-105 delay-150 z-20">
             <span className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-bold mb-1 uppercase tracking-widest">Economia de</span>
             <span className="font-black text-2xl md:text-3xl leading-none bg-clip-text text-transparent bg-gradient-to-r from-vanta-darkblue to-vanta-blue dark:from-white dark:to-blue-200">Até 40%</span>
           </div>

        </div>
      </div>
    </div>
  );
}
