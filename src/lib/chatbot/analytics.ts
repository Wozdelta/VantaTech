export interface ChatLog {
  id: string;
  timestamp: string;
  query: string;
  intent: string;
  resolved: boolean;
  emotion: string;
}

export function logInteraction(log: Omit<ChatLog, 'id' | 'timestamp'>) {
  try {
    const existingLogs = JSON.parse(localStorage.getItem('vantatech_chatbot_logs') || '[]');
    
    const newLog: ChatLog = {
      ...log,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };
    
    existingLogs.push(newLog);
    
    // Mantém apenas os últimos 1000 logs para não estourar o localStorage
    if (existingLogs.length > 1000) {
      existingLogs.shift();
    }
    
    localStorage.setItem('vantatech_chatbot_logs', JSON.stringify(existingLogs));
  } catch (e) {
    console.error('Failed to log chatbot interaction', e);
  }
}

export function getAnalytics() {
  try {
    const logs: ChatLog[] = JSON.parse(localStorage.getItem('vantatech_chatbot_logs') || '[]');
    
    const total = logs.length;
    const resolved = logs.filter(l => l.resolved).length;
    const unresolved = total - resolved;
    const resolutionRate = total > 0 ? (resolved / total) * 100 : 0;
    
    const intentCounts = logs.reduce((acc, log) => {
      acc[log.intent] = (acc[log.intent] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const emotionCounts = logs.reduce((acc, log) => {
      acc[log.emotion] = (acc[log.emotion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      resolved,
      unresolved,
      resolutionRate,
      intentCounts,
      emotionCounts,
      recentLogs: logs.slice(-50).reverse()
    };
  } catch (e) {
    return null;
  }
}
