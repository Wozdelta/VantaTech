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
  { intent: 'comprar', text: 'quero comprar um celular' },
  { intent: 'comprar', text: 'quero um iphone' },
  { intent: 'comprar', text: 'como faço para adquirir' },
  { intent: 'comprar', text: 'tem no estoque' },
  
  { intent: 'pagamento', text: 'quais as formas de pagamento' },
  { intent: 'pagamento', text: 'aceita pix' },
  { intent: 'pagamento', text: 'parcela no cartão' },
  { intent: 'pagamento', text: 'qual o preço valor' },
  
  { intent: 'garantia', text: 'meu celular estragou' },
  { intent: 'garantia', text: 'veio com defeito' },
  { intent: 'garantia', text: 'preciso de assistência' },
  { intent: 'garantia', text: 'quero acionar a garantia' },
  { intent: 'garantia', text: 'quero trocar devolver' },
  
  { intent: 'rastreamento', text: 'onde está meu pedido' },
  { intent: 'rastreamento', text: 'não chegou ainda' },
  { intent: 'rastreamento', text: 'código de rastreio' },
  { intent: 'rastreamento', text: 'cadê minha entrega' },
  
  { intent: 'suporte', text: 'quero falar com um atendente' },
  { intent: 'suporte', text: 'preciso de ajuda humana' },
  { intent: 'suporte', text: 'abrir um ticket' },
  { intent: 'suporte', text: 'estou com um problema' },
  
  { intent: 'saudacao', text: 'oi ola bom dia boa tarde boa noite' },
  { intent: 'saudacao', text: 'tudo bem' },
  
  { intent: 'despedida', text: 'tchau valeu obrigado' }
];

export function classifyIntent(normalizedText: string): Intent {
  const fuse = new Fuse(INTENT_EXAMPLES, {
    keys: ['text'],
    includeScore: true,
    threshold: 0.6 // Permite busca semântica aproximada
  });

  const results = fuse.search(normalizedText);

  if (results.length > 0 && results[0].score !== undefined && results[0].score < 0.5) {
    return results[0].item.intent as Intent;
  }

  return 'desconhecido';
}
