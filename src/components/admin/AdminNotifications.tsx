import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAlert } from '../../contexts/AlertContext';
import { Send, Loader2, BellRing, CheckCircle2 } from 'lucide-react';

export default function AdminNotifications() {
  const { showAlert } = useAlert();
  const [titulo, setTitulo] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSendNotification(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo || !mensagem) return;

    if (!window.confirm('Tem certeza que deseja enviar esta notificação para TODOS os usuários cadastrados?')) {
      return;
    }

    setSending(true);
    setSuccess(false);

    try {
      // 1. Buscar todos os IDs de usuários
      const { data: perfis, error: perfisError } = await supabase
        .from('perfis')
        .select('id');

      if (perfisError) throw perfisError;

      if (!perfis || perfis.length === 0) {
        showAlert({ title: 'Atenção', message: 'Nenhum usuário encontrado para notificar.', type: 'warning' });
        setSending(false);
        return;
      }

      // 2. Montar array de notificações (uma para cada usuário)
      const notificacoes = perfis.map((perfil) => ({
        usuario_id: perfil.id,
        titulo: titulo,
        mensagem: mensagem,
        lida: false
      }));

      // 3. Inserir todas de uma vez (Bulk Insert)
      const { error: insertError } = await supabase
        .from('notificacoes')
        .insert(notificacoes);

      if (insertError) throw insertError;

      setSuccess(true);
      setTitulo('');
      setMensagem('');
      showAlert({ title: 'Sucesso', message: 'Notificações enviadas com sucesso para todos os usuários!', type: 'success' });
      
      // Remove a mensagem de sucesso após 5 segundos
      setTimeout(() => setSuccess(false), 5000);

    } catch (error) {
      console.error('Erro ao enviar notificações:', error);
      showAlert({ title: 'Erro', message: 'Ocorreu um erro ao enviar as notificações.', type: 'error' });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-soft rounded-xl p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-vanta-blue/10 flex items-center justify-center">
          <BellRing className="w-5 h-5 text-vanta-blue" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Notificar Usuários</h2>
          <p className="text-sm text-gray-500">Envie um alerta, aviso ou promoção para todos os clientes.</p>
        </div>
      </div>

      <form onSubmit={handleSendNotification} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Título da Notificação
          </label>
          <input 
            required 
            type="text" 
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            maxLength={50}
            className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-3 outline-none focus:border-vanta-blue text-gray-900 dark:text-white" 
            placeholder="Ex: Mega Promoção de iPhones!" 
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Mensagem (Detalhes)
          </label>
          <textarea 
            required 
            rows={4}
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            maxLength={150}
            className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-3 outline-none focus:border-vanta-blue resize-none text-gray-900 dark:text-white" 
            placeholder="Ex: Aproveite nossos descontos de até 30% em toda a linha Apple. Válido até amanhã!" 
          />
          <div className="text-right mt-1 text-xs text-gray-500">
            {mensagem.length}/150 caracteres
          </div>
        </div>

        {success && (
          <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 p-4 rounded-lg flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5" />
            <p className="text-sm font-medium">Notificações enviadas com sucesso para todos os usuários!</p>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
          <button 
            type="submit" 
            disabled={sending || !titulo || !mensagem} 
            className="px-6 py-3 rounded-lg bg-vanta-blue text-white font-bold hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2 transition-colors shadow-sm"
          >
            {sending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> 
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" /> 
                Disparar para Todos
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
