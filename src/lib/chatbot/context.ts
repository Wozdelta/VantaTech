import { type Entities } from './entities';

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
  // Se o usuário mudou de produto (ex: de iphone para samsung), apaga o modelo antigo da memória
  const entitiesBase = { ...context.entities };
  if (newEntities.produto && entitiesBase.produto && newEntities.produto !== entitiesBase.produto) {
    delete entitiesBase.modelo;
  }

  // Mescla as novas entidades com as antigas (mantém a memória)
  const updatedEntities = {
    ...entitiesBase,
    ...Object.fromEntries(Object.entries(newEntities).filter(([_, v]) => v !== undefined))
  };

  return {
    ...context,
    entities: updatedEntities,
    lastIntent: intent || context.lastIntent,
    history: [...context.history, userInput]
  };
}
