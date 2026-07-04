import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAlert } from '../../contexts/AlertContext';
import { Send, Loader2, FileUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function AjudaTicketForm({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [pedidos, setPedidos] = useState<{id: string, code: string}[]>([]);

  const [formData, setFormData] = useState({
    assunto: '',
    categoria: '',
    pedido_id: '',
    descricao: ''
  });

  useEffect(() => {
    if (user) {
      supabase.from('pedidos')
        .select('id, numero')
        .eq('user_id', user.id)
        .order('criado_em', { ascending: false })
        .then(({ data }) => {
          if (data) {
            setPedidos(data.map(p => ({ id: p.id, code: String(p.numero) })));
          }
        });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showAlert({ type: 'warning', message: 'Você precisa estar logado para abrir um ticket.' });
      return;
    }

    if (!formData.assunto || !formData.categoria || !formData.descricao) {
      showAlert({ type: 'warning', message: 'Preencha todos os campos obrigatórios.' });
      return;
    }

    setLoading(true);
    try {
      // Cria o ticket
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .insert({
          user_id: user.id,
          assunto: formData.assunto,
          categoria: formData.categoria,
          descricao: formData.descricao,
          pedido_id: formData.pedido_id || null,
          status: 'Aberto'
        })
        .select()
        .single();

      if (ticketError) {
        if (ticketError.message.includes('relation "public.tickets" does not exist')) {
          showAlert({ type: 'error', message: 'Erro: As tabelas de suporte ainda não foram criadas no banco de dados. Execute o SQL!' });
          return;
        }
        throw ticketError;
      }

      // Adiciona a primeira mensagem automaticamente (a descrição do usuário)
      if (ticket) {
        await supabase.from('ticket_messages').insert({
          ticket_id: ticket.id,
          sender_id: user.id,
          conteudo: formData.descricao,
          is_admin: false
        });

        // Tentar enviar notificação para os admins
        const { data: admins } = await supabase.from('perfis').select('id').eq('cargo', 'Admin');
        if (admins && admins.length > 0) {
          await supabase.from('notificacoes').insert(
            admins.map(admin => ({
              usuario_id: admin.id,
              titulo: 'Novo Ticket Criado',
              mensagem: `Assunto: ${formData.assunto}`,
              lida: false
            }))
          );
        }
      }

      showAlert({ type: 'success', message: 'Ticket aberto com sucesso! Nossa equipe responderá em breve.' });
      onSuccess();
    } catch (err) {
      console.error(err);
      showAlert({ type: 'error', message: 'Erro ao abrir ticket. Tente novamente mais tarde.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white">Abrir Novo Chamado</h2>
        <p className="text-gray-500 mt-2 text-sm">Preencha os dados abaixo com o máximo de detalhes possível.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Categoria *</label>
            <select
              value={formData.categoria}
              onChange={e => setFormData({ ...formData, categoria: e.target.value })}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-vanta-blue dark:text-white transition-all"
            >
              <option value="">Selecione uma categoria...</option>
              <option value="Pedido">Pedido ou Entrega</option>
              <option value="Pagamento">Pagamento ou Reembolso</option>
              <option value="Produto">Dúvida sobre Produto</option>
              <option value="Garantia">Acionar Garantia</option>
              <option value="Conta">Problema na Conta</option>
              <option value="Outro">Outro assunto</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Número do Pedido (Opcional)</label>
            <select
              value={formData.pedido_id}
              onChange={e => setFormData({ ...formData, pedido_id: e.target.value })}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-vanta-blue dark:text-white transition-all"
            >
              <option value="">Selecione um pedido...</option>
              {pedidos.map(p => (
                <option key={p.id} value={p.id}>Pedido #{p.code}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Assunto *</label>
          <input
            type="text"
            value={formData.assunto}
            onChange={e => setFormData({ ...formData, assunto: e.target.value })}
            placeholder="Resumo do seu problema"
            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-vanta-blue dark:text-white transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Descrição detalhada *</label>
          <textarea
            value={formData.descricao}
            onChange={e => setFormData({ ...formData, descricao: e.target.value })}
            placeholder="Descreva seu problema com o máximo de detalhes possível..."
            rows={5}
            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-vanta-blue dark:text-white transition-all resize-none"
          ></textarea>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-8 py-3 bg-vanta-blue text-white rounded-xl font-bold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            Enviar Ticket
          </button>
        </div>
      </form>
    </div>
  );
}
