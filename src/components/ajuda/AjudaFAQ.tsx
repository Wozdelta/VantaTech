import { ChevronDown, Ticket, Package, CreditCard, User, Smartphone, Truck, Star } from 'lucide-react';
import * as Accordion from '@radix-ui/react-accordion';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const FAQ_DATA = [
  {
    categoria: 'Pedidos',
    icon: Package,
    items: [
      { pergunta: 'Como acompanhar meu pedido?', resposta: 'Você pode acompanhar seu pedido na aba "Meus Pedidos" no seu perfil. Lá você encontra o status atualizado em tempo real.' },
      { pergunta: 'Meu pedido está atrasado', resposta: 'Caso seu pedido tenha passado do prazo de entrega, por favor, abra um ticket informando o número do pedido para nossa equipe investigar.' },
      { pergunta: 'Cancelamento', resposta: 'O cancelamento pode ser feito até 24h após a compra, desde que o produto não tenha sido enviado. Acesse seus pedidos e clique em Cancelar.' },
      { pergunta: 'Reembolso', resposta: 'O reembolso é processado na mesma forma de pagamento original em até 7 dias úteis após a aprovação do cancelamento.' },
    ]
  },
  {
    categoria: 'Pagamentos',
    icon: CreditCard,
    items: [
      { pergunta: 'PIX', resposta: 'Pagamentos via PIX são aprovados na hora. O código PIX tem validade de 30 minutos.' },
      { pergunta: 'Cartão', resposta: 'Aceitamos as principais bandeiras. Pagamentos no cartão podem passar por uma análise de segurança que leva até 48h.' },
      { pergunta: 'Parcelamento', resposta: 'Oferecemos parcelamento em até 12x. Consulte as taxas de juros no momento do checkout.' },
      { pergunta: 'Pagamento recusado', resposta: 'Seu pagamento pode ter sido recusado pelo emissor do cartão. Recomendamos contatar seu banco ou tentar outra forma de pagamento.' },
    ]
  },
  {
    categoria: 'Conta',
    icon: User,
    items: [
      { pergunta: 'Alterar senha', resposta: 'Acesse "Meu Perfil" > "Segurança" para redefinir sua senha, ou use a opção "Esqueci minha senha" na tela de login.' },
      { pergunta: 'Alterar endereço', resposta: 'Você pode gerenciar seus endereços na aba "Meu Perfil". O endereço de pedidos já realizados não pode ser alterado.' },
      { pergunta: 'Alterar telefone', resposta: 'Atualize seus dados de contato a qualquer momento acessando a aba "Meu Perfil".' },
    ]
  },
  {
    categoria: 'Produtos',
    icon: Smartphone,
    items: [
      { pergunta: 'Garantia', resposta: 'Todos os nossos aparelhos possuem garantia padrão de 90 dias contra defeitos de fabricação.' },
      { pergunta: 'Estado do aparelho', resposta: 'Trabalhamos com aparelhos Seminovos em condições excelentes e aparelhos Novos lacrados. A condição é descrita na página de cada produto.' },
      { pergunta: 'Acessórios', resposta: 'Aparelhos seminovos não acompanham fone de ouvido ou carregador, a menos que especificado na descrição do produto.' },
    ]
  },
  {
    categoria: 'Encomendas',
    icon: Truck,
    items: [
      { pergunta: 'Como funciona', resposta: 'A encomenda permite reservar aparelhos que não estão no estoque imediato. Nossa equipe fará a importação ou busca com fornecedores.' },
      { pergunta: 'Prazo', resposta: 'O prazo médio para encomendas varia entre 15 e 30 dias úteis, dependendo do modelo solicitado.' },
      { pergunta: 'Pagamento inicial', resposta: 'Para confirmar a encomenda, é necessário um sinal que varia conforme o aparelho. O restante é pago na entrega.' },
      { pergunta: 'Rastreamento', resposta: 'Assim que o fornecedor despachar o aparelho, enviaremos atualizações diretamente pelo sistema ou via WhatsApp.' },
    ]
  },
  {
    categoria: 'VantaClub',
    icon: Star,
    items: [
      { pergunta: 'Como ganhar pontos?', resposta: 'Você ganha VantaCoins ao realizar compras, e principalmente indicando amigos com seu link de afiliado. Quando um amigo compra, os pontos vão para você!' },
      { pergunta: 'Para que servem os pontos?', resposta: 'Seus pontos podem ser trocados por cupons de desconto, brindes e recompensas exclusivas diretamente na aba do VantaClub.' },
      { pergunta: 'Os pontos têm validade?', resposta: 'Atualmente, os VantaCoins não possuem prazo de validade e permanecem na sua conta para sempre.' },
      { pergunta: 'Como subir de nível?', resposta: 'Acumulando pontos, você avança de nível automaticamente. Níveis mais altos desbloqueiam recompensas exclusivas e de maior valor.' },
    ]
  }
];

