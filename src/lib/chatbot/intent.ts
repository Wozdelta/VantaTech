import Fuse from 'fuse.js';

export type Intent = 
  | 'comprar' 
  | 'pagamento' 
  | 'garantia' 
  | 'rastreamento' 
  | 'suporte' 
  | 'saudacao'
  | 'despedida'
  | 'desconhecido';

const INTENT_EXAMPLES = [
  { intent: 'comprar', text: 'quero comprar um celular smartphone aparelho' },
  { intent: 'comprar', text: 'quero um iphone apple samsung' },
  { intent: 'comprar', text: 'como faço para adquirir' },
  { intent: 'comprar', text: 'tem no estoque disponibilidade' },
  
  { intent: 'pagamento', text: 'quais as formas de pagamento' },
  { intent: 'pagamento', text: 'aceita pix cartao de credito' },
  { intent: 'pagamento', text: 'parcela no cartão boleto' },
  { intent: 'pagamento', text: 'qual o preço valor custa' },
  
  { intent: 'garantia', text: 'meu celular estragou' },
  { intent: 'garantia', text: 'veio com defeito' },
  { intent: 'garantia', text: 'preciso de assistência tecnica' },
  { intent: 'garantia', text: 'quero acionar a garantia' },
  { intent: 'garantia', text: 'quero trocar devolver devolução' },
  { intent: 'garantia', text: 'nao ta ligando parou de funcionar' },
  { intent: 'garantia', text: 'quebrou a tela problema bateria' },
  
  { intent: 'rastreamento', text: 'onde está meu pedido' },
  { intent: 'rastreamento', text: 'não chegou ainda entrega atrasada' },
  { intent: 'rastreamento', text: 'código de rastreio correios' },
  { intent: 'rastreamento', text: 'cadê minha entrega' },
  
  { intent: 'suporte', text: 'quero falar com um atendente humano' },
  { intent: 'suporte', text: 'preciso de ajuda humana atendente real' },
  { intent: 'suporte', text: 'abrir um ticket reclamacao' },
  { intent: 'suporte', text: 'estou com um problema ajuda suporte' },
  { intent: 'suporte', text: 'nao consigo resolver' },
  
  { intent: 'saudacao', text: 'oi ola bom dia boa tarde boa noite' },
  { intent: 'saudacao', text: 'tudo bem como vai e ai' },
  
  { intent: 'despedida', text: 'tchau valeu obrigado ate logo' }
];

export function classifyIntent(normalizedText: string): Intent {
  const fuse = new Fuse(INTENT_EXAMPLES, {
    keys: ['text'],
    includeScore: true,
    threshold: 0.8, // Permite busca aproximada mais tolerante
    ignoreLocation: true // Busca palavras em qualquer lugar da frase
  });

  const results = fuse.search(normalizedText);

  if (results.length > 0 && results[0].score !== undefined && results[0].score < 0.75) {
    return results[0].item.intent as Intent;
  }

  // Fallback baseado em palavras-chave fortes caso o Fuse falhe
  if (normalizedText.includes('problema') || normalizedText.includes('nao liga') || normalizedText.includes('defeito') || normalizedText.includes('quebro')) {
    return 'garantia';
  }
  if (normalizedText.includes('comprar') || normalizedText.includes('valor') || normalizedText.includes('preco')) {
    return 'comprar';
  }
  if (normalizedText.includes('rastrei') || normalizedText.includes('cade') || normalizedText.includes('entrega')) {
    return 'rastreamento';
  }

  return 'desconhecido';
}
