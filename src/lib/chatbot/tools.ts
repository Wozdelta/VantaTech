import { type Entities } from './entities';
import { supabase } from '../supabase';

export interface ToolResult {
  text: string;
  action?: 'OPEN_TICKET' | 'OPEN_TRACKING' | 'VIEW_ORDERS';
  actionData?: any;
}

export async function executeTool(intent: string, entities: Entities): Promise<ToolResult | null> {
  // Tool: Rastreamento Automático
  if (intent === 'rastreamento') {
    if (entities.rastreamento) {
      return {
        text: `Encontrei um código de rastreio na sua mensagem (${entities.rastreamento}). Vou abrir o painel de rastreamento para você acompanhar a entrega em tempo real!`,
        action: 'OPEN_TRACKING',
        actionData: entities.rastreamento
      };
    } else {
      return {
        text: 'Para consultar o rastreamento, você pode me informar o código de rastreio (ex: NN123456789BR) ou acessar diretamente a aba de Pedidos.',
        action: 'VIEW_ORDERS'
      };
    }
  }

  // Tool: Suporte / Garantia
  if (intent === 'suporte' || intent === 'garantia') {
    if (entities.produto) {
      return {
        text: `Entendi que você precisa de suporte referente ao seu ${entities.produto}. Para agilizar o atendimento, vou abrir um Ticket com nossa equipe especializada.`,
        action: 'OPEN_TICKET'
      };
    }
  }

  // Tool: Compras e Preços
  if (intent === 'comprar' || intent === 'pagamento') {
    if (entities.produto) {
      const isGeneric = ['celular', 'smartphone', 'aparelho', 'telefone', 'eletrônico', 'produto'].includes(entities.produto.toLowerCase());
      const searchTerm = `${entities.produto} ${entities.modelo || ''}`.trim();

      // Só busca no banco se tiver modelo especificado ou se a palavra não for totalmente genérica
      if (!isGeneric || entities.modelo) {
        try {
          const { data: grupos } = await supabase
            .from('tabela_precos_grupos')
            .select('*')
            .ilike('nome', `%${searchTerm}%`)
            .limit(3);

          if (grupos && grupos.length > 0) {
            let responseText = `Aqui estão os valores encontrados para "${searchTerm}":\n\n`;
            let hasVariations = false;

            for (const grupo of grupos) {
              const { data: variacoes } = await supabase
                .from('tabela_precos_variacoes')
                .select('*')
                .eq('grupo_id', grupo.id)
                .order('ordem', { ascending: true, nullsFirst: false })
                .order('valor_venda', { ascending: true });

              if (variacoes && variacoes.length > 0) {
                hasVariations = true;
                variacoes.forEach(v => {
                  const formatPrice = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v.valor_venda);
                  const groupNameUpper = grupo.nome.toUpperCase();
                  const varNameUpper = v.nome.toUpperCase();

                  const fullName = varNameUpper.includes(groupNameUpper)
                    ? v.nome
                    : `${grupo.nome} ${v.nome}`;

                  responseText += `${fullName} - ${formatPrice}\n`;
                });
                responseText += '\n';
              }
            }

            if (hasVariations) {
              return {
                text: responseText.trim() + '\n\nEstes são nossos valores atuais de venda! Para fechar a compra, basta adicionar ao carrinho ou falar com nossos especialistas.',
              };
            }
          }
        } catch (err) {
          console.error('Erro ao buscar precos:', err);
        }

        return {
          text: `No momento não encontrei valores definidos para "${searchTerm}" no meu sistema. Você gostaria de verificar outro modelo ou falar com um especialista?`,
        };
      }
    }
  }

  return null;
}
