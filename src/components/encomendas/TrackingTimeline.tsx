import { Package, Truck, Building, MapPin, CheckCircle2, AlertTriangle } from 'lucide-react';
import { TrackingEvent } from '../../services/tracking/trackingTypes';

interface TrackingTimelineProps {
  events: TrackingEvent[];
}

export default function TrackingTimeline({ events }: TrackingTimelineProps) {
  const getIconForStatus = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('entregue')) return <CheckCircle2 className="w-4 h-4 text-white" />;
    if (s.includes('saiu para entrega')) return <MapPin className="w-4 h-4 text-white" />;
    if (s.includes('postado')) return <Package className="w-4 h-4 text-white" />;
    if (s.includes('fiscalização') || s.includes('problema') || s.includes('aguardando')) return <AlertTriangle className="w-4 h-4 text-white" />;
    if (s.includes('unidade de tratamento') || s.includes('unidade de distribuição') || s.includes('unidade operacional')) return <Building className="w-4 h-4 text-white" />;
    return <Truck className="w-4 h-4 text-white" />; // Em trânsito padrão
  };

  const getEventColorClass = (status: string, isFirst: boolean) => {
    const s = status.toLowerCase();
    if (s.includes('entregue')) return 'bg-green-500';
    if (s.includes('problema') || s.includes('aguardando')) return 'bg-red-500';
    return isFirst ? 'bg-vanta-blue' : 'bg-gray-300 dark:bg-gray-600';
  };

  return (
    <div className="relative pl-6 py-4">
      {/* Linha vertical conectando os eventos */}
      <div className="absolute left-[39px] top-8 bottom-8 w-0.5 bg-gray-200 dark:bg-gray-700" />

      <div className="flex flex-col gap-6">
        {events.map((evento, index) => {
          const isFirst = index === 0;
          const colorClass = getEventColorClass(evento.status, isFirst);

          return (
            <div key={index} className="relative flex gap-4">
              {/* Círculo do Ícone */}
              <div className="relative z-10 flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 border-white dark:border-gray-800 ${colorClass}`}>
                  {getIconForStatus(evento.status)}
                </div>
              </div>

              {/* Detalhes do Evento */}
              <div className={`flex flex-col ${isFirst ? 'opacity-100' : 'opacity-75'}`}>
                <h4 className={`text-sm font-bold ${isFirst ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                  {evento.status}
                </h4>
                
                {evento.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {evento.description}
                  </p>
                )}
                
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    {evento.date}
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    {evento.city} {evento.state && `- ${evento.state}`}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
