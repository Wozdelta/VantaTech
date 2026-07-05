import { supabase } from '../supabase';

export interface ChatLog {
  id?: string;
  data_hora?: string;
  pergunta: string;
  intencao: string;
  resolvido: boolean;
  emocao: string;
}

export async function logInteraction(log: Omit<ChatLog, 'id' | 'data_hora'>) {
  try {
    await supabase.from('historico_chatbot').insert([log]);
  } catch (e) {
    console.error('Failed to log chatbot interaction', e);
  }
}

export async function getAnalytics() {
  try {
    const { data: logs, error } = await supabase
      .from('historico_chatbot')
      .select('*')
      .order('data_hora', { ascending: false });
      
    if (error || !logs) return null;
    
    const total = logs.length;
    const resolved = logs.filter(l => l.resolvido).length;
    const unresolved = total - resolved;
    const resolutionRate = total > 0 ? (resolved / total) * 100 : 0;
    
    const intentCounts = logs.reduce((acc, log) => {
      acc[log.intencao] = (acc[log.intencao] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const emotionCounts = logs.reduce((acc, log) => {
      acc[log.emocao] = (acc[log.emocao] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      resolved,
      unresolved,
      resolutionRate,
      intentCounts,
      emotionCounts,
      recentLogs: logs.slice(0, 50)
    };
  } catch (e) {
    return null;
  }
}
