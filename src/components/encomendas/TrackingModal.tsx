import { useState, useEffect } from 'react';
import { Package, Truck, CheckCircle2, X, AlertCircle, Loader2 } from 'lucide-react';

interface TrackingEvent {
  data: string;
  hora: string;
  local: string;
  status: string;
  subStatus?: string[];
}

interface TrackingData {
  codigo: string;
  host: string;
  eventos: TrackingEvent[];
}

interface TrackingModalProps {
  codigo: string;
  onClose: () => void;
}

export default function TrackingModal({ codigo, onClose }: TrackingModalProps) {
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTracking() {
      try {
        setLoading(true);
        setError(null);
        
        // Requisição para a nossa própria Serverless API (Vercel) para contornar problemas de CORS 
        const res = await fetch(`/api/track?codigo=${codigo}`);
        
        const data = await res.json();
        
        if (data.notFound) {
          setError('O código de rastreio informado não foi encontrado. Ele pode estar incorreto, ter expirado (se for muito antigo) ou os Correios ainda não atualizaram o sistema.');
          return;
        }

        if (data.fallbackError || data.fatalError) {
          setError('Servidores de rastreio indisponíveis no momento. Tente novamente mais tarde.');
          return;
        }

        if (data && data.eventos && data.eventos.length > 0) {
          setTrackingData(data);
        } else {
          setError('Ainda não há atualizações para este código de rastreio ou ele é inválido.');
        }
      } catch (err: any) {
        console.error('Erro ao buscar rastreio:', err);
        setError('Não foi possível carregar o rastreio. Os servidores podem estar instáveis no momento.');
      } finally {
        setLoading(false);
      }
    }

    if (codigo) {
      fetchTracking();
    }
  }, [codigo]);

  const getStatusIcon = (status: string, index: number) => {
    if (index === 0 && status.toLowerCase().includes('entregue')) {
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    }
    if (status.toLowerCase().includes('postado')) {
      return <Package className="w-5 h-5 text-vanta-blue" />;
    }
    return <Truck className="w-5 h-5 text-vanta-orange" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-vanta-blue" />
              Rastreamento
            </h2>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider">
              {codigo}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 relative">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-10 h-10 text-vanta-blue animate-spin mb-4" />
              <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Buscando atualizações nos Correios...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
              <AlertCircle className="w-12 h-12 text-vanta-orange mb-4 opacity-80" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-6">{error}</p>
              
              {!/^[A-Za-z]{2}\d{9}[A-Za-z]{2}$/.test(codigo) ? (
                <div className="flex flex-col gap-3 w-full sm:w-auto">
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Tente o Rastreio Global:</span>
                  <a 
                    href={`https://t.17track.net/pt#nums=${codigo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-2.5 bg-[#ff6b00] text-white rounded-xl font-bold text-sm hover:bg-[#e05e00] transition-colors flex items-center justify-center gap-2 shadow-md w-full"
                  >
                    <Package className="w-4 h-4" />
                    Rastrear no 17Track
                  </a>
                  <a 
                    href={`https://global.cainiao.com/newDetail.htm?mailNoList=${codigo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-2.5 bg-[#0042f0] text-white rounded-xl font-bold text-sm hover:bg-[#0036c4] transition-colors flex items-center justify-center gap-2 shadow-md w-full"
                  >
                    <Truck className="w-4 h-4" />
                    Rastrear na Cainiao
                  </a>
                </div>
              ) : (
                <a 
                  href={`https://linketrack.com/track?codigo=${codigo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2.5 bg-vanta-blue text-white rounded-xl font-bold text-sm hover:bg-vanta-darkblue transition-colors flex items-center gap-2 shadow-md"
                >
                  <Package className="w-4 h-4" />
                  Rastrear no site oficial
                </a>
              )}
            </div>
          ) : trackingData?.eventos?.length ? (
            <div className="relative pl-6 border-l-2 border-gray-100 dark:border-gray-700 space-y-8 my-4">
              {trackingData.eventos.map((evento, index) => (
                <div key={index} className="relative">
                  <div className={`absolute -left-[35px] flex items-center justify-center w-8 h-8 rounded-full border-4 border-white dark:border-gray-800 ${
                    index === 0 ? 'bg-blue-50 dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800'
                  }`}>
                    {getStatusIcon(evento.status, index)}
                  </div>
                  
                  <div className={`flex flex-col ${index === 0 ? 'opacity-100' : 'opacity-60'}`}>
                    <span className={`font-bold ${index === 0 ? 'text-gray-900 dark:text-white text-base' : 'text-gray-700 dark:text-gray-300 text-sm'}`}>
                      {evento.status}
                    </span>
                    
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-bold text-vanta-blue bg-vanta-blue/10 px-2 py-0.5 rounded">
                        {evento.data} às {evento.hora}
                      </span>
                    </div>
                    
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
                      📍 {evento.local}
                    </span>
                    
                    {evento.subStatus && evento.subStatus.length > 0 && (
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic border-l-2 border-gray-200 dark:border-gray-600 pl-3">
                        {evento.subStatus.map((sub, i) => (
                          <p key={i}>{sub}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <div className="flex flex-col items-center justify-center py-12 text-center">
               <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
               <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Nenhum evento registrado ainda.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
