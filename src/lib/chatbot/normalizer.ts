import { ABBREVIATIONS, EMOTION_KEYWORDS } from './dictionaries';

export function normalizeText(text: string): string {
  // 1. Lowercase e remover acentos
  let normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // 2. Remover pontuações excessivas (manter apenas letras, números e espaços)
  normalized = normalized.replace(/[^\w\s]/gi, ' ');

  // 3. Remover espaços duplicados
  normalized = normalized.replace(/\s+/g, ' ').trim();

  // 4. Substituir abreviações
  const words = normalized.split(' ');
  const replacedWords = words.map(word => ABBREVIATIONS[word] || word);

  return replacedWords.join(' ');
}

export function detectEmotion(normalizedText: string): 'angry' | 'happy' | 'neutral' {
  const words = normalizedText.split(' ');
  
  let angryScore = 0;
  let happyScore = 0;

  for (const word of words) {
    if (EMOTION_KEYWORDS.angry.includes(word)) angryScore++;
    if (EMOTION_KEYWORDS.happy.includes(word)) happyScore++;
  }

  if (angryScore > happyScore) return 'angry';
  if (happyScore > angryScore) return 'happy';
  return 'neutral';
}

// Regex úteis para extrair e padronizar
export const REGEX = {
  cpf: /[0-9]{3}\.?[0-9]{3}\.?[0-9]{3}\-?[0-9]{2}/g,
  telefone: /(\(?\d{2}\)?\s?)?9?\d{4}-?\d{4}/g,
  rastreio: /[A-Z]{2}[0-9]{9}[A-Z]{2}/g, // Ex: NN123456789BR
  data: /\d{2}\/\d{2}\/\d{4}/g,
};
