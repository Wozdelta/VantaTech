import { supabase } from '../../lib/supabase';
import { TrackingResponse } from './trackingTypes';

export const getTrackingInfo = async (trackingCode: string): Promise<TrackingResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('tracking', {
      body: { trackingCode },
    });

    if (error) {
      console.error('Erro na chamada da Edge Function:', error);
      return {
        success: false,
        message: 'Não foi possível consultar o rastreamento no momento.',
      };
    }

    return data as TrackingResponse;
  } catch (err) {
    console.error('Falha de rede ao conectar à Edge Function:', err);
    return {
      success: false,
      message: 'Não foi possível conectar ao servidor de rastreamento.',
    };
  }
};
