import { normalizeText, detectEmotion } from './normalizer';
import { correctSpelling } from './spelling';
import { extractEntities } from './entities';
import { classifyIntent, type Intent } from './intent';
import { type ChatContext, updateContext } from './context';
import { executeTool, type ToolResult } from './tools';
import { getRandomResponse, GREETINGS, FALLBACK_RESPONSES, TICKET_OFFER } from './responses';
import { logInteraction } from './analytics';

export interface ChatResponse {
  text: string;
  action?: ToolResult['action'];
  actionData?: any;
  suggestions?: string[];
  newContext: ChatContext;
}

export async function processMessage(
  userInput: string, 
  currentContext: ChatContext
): Promise<ChatResponse> {
  const t0 = performance.now();

  // 1. Normalização & Emoção
  const normalized = normalizeText(userInput);
  const emotion = detectEmotion(normalized);

  // 2. Correção Ortográfica
  const corrected = correctSpelling(normalized);

  // 3. Extração de Entidades
  const entities = extractEntities(corrected);

  // 4. Intenção
  let intent = classifyIntent(corrected);

  // 5. Atualizar Contexto (Memória)
  // Se não detectou intenção, mas tem entidades (ex: usuário respondeu só "azul"), tenta herdar intenção
  if (intent === 'desconhecido' && currentContext.lastIntent) {
    intent = currentContext.lastIntent as Intent;
  }
  
  const newContext = updateContext(currentContext, entities, userInput, intent);

  let responseText = '';
  let action: ToolResult['action'];
  let actionData: any;
  let suggestions: string[] = [];
  let resolved = true;

  // 6. Tool Calling & Regras de Negócio
  const toolResult = await executeTool(intent, newContext.entities);

  if (toolResult) {
    responseText = toolResult.text;
    action = toolResult.action;
    actionData = toolResult.actionData;
    
    if (action === 'OPEN_TICKET') suggestions = ['Ver Pedidos', 'Falar com Especialista'];
    if (action === 'OPEN_TRACKING') suggestions = ['Abrir Ticket', 'Ver Pedidos'];
  } 
  else {
    // 7. Respostas Baseadas em Intenção (Fallback Inteligente)
    switch (intent) {
      case 'saudacao':
        responseText = getRandomResponse(GREETINGS);
        suggestions = ['Comprar Produto', 'Rastrear Pedido', 'Abrir Ticket'];
        break;
      
      case 'despedida':
        responseText = 'Por nada! Estou sempre aqui se precisar. Tenha um excelente dia!';
        break;

      case 'pagamento':
        if (normalized.includes('juro') || normalized.includes('taxa')) {
          responseText = 'Nossas taxas de parcelamento no cartão são:\n' + 
            '1x: 3.15%\n2x: 5.39%\n3x: 6.12%\n4x: 6.85%\n5x: 7.57%\n' +
            '6x: 8.28%\n7x: 8.99%\n8x: 9.69%\n9x: 10.38%\n' +
            '10x: 11.06%\n11x: 11.74%\n12x: 12.4%\n\n' +
            'Lembrando que pagamentos via PIX são aprovados na hora!';
        } else {
          responseText = 'Aceitamos pagamentos via PIX e parcelamento no cartão de crédito em até 12x. Todas as transações são seguras!';
        }
        suggestions = ['Comprar Produto'];
        break;

      default:
        // TODO: Integração real com IA (OpenAI/Gemini) entraria aqui.
        // Fallback final
        if (newContext.history.length > 3) {
          responseText = getRandomResponse(TICKET_OFFER);
          action = 'OPEN_TICKET';
        } else {
          responseText = getRandomResponse(FALLBACK_RESPONSES);
          resolved = false;
        }
        break;
    }
  }

  // Se o cliente estiver muito irritado, adicione um toque de empatia e ofereça humano.
  if (emotion === 'angry' && action !== 'OPEN_TICKET') {
    responseText = 'Sinto muito que você esteja passando por isso. ' + responseText;
    suggestions.unshift('Falar com Especialista');
  }

  // 8. Log Analytics
  logInteraction({
    pergunta: userInput,
    intencao: intent,
    resolvido: resolved,
    emocao: emotion
  });

  const t1 = performance.now();
  console.log(`[Chatbot NLP Pipeline] Resolvido em ${(t1 - t0).toFixed(2)}ms`);

  return {
    text: responseText,
    action,
    actionData,
    suggestions: [...new Set(suggestions)].slice(0, 3), // max 3 suggestions exclusivas
    newContext
  };
}
