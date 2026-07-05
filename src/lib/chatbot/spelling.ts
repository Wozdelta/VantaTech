import Fuse from 'fuse.js';

// Um dicionário de palavras válidas conhecidas no nosso contexto
const VALID_WORDS = [
  'iphone', 'samsung', 'motorola', 'xiaomi', 'celular', 'smartphone',
  'comprar', 'pagamento', 'pix', 'cartão', 'boleto', 'parcelar', 'juros',
  'garantia', 'defeito', 'quebrou', 'estragou', 'assistência', 'troca',
  'devolução', 'cancelamento', 'reembolso', 'estorno',
  'rastreio', 'rastreamento', 'correios', 'transportadora', 'entrega', 'pedido',
  'suporte', 'atendente', 'humano', 'ticket', 'ajuda', 'dúvida'
];

export function correctSpelling(normalizedText: string): string {
  const words = normalizedText.split(' ');
  const correctedWords = [];

  const fuse = new Fuse(VALID_WORDS, {
    includeScore: true,
    threshold: 0.4, // Se a palavra digitada for muito diferente, não corrige
  });

  for (const word of words) {
    if (word.length <= 3) {
      correctedWords.push(word);
      continue;
    }

    const result = fuse.search(word);
    if (result.length > 0 && result[0].score !== undefined && result[0].score < 0.3) {
      // Achou uma correção bem próxima (ex: iphine -> iphone)
      correctedWords.push(result[0].item);
    } else {
      // Nenhuma correção óbvia, mantém a original
      correctedWords.push(word);
    }
  }

  return correctedWords.join(' ');
}
