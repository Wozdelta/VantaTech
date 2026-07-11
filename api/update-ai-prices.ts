/// <reference types="node" />
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
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
          const prompt = `Você é um avaliador de smartphones usados no mercado brasileiro.
O aparelho é um "${modeloCompleto}". O preço de referência de venda médio (Aparelho em excelente estado) é R$ ${variacao.valor_venda}.
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
Retorne SOMENTE o objeto JSON válido, sem nenhum texto adicional.`;

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
