import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  let cleanLine = line.trim(); // Remove \r
  const match = cleanLine.match(/^([^=]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[match[1].trim()] = val;
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL || '', env.VITE_SUPABASE_ANON_KEY || '');
const genAI = new GoogleGenerativeAI(env.VITE_GEMINI_API_KEY || '');

async function test() {
  console.log("Buscando grupos no Supabase...");
  const { data: grupos, error } = await supabase.from('tabela_precos_grupos').select('id, nome, marcas(nome), tabela_precos_variacoes(id, nome, valor_venda)');
  if (error) {
    console.error("Erro supabase:", error);
    return;
  }
  
  console.log(`Encontrados ${grupos?.length || 0} grupos.`);
  
  let totalVariacoes = 0;
  for (const grupo of grupos || []) {
    totalVariacoes += (grupo.tabela_precos_variacoes || []).length;
    for (const v of grupo.tabela_precos_variacoes || []) {
      if (v.valor_venda) {
        console.log(`Testando Gemini para: ${grupo.nome} ${v.nome} (R$ ${v.valor_venda})`);
        
        const prompt = `Você é um avaliador de smartphones usados no mercado brasileiro.
O aparelho é um "${grupo.nome} ${v.nome}". O preço de referência de venda médio (Aparelho em excelente estado) é R$ ${v.valor_venda}.
Baseado nesse modelo e valor base, forneça apenas os 3 valores em reais (apenas números sem R$ ou pontos de milhar) em formato JSON para as categorias:
- "excelente": O aparelho está em estado impecável, sem arranhões, bateria boa (geralmente igual ao valor base).
- "bom": Aparelho tem marcas leves de uso, bateria aceitável.
- "regular": Aparelho com marcas visíveis de uso ou arranhões severos.

O JSON deve seguir esse formato estrito:
{
  "excelente": 1500,
  "bom": 1350,
  "regular": 1200
}
Retorne SOMENTE o objeto JSON, sem markdown e sem crases.`;

        try {
          const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
          const result = await model.generateContent(prompt);
          const text = result.response.text();
          console.log("Resposta Gemini bruta:", text);
          
          const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
          const aiPrices = JSON.parse(jsonStr);
          console.log("JSON Parseado:", aiPrices);
          return; // Stop after first test
        } catch(e) {
          console.error("Erro Gemini:", e);
          return;
        }
      }
    }
  }
  console.log("Total variações:", totalVariacoes);
}

test();
