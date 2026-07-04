import { useState, useEffect, useRef } from 'react';
import { Package, X } from 'lucide-react';

interface TrackingModalProps {
  codigo: string;
  onClose: () => void;
}

declare global {
  interface Window {
    YQV5: any;
  }
}

export default function TrackingModal({ codigo, onClose }: TrackingModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isWidgetLoaded, setIsWidgetLoaded] = useState(false);

  useEffect(() => {
    if (!codigo) return;

    setIsWidgetLoaded(false);

    // Carregar o script do widget 17Track dinamicamente
    const script = document.createElement('script');
    script.src = '//s.17track.net/modules/track/widget/v2/index.js';
    script.async = true;
    
    script.onload = () => {
      setIsWidgetLoaded(true);
      // Inicializar o widget quando o script terminar de carregar
      if (window.YQV5) {
        window.YQV5.trackSingle({
          YQ_ContainerId: 'YQContainer',
          YQ_Height: 500,
          YQ_Fc: '0',
          YQ_Lang: 'pt',
          YQ_Num: codigo
        });
      }
    };

    document.body.appendChild(script);

    return () => {
      // Limpar o script se o modal for fechado
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [codigo]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-vanta-darker w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <Package className="w-6 h-6 text-vanta-blue" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Rastreamento</h2>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{codigo}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-2 overflow-y-auto custom-scrollbar flex-1 relative min-h-[400px]">
          {!isWidgetLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-vanta-darker z-10">
              <div className="w-10 h-10 border-4 border-gray-200 dark:border-gray-700 border-t-vanta-blue rounded-full animate-spin mb-4" />
              <p className="text-sm font-bold text-gray-500">Conectando ao rastreio global...</p>
            </div>
          )}
          
          {/* Container onde o 17Track vai injetar a interface de rastreio */}
          <div id="YQContainer" ref={containerRef} className="w-full"></div>
        </div>
        
      </div>
    </div>
  );
}
