import { Entities } from './entities';

export interface ToolResult {
  text: string;
  action?: 'OPEN_TICKET' | 'OPEN_TRACKING' | 'VIEW_ORDERS';
  actionData?: any;
}

export async function executeTool(intent: string, entities: Entities): Promise<ToolResult | null> {
  // Tool: Rastreamento Automático
  if (intent === 'rastreamento') {
    if (entities.rastreamento) {
      return {
        text: `Encontrei um código de rastreio na sua mensagem (${entities.rastreamento}). Vou abrir o painel de rastreamento para você acompanhar a entrega em tempo real!`,
        action: 'OPEN_TRACKING',
        actionData: entities.rastreamento
      };
    } else {
      return {
        text: 'Para consultar o rastreamento, você pode me informar o código de rastreio (ex: NN123456789BR) ou acessar diretamente a aba de Pedidos.',
        action: 'VIEW_ORDERS'
      };
    }
  }

  // Tool: Suporte / Garantia
  if (intent === 'suporte' || intent === 'garantia') {
    if (entities.produto) {
      return {
        text: `Entendi que você precisa de suporte referente ao seu ${entities.produto}. Para agilizar o atendimento, vou abrir um Ticket com nossa equipe especializada.`,
        action: 'OPEN_TICKET'
      };
    }
  }

  // Tool: Compras
  if (intent === 'comprar') {
    if (entities.produto) {
      return {
        text: `Ótima escolha! Para comprar um ${entities.produto} ${entities.modelo || ''}, recomendo verificar a aba de Produtos para ver nosso estoque atual e as cores disponíveis, como o ${entities.cor || 'modelo padrão'}.`,
      };
    }
  }

  return null;
}
