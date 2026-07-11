import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY || ''; // Using anon key for simplicity if service key isn't available, though service key is better for server actions.

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const openai = new OpenAI({
  apiKey: process.env.VITE_CHAT_GPT_API || process.env.OPENAI_API_KEY,
});

export default async function handler(req: any, res: any) {
  try {
    console.log('Iniciando atualização de preços via IA...');

    // Busca os grupos com suas variações
    const { data: grupos, error: gruposError } = await supabase
      .from('tabela_precos_grupos')
      .select(`
        id,
        nome,
        marcas ( nome ),
        tabela_precos_variacoes ( id, nome, valor_venda )
      `);

    if (gruposError) throw gruposError;

    if (!grupos || grupos.length === 0) {
      return res.status(200).json({ message: 'Nenhum aparelho encontrado para atualizar.' });
    }

    let updatedCount = 0;

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
Retorne SOMENTE o objeto JSON, sem markdown.`;

          const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.2,
          });

          const content = response.choices[0].message.content?.trim();
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
            } else {
              updatedCount++;
            }
          }
        } catch (aiError) {
          console.error(`Erro na requisição IA para ${modeloCompleto}:`, aiError);
        }
      }
    }

    return res.status(200).json({ message: `Atualização concluída. ${updatedCount} variações atualizadas.` });

  } catch (err: any) {
    console.error('Erro geral no update-ai-prices:', err);
    return res.status(500).json({ error: err.message || 'Erro interno do servidor' });
  }
}
