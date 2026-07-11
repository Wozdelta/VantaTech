/// <reference types="node" />
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY || '';
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    const token = authHeader ? authHeader.split(' ')[1] : '';

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      }
    });

    const groqKey = process.env.VITE_GROQ_API_KEY || process.env.VITE_GEMINI_API_KEY; 
    
    if (!groqKey || groqKey.length < 10) {
      return res.status(400).json({ message: 'Chave da API do Groq não configurada no servidor Vercel. Erro: Chave inválida ou ausente.' });
    }

    const { data: grupos, error } = await supabase
      .from('tabela_precos_grupos')
      .select('id, nome, marcas(nome), tabela_precos_variacoes(id, nome, valor_venda)');

    if (error) {
      console.error('Erro ao buscar grupos:', error);
      return res.status(500).json({ message: 'Erro ao buscar dados no Supabase' });
    }

    let updatedCount = 0;
    const errors: string[] = [];
    const groq = new Groq({ apiKey: groqKey });

    for (const grupo of grupos) {
      const marcaNome = (grupo.marcas as any)?.nome || '';
      const aparelhoNome = `${marcaNome} ${grupo.nome}`.trim();
      
      const variacoes = grupo.tabela_precos_variacoes || [];

      for (const variacao of variacoes) {
        if (!variacao.valor_venda) continue;

        const modeloCompleto = `${aparelhoNome} ${variacao.nome}`;
        
        try {
          const prompt = `
Você é um especialista em avaliação de smartphones usados no mercado brasileiro.

Seu objetivo é retornar o valor de revenda entre pessoas físicas, dividindo-o em 3 categorias de conservação.

Modelo: "${modeloCompleto}"
Preço Base de Referência (Mercado Atual): R$ ${variacao.valor_venda}

Atenção: Você deve utilizar o PREÇO BASE DE REFERÊNCIA (R$ ${variacao.valor_venda}) como a sua principal âncora para o aparelho em EXCELENTE estado (ou muito próximo dele). 
A partir desse valor base, calcule a desvalorização realista para os estados BOM e REGULAR, considerando o modelo específico.

Definições de conservação para aplicar os descontos:

EXCELENTE (Valor igual ou muito próximo ao Preço Base de Referência)
- Sem riscos
- Sem marcas
- Bateria acima de 90%
- Tudo original
- Nunca aberto

BOM (Desconto leve a moderado sobre o valor Excelente)
- Pequenas marcas
- Funcionamento perfeito
- Bateria entre 80% e 89%

REGULAR (Desconto maior sobre o valor Excelente)
- Marcas visíveis
- Arranhões
- Pequenos amassados
- Bateria abaixo de 80%

IMPORTANTE:
Os valores retornados devem fazer sentido comercialmente na lógica de revenda de usados no Brasil. 
O valor do estado "excelente" NUNCA deve ser um valor absurdo de lançamento (use o Preço Base como guia), e os estados "bom" e "regular" devem ser proporcionalmente mais baratos.

Retorne SOMENTE um JSON válido e NADA MAIS.

{
  "excelente": 0,
  "bom": 0,
  "regular": 0
}

Regras obrigatórias:
- Apenas números inteiros.
- Sem a sigla R$.
- Sem nenhum texto de introdução ou conclusão.
- Sem formatação markdown (sem \`\`\`json).
- Sem comentários.
- Sem explicações.
`;

          const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.2,
            response_format: { type: "json_object" },
          });
          
          const content = chatCompletion.choices[0]?.message?.content || "";
          
          if (!content) continue;

          const jsonStr = content.replace(/```json/g, '').replace(/```/g, '').trim();
          const aiPrices = JSON.parse(jsonStr);

          if (aiPrices.excelente && aiPrices.bom && aiPrices.regular) {
            const { error: updateError } = await supabase
              .from('tabela_precos_variacoes')
              .update({
                venda_excelente: Number(aiPrices.excelente),
                venda_bom: Number(aiPrices.bom),
                venda_regular: Number(aiPrices.regular),
                ia_atualizado_em: new Date().toISOString()
              })
              .eq('id', variacao.id);

            if (updateError) {
              console.error(`Erro ao atualizar variação ${variacao.id}:`, updateError);
              errors.push(updateError.message);
            } else {
              updatedCount++;
            }
          }
        } catch (aiError: any) {
          console.error(`Erro na requisição IA para ${modeloCompleto}:`, aiError);
          errors.push(aiError.message || String(aiError));
        }
      }
    }

    let finalMessage = `Atualização concluída via IA (Groq). ${updatedCount} variações atualizadas.`;
    if (errors.length > 0) {
      finalMessage += ` Erros encontrados: ${errors[0]}`;
    }

    return res.status(200).json({ message: finalMessage });

  } catch (err: any) {
    console.error('Erro geral no update-ai-prices:', err);
    return res.status(500).json({ message: 'Erro interno no servidor: ' + String(err) });
  }
}
