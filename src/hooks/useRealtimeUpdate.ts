import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Hook para adicionar atualizações em tempo real baseadas no Supabase Channels.
 * @param tables Array de nomes de tabelas para escutar (ex: ['pedidos', 'produtos'])
 * @param onUpdate Função de callback executada quando houver alguma alteração (INSERT, UPDATE ou DELETE)
 */
export function useRealtimeUpdate(tables: string[], onUpdate: () => void) {
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    const channels = tables.map((table) => {
      return supabase
        .channel(`realtime-admin-${table}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: table },
          () => {
            if (onUpdateRef.current) {
              onUpdateRef.current();
            }
          }
        )
        .subscribe();
    });

    return () => {
      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
    };
  }, [tables.join(',')]); // Depende das tabelas para recriar apenas se elas mudarem
}
