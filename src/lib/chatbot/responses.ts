export const GREETINGS = [
  'Olá! Sou o assistente virtual da VantaTech. Como posso ajudar você hoje?',
  'Oi! Que bom ver você por aqui. Sou a IA da VantaTech. Em que posso ser útil?',
  'Olá! Seja bem-vindo ao suporte inteligente da VantaTech. Como posso facilitar seu dia?',
  'Oi, tudo bem? Sou o assistente virtual da loja. Qual é a sua dúvida hoje?'
];

export const FALLBACK_RESPONSES = [
  'Não tenho certeza se entendi completamente. Você poderia explicar de outra forma?',
  'Desculpe, ainda estou aprendendo e não compreendi sua dúvida. Pode detalhar um pouco mais?',
  'Hmm, essa eu não peguei. Poderia usar outras palavras para eu tentar ajudar?',
  'Infelizmente não encontrei uma resposta exata para isso na minha base. Pode reformular a pergunta?'
];

export const TICKET_OFFER = [
  'Parece que não consegui resolver sua dúvida automaticamente. Gostaria de abrir um Ticket para nossa equipe humana analisar?',
  'Para esse caso específico, acho melhor você falar diretamente com nossos especialistas. Deseja abrir um Ticket?',
  'Não consegui encontrar uma solução precisa. Quer que eu encaminhe isso para o atendimento humano (Abrir Ticket)?'
];

export function getRandomResponse(responses: string[]): string {
  const randomIndex = Math.floor(Math.random() * responses.length);
  return responses[randomIndex];
}
