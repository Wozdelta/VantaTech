import { Entities } from './entities';

export interface ChatContext {
  userId?: string;
  userName?: string;
  lastIntent?: string;
  entities: Entities;
  history: string[];
}

export function createContext(): ChatContext {
  return {
    entities: {},
    history: []
  };
}

export function updateContext(context: ChatContext, newEntities: Entities, userInput: string, intent?: string): ChatContext {
  // Mescla as novas entidades com as antigas (mantém a memória)
  const updatedEntities = {
    ...context.entities,
    ...Object.fromEntries(Object.entries(newEntities).filter(([_, v]) => v !== undefined))
  };

  return {
    ...context,
    entities: updatedEntities,
    lastIntent: intent || context.lastIntent,
    history: [...context.history, userInput]
  };
}