export default function AjudaFAQ({ onOpenTicket }: { onOpenTicket: () => void }) {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    }
  }, [location.hash]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {FAQ_DATA.map((secao, idx) => {
          const sectionId = secao.categoria.toLowerCase();
          const isTargetSection = location.hash === `#${sectionId}`;
          return (
          <div key={idx} id={sectionId} className={`bg-white dark:bg-gray-800/80 rounded-2xl p-7 shadow-sm border ${isTargetSection ? 'border-vanta-orange shadow-vanta-orange/10 shadow-lg' : 'border-gray-100 dark:border-gray-700/50 hover:shadow-md'} transition-all duration-500`}>
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner border ${isTargetSection ? 'bg-orange-50 dark:bg-vanta-orange/10 text-vanta-orange border-orange-100/50 dark:border-vanta-orange/20' : 'bg-blue-50 dark:bg-vanta-blue/10 text-vanta-blue border-blue-100/50 dark:border-vanta-blue/20'}`}>
                <secao.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                {secao.categoria}
              </h3>
            </div>
            
            <Accordion.Root type="single" collapsible className="w-full" defaultValue={isTargetSection ? `${idx}-0` : undefined}>
              {secao.items.map((item, itemIdx) => (
                <Accordion.Item 
                  key={itemIdx} 
                  value={`${idx}-${itemIdx}`}
                  id={`faq-${idx}-${itemIdx}`}
                  className="border-b border-gray-100 dark:border-gray-700/50 last:border-0 group transition-colors duration-300"
                >
                  <Accordion.Header>
                    <Accordion.Trigger className="w-full flex items-center justify-between py-4 text-left outline-none">
                      <span className="font-semibold text-gray-700 dark:text-gray-300 group-data-[state=open]:text-vanta-blue transition-colors text-[15px]">
                        {item.pergunta}
                      </span>
                      <ChevronDown className="w-5 h-5 text-gray-400 group-data-[state=open]:text-vanta-blue group-data-[state=open]:rotate-180 transition-transform duration-300 ease-[cubic-bezier(0.87,_0,_0.13,_1)]" />
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Content className="overflow-hidden text-sm data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp">
                    <div className="pb-4 pt-1 text-gray-500 dark:text-gray-400 leading-relaxed pr-6">
                      {item.resposta}
                    </div>
                  </Accordion.Content>
                </Accordion.Item>
              ))}
            </Accordion.Root>
          </div>
        )})}
      </div>

      {/* Banner de Ajuda Extra */}
      <div className="bg-gradient-to-r from-vanta-blue to-blue-600 rounded-3xl p-8 md:p-12 shadow-xl text-center text-white flex flex-col items-center justify-center space-y-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="relative z-10 space-y-2">
          <h3 className="text-2xl md:text-3xl font-black">Ainda precisa de ajuda?</h3>
          <p className="text-blue-100 font-medium max-w-md mx-auto">
            Nossa equipe de especialistas está pronta para analisar seu caso e oferecer a melhor solução.
          </p>
        </div>
        <button 
          onClick={onOpenTicket}
          className="relative z-10 bg-white text-vanta-blue px-8 py-3.5 rounded-xl font-black hover:bg-gray-50 transition-colors shadow-lg flex items-center gap-2"
        >
          <Ticket className="w-5 h-5" />
          Abrir Ticket de Suporte
        </button>
      </div>
    </div>
  );
}
