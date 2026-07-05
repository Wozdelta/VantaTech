import { REGEX } from './normalizer';

export interface Entities {
  produto?: string;
  modelo?: string;
  cor?: string;
  quantidade?: number;
  rastreamento?: string;
  cpf?: string;
  telefone?: string;
}

const COMMON_PRODUCTS = ['iphone', 'samsung', 'galaxy', 'motorola', 'moto', 'xiaomi', 'redmi', 'poco', 'celular', 'smartphone', 'aparelho'];
const COMMON_COLORS = ['azul', 'preto', 'branco', 'verde', 'vermelho', 'amarelo', 'roxo', 'rosa', 'prata', 'dourado', 'cinza', 'grafite', 'titanio'];

export function extractEntities(normalizedText: string): Entities {
  const entities: Entities = {};
  const words = normalizedText.split(' ');

  // Extrair Código de Rastreio (se houver, usando texto original ou em maiúsculo)
  const rastreioMatch = normalizedText.toUpperCase().match(REGEX.rastreio);
  if (rastreioMatch) {
    entities.rastreamento = rastreioMatch[0];
  }

  // Extrair Produto e Modelo
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    
    // Detectar produto
    if (!entities.produto && COMMON_PRODUCTS.includes(word)) {
      entities.produto = word;
      
      // Tentar pegar o modelo (as 1 ou 2 palavras seguintes, ex: "15 pro max", "s23 ultra")
      let modeloParts = [];
      if (words[i+1] && !COMMON_COLORS.includes(words[i+1]) && words[i+1].length < 15) modeloParts.push(words[i+1]);
      if (words[i+2] && !COMMON_COLORS.includes(words[i+2]) && words[i+2].length < 15) modeloParts.push(words[i+2]);
      if (words[i+3] && ['pro', 'max', 'ultra', 'plus'].includes(words[i+3])) modeloParts.push(words[i+3]);
      
      if (modeloParts.length > 0) {
        entities.modelo = modeloParts.join(' ');
      }
    }

    // Detectar cor
    if (!entities.cor && COMMON_COLORS.includes(word)) {
      entities.cor = word;
    }
  }

  return entities;
}
