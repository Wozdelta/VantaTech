import { useState, useEffect } from 'react';
import { Package, X, AlertCircle } from 'lucide-react';
import { getTrackingInfo } from '../../services/tracking/trackingService';
import { TrackingResponse } from '../../services/tracking/trackingTypes';
import TrackingTimeline from './TrackingTimeline';

interface TrackingModalProps {
  codigo: string;
  onClose: () => void;
}

export default function TrackingModal({ codigo, onClose }: TrackingModalProps) {
  const [data, setData] = useState<TrackingResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const result = await getTrackingInfo(codigo);
      setData(result);
      setLoading(false);
    }
    loadData();
  }, [codigo]);

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
          
          {data?.success && data.delivered !== undefined && (
            <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ml-4 ${
              data.delivered ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {data.delivered ? 'Pedido Entregue' : 'Em transporte'}
            </span>
          )}

          <button 
            onClick={onClose}
            className="p-2 ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 relative">
          {loading ? (
            <div className="flex flex-col gap-6 pl-6 py-4 relative">
              <div className="absolute left-[39px] top-8 bottom-8 w-0.5 bg-gray-100 dark:bg-gray-700" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="relative flex gap-4 animate-pulse">
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-800" />
                  </div>
                  <div className="flex flex-col gap-2 w-full pt-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                    <div className="flex gap-2 mt-1">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : !data?.success ? (
            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
              <AlertCircle className="w-12 h-12 text-vanta-orange mb-4 opacity-80" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-6">{data?.message || 'Erro desconhecido.'}</p>
              <a 
                href={`https://linketrack.com/track?codigo=${codigo}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2.5 bg-vanta-blue text-white rounded-xl font-bold text-sm hover:bg-vanta-darkblue transition-colors flex items-center gap-2 shadow-md"
              >
                <Package className="w-4 h-4" />
                Rastrear no site oficial
              </a>
            </div>
          ) : data.events && data.events.length > 0 ? (
            <TrackingTimeline events={data.events} />
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
