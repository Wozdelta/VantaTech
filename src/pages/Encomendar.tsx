import { useState, useEffect } from 'react';
import { Smartphone, Plus, PackageSearch, ShieldCheck, Check, Loader2, FileText, X, MessageCircle, Package } from 'lucide-react';
import BlockScreen from '../components/common/BlockScreen';
import EncomendaChat from '../components/encomendas/EncomendaChat';
import TrackingModal from '../components/encomendas/TrackingModal';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { supabase } from '../lib/supabase';
import { useAlert } from '../contexts/AlertContext';
import { Navigate } from 'react-router-dom';

const TermsText = () => (
  <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 space-y-4 text-justify">
    <h3 className="font-bold text-gray-900 dark:text-white">TERMOS E CONDIÇÕES DE ENCOMENDA DE APARELHOS - VANTATECH</h3>
    <p>Ao solicitar a encomenda de um dispositivo através do site VantaTech, o cliente declara ter lido, compreendido e concordado expressamente com as regras descritas abaixo, que regem a prestação do serviço de busca e encomenda de aparelhos eletrônicos.</p>

    <h4 className="font-bold text-gray-900 dark:text-white mt-6">1. OBJETO DA ENCOMENDA</h4>
    <p>Este termo rege a prestação de serviço de busca e/ou encomenda de aparelhos celulares seminovos ou usados, conforme o modelo e especificações expressamente solicitadas pelo cliente por meio da plataforma ou canais oficiais de atendimento da VantaTech.</p>

    <h4 className="font-bold text-gray-900 dark:text-white mt-6">2. SINAL (ARRAS) E CONFIRMAÇÃO DO PEDIDO</h4>
    <p>Para que a encomenda seja efetivada e o aparelho seja adquirido junto aos nossos fornecedores, é obrigatório o pagamento de um sinal financeiro ("arras") equivalente a 10% (dez por cento) do valor total negociado para o dispositivo. O processamento do pedido e a contagem dos prazos iniciarão exclusivamente após a compensação deste pagamento.</p>

    <h4 className="font-bold text-gray-900 dark:text-white mt-6">3. PRAZO DE ENTREGA E RASTREAMENTO</h4>
    <p>O prazo máximo estipulado para a chegada do aparelho à central da VantaTech é de 60 (sessenta) dias corridos, contados a partir da data de confirmação do pagamento do sinal. A VantaTech compromete-se a vincular o pedido do cliente a um código de rastreamento (via Correios ou transportadora parceira), permitindo o acompanhamento da entrega através do nosso site.</p>

    <h4 className="font-bold text-gray-900 dark:text-white mt-6">4. CANCELAMENTO DURANTE O PERÍODO DE ENCOMENDA (MULTA RESCISÓRIA)</h4>
    <p>Caso o cliente decida cancelar a encomenda antes do término do prazo estipulado na Cláusula 3 (ou seja, enquanto o aparelho ainda estiver em trânsito ou em processo de logística para a VantaTech), a VantaTech realizará a devolução do valor pago a título de sinal, deduzida uma multa rescisória compensatória.</p>
    <p><strong>4.1.</strong> A referida multa rescisória será equivalente a 5% (cinco por cento) sobre o valor do sinal pago, e tem a finalidade de cobrir despesas operacionais e logísticas decorrentes da importação/transporte frustrado.</p>
    <p><strong>4.2.</strong> O valor remanescente do sinal (subtraída a multa de 5% sobre ele) será estornado ao cliente no prazo de até 5 (cinco) dias úteis após a solicitação de cancelamento.</p>

    <h4 className="font-bold text-gray-900 dark:text-white mt-6">5. CONCLUSÃO OU DESISTÊNCIA APÓS A CHEGADA DO APARELHO</h4>
    <p>Assim que o aparelho encomendado for recebido pela VantaTech e estiver devidamente testado e liberado para entrega, o cliente será notificado, cabendo-lhe optar por uma das duas alternativas abaixo:</p>
    <p><strong>5.1. Conclusão da Compra:</strong> O montante de 10% inicialmente dado como sinal será integralmente utilizado para abater o valor total do aparelho, restando ao cliente realizar apenas o pagamento do saldo de 90% para a retirada ou envio definitivo do dispositivo.</p>
    <p><strong>5.2. Desistência da Compra:</strong> Caso o cliente mude de ideia e não queira mais adquirir o aparelho após a efetiva chegada do mesmo à central da VantaTech, a compra será desfeita. Neste caso, o valor integral pago a título de sinal (10%) será integralmente devolvido ao cliente, sem incidência de qualquer multa, no prazo de até 5 (cinco) dias úteis.</p>

    <h4 className="font-bold text-gray-900 dark:text-white mt-6">6. DO ACEITE ELETRÔNICO</h4>
    <p>A marcação de ciência e concordância nos formulários do site, a geração do pedido e o posterior pagamento do sinal de 10% configuram o aceite expresso, inequívoco e irrestrito do cliente em relação a todas as cláusulas aqui descritas, possuindo força e plena validade jurídica de contrato firmado entre as partes.</p>
  </div>
);

export default function Encomendar() {
  const { user, perfil, refreshPerfil, loading: authLoading } = useAuth();
  const { settings } = useSettings();
  const { showAlert } = useAlert();

  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showNovaEncomenda, setShowNovaEncomenda] = useState(false);
  const [encomendas, setEncomendas] = useState<any[]>([]);
  const [loadingEncomendas, setLoadingEncomendas] = useState(true);
  const [activeChat, setActiveChat] = useState<any | null>(null);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    marca: '',
    modelo: '',
    cor: '',
    armazenamento: '',
    estado: 'Seminovo'
  });

  useEffect(() => {
    if (!user) return;
    fetchEncomendas();
  }, [user]);

  const fetchEncomendas = async () => {
    try {
      const { data, error } = await supabase
        .from('encomendas_pedidos')
        .select('*')
        .eq('user_id', user.id)
        .order('criado_em', { ascending: false });

      if (!error && data) {
        setEncomendas(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEncomendas(false);
    }
  };

  const handleSubmitEncomenda = async () => {
    if (!formData.marca || !formData.modelo) {
      showAlert({ type: 'warning', message: 'Preencha a marca e o modelo do aparelho desejado.' });
      return;
    }

    setSubmitting(true);
    try {
      // Cria a encomenda no BD
      const { data: pedidoData, error: pedidoError } = await supabase
        .from('encomendas_pedidos')
        .insert([{
          user_id: user.id,
          marca: formData.marca,
          modelo: formData.modelo,
          cor: formData.cor,
          armazenamento: formData.armazenamento,
          estado: formData.estado,
          status: 'Pendente'
        }])
        .select()
        .single();

      if (pedidoError) throw pedidoError;

      const text = `*NOVA ENCOMENDA - VANTATECH*\n\n` +
        `*Marca:* ${formData.marca}\n` +
        `*Aparelho:* ${formData.modelo}\n` +
        `*Cor:* ${formData.cor || 'Não especificada'}\n` +
        `*Armazenamento:* ${formData.armazenamento || 'Não especificado'}\n` +
        `*Estado:* ${formData.estado}\n\n` +
        `Estou ciente de que o prazo de busca e entrega é de até 3 meses e que o pedido só é confirmado mediante o pagamento do sinal de 10%. Aguardo o orçamento!`;

      // Salva a mensagem inicial
      await supabase
        .from('encomendas_mensagens')
        .insert([{
          encomenda_id: pedidoData.id,
          user_id: user.id,
          mensagem: text
        }]);

      showAlert({ type: 'success', message: 'Encomenda enviada com sucesso!' });
      setShowNovaEncomenda(false);
      setFormData({ marca: '', modelo: '', cor: '', armazenamento: '', estado: 'Seminovo' });
      fetchEncomendas();
      setActiveChat(pedidoData);
    } catch (err) {
      console.error(err);
      showAlert({ type: 'error', message: 'Erro ao criar encomenda.' });
    } finally {
      setSubmitting(false);
    }
  };

  const showEncomendas = settings?.acesso_encomendas === 'todos' || perfil?.cargo === 'Admin';

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-vanta-blue" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!showEncomendas) {
    return <BlockScreen />;
  }

  const handleAcceptTerms = async () => {
    if (!accepted) {
      showAlert({ type: 'error', message: 'Você precisa marcar a caixa de seleção para aceitar os termos.' });
      return;
    }

    setLoading(true);
    try {
      // Obter IP do usuário
      const res = await fetch('https://api.ipify.org?format=json');
      const data = await res.json();
      const ip = data.ip;

      const { error } = await supabase
        .from('perfis')
        .update({
          termos_encomenda_aceitos: true,
          termos_encomenda_ip: ip,
          termos_encomenda_data: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      showAlert({ type: 'success', message: 'Termos aceitos com sucesso! Agora você pode encomendar aparelhos.' });
      await refreshPerfil(); // Atualiza o perfil localmente para remover a tela de termos
    } catch (err: any) {
      console.error('Erro ao aceitar termos:', err);
      showAlert({ type: 'error', message: 'Erro ao processar sua solicitação. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  // Tela de Termos caso o usuário não tenha aceito
  if (perfil && !perfil.termos_encomenda_aceitos) {
    return (
      <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 pt-6 lg:pt-24 pb-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-8 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-vanta-blue/10 rounded-2xl flex items-center justify-center mb-4">
                <ShieldCheck className="w-8 h-8 text-vanta-blue" />
              </div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white">
                Termos e Condições
              </h1>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Para solicitar encomendas personalizadas, leia atentamente e aceite nossas regras de serviço.
              </p>
            </div>

            <div className="p-8 h-[400px] overflow-y-auto custom-scrollbar border-b border-gray-100 dark:border-gray-700">
              <TermsText />
            </div>

            <div className="p-8 bg-gray-50/50 dark:bg-gray-800/50">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center mt-1">
                  <input
                    type="checkbox"
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className={`w-5 h-5 rounded border ${accepted ? 'bg-vanta-blue border-vanta-blue' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 group-hover:border-vanta-blue'} transition-colors flex items-center justify-center`}>
                    <Check className={`w-3.5 h-3.5 text-white transition-transform ${accepted ? 'scale-100' : 'scale-0'}`} strokeWidth={3} />
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 select-none">
                  Li, compreendi e concordo integralmente com os Termos e Condições de Encomenda de Aparelhos descritos acima.
                </span>
              </label>

              <button
                onClick={handleAcceptTerms}
                disabled={!accepted || loading}
                className="w-full mt-6 py-3 bg-vanta-blue text-white font-bold rounded-xl hover:bg-vanta-darkblue transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Aceitar e Continuar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Tela principal (já aceitou os termos)
  return (
    <>
      <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 pt-6 lg:pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                <Smartphone className="w-8 h-8 text-vanta-blue" />
                Encomendar Aparelho
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Não encontrou o que procurava? Faça uma encomenda personalizada e nós encontramos para você!
              </p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => setShowTermsModal(true)}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all whitespace-nowrap shadow-sm hover:shadow"
                title="Ler Termos de Encomenda novamente"
              >
                <FileText className="w-5 h-5" />
                <span className="hidden sm:inline">Termos</span>
              </button>

              <button
                onClick={() => setShowNovaEncomenda(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-vanta-blue text-white font-bold rounded-xl hover:bg-vanta-darkblue hover:shadow-lg hover:-translate-y-0.5 transition-all w-full md:w-auto whitespace-nowrap"
              >
                <Plus className="w-5 h-5" />
                Nova Encomenda
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-12 shadow-sm border border-gray-100 dark:border-gray-700 min-h-[400px]">
            {loadingEncomendas ? (
              <div className="flex flex-col items-center justify-center h-full pt-10">
                <Loader2 className="w-10 h-10 text-vanta-blue animate-spin mb-4" />
                <p className="text-gray-500">Carregando suas encomendas...</p>
              </div>
            ) : encomendas.length === 0 ? (
              <div className="text-center flex flex-col items-center justify-center pt-10">
                <div className="w-24 h-24 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <PackageSearch className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Nenhuma encomenda em andamento
                </h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  Clique no botão "Nova Encomenda" acima para solicitar um aparelho específico. Nossa equipe entrará em contato com as melhores opções do mercado.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {encomendas.map(enc => (
                  <div
                    key={enc.id}
                    onClick={() => setActiveChat(enc)}
                    className="p-5 border border-gray-100 dark:border-gray-700 rounded-2xl hover:border-vanta-blue/50 hover:shadow-md cursor-pointer transition-all bg-gray-50/50 dark:bg-gray-900/50 group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="text-xs font-bold text-gray-400 mb-1">{new Date(enc.criado_em).toLocaleDateString('pt-BR')}</div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">{enc.marca} {enc.modelo}</h3>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${enc.status === 'Concluído' ? 'bg-green-100 text-green-700' :
                          enc.status === 'Em Andamento' ? 'bg-blue-100 text-blue-700' :
                            enc.status === 'Cancelado' ? 'bg-red-100 text-red-700' :
                              'bg-orange-100 text-orange-700'
                        }`}>
                        {enc.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-4 mb-4">
                      <span>Cor: {enc.cor || 'N/A'}</span>
                      <span>Armazenamento: {enc.armazenamento || 'N/A'}</span>
                    </div>
                    <div className="flex flex-col gap-2 mt-auto pt-2">
                      {enc.codigo_rastreio && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setTrackingCode(enc.codigo_rastreio);
                          }}
                          className="w-full py-2 bg-vanta-orange/10 text-vanta-orange border border-vanta-orange/20 rounded-xl font-bold text-sm hover:bg-vanta-orange hover:text-white transition-colors flex items-center justify-center gap-2"
                        >
                          <Package className="w-4 h-4" />
                          Rastrear ({enc.codigo_rastreio})
                        </button>
                      )}
                      <button className="w-full py-2 bg-white dark:bg-gray-800 text-vanta-blue border border-vanta-blue/20 rounded-xl font-bold text-sm group-hover:bg-vanta-blue group-hover:text-white transition-colors flex items-center justify-center gap-2">
                        <MessageCircle className="w-4 h-4" />
                        Abrir Chat
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Termos */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowTermsModal(false)}
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-vanta-blue" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Termos de Encomenda</h2>
              </div>
              <button
                onClick={() => setShowTermsModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <TermsText />
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 rounded-b-2xl">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Você já aceitou estes termos em {perfil?.termos_encomenda_data ? new Date(perfil.termos_encomenda_data).toLocaleString('pt-BR') : 'data desconhecida'}.
              </p>
              <button
                onClick={() => setShowTermsModal(false)}
                className="w-full mt-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Nova Encomenda */}
      {showNovaEncomenda && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowNovaEncomenda(false)}
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-3xl w-full max-w-xl flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 shrink-0">
              <div className="flex items-center gap-3">
                <PackageSearch className="w-6 h-6 text-vanta-blue" />
                <h2 className="text-xl font-black text-gray-900 dark:text-white">Detalhes da Encomenda</h2>
              </div>
              <button
                onClick={() => setShowNovaEncomenda(false)}
                className="p-2 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full shadow-sm transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Marca *</label>
                  <input
                    type="text"
                    value={formData.marca}
                    onChange={e => setFormData({ ...formData, marca: e.target.value })}
                    placeholder="Ex: Apple, Samsung"
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-vanta-blue transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Aparelho *</label>
                  <input
                    type="text"
                    value={formData.modelo}
                    onChange={e => setFormData({ ...formData, modelo: e.target.value })}
                    placeholder="Ex: iPhone 15 Pro Max"
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-vanta-blue transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Cor (Opcional)</label>
                  <input
                    type="text"
                    value={formData.cor}
                    onChange={e => setFormData({ ...formData, cor: e.target.value })}
                    placeholder="Ex: Titânio Natural"
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-vanta-blue transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Armazenamento (Opcional)</label>
                  <input
                    type="text"
                    value={formData.armazenamento}
                    onChange={e => setFormData({ ...formData, armazenamento: e.target.value })}
                    placeholder="Ex: 256GB"
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-vanta-blue transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">Estado do Aparelho *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, estado: 'Seminovo' })}
                    className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all ${formData.estado === 'Seminovo'
                        ? 'bg-vanta-blue/10 border-vanta-blue text-vanta-blue shadow-sm'
                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                  >
                    Seminovo
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, estado: 'Novo' })}
                    className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all ${formData.estado === 'Novo'
                        ? 'bg-vanta-blue/10 border-vanta-blue text-vanta-blue shadow-sm'
                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                  >
                    Novo (Lacrado)
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 bg-blue-50/50 dark:bg-blue-900/10 border-t border-gray-100 dark:border-gray-700 shrink-0">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 text-vanta-blue" />
                </div>
                <p className="text-sm text-blue-900 dark:text-blue-100 font-medium leading-snug">
                  O prazo para localização e entrega do aparelho é de <span className="font-bold">até 3 meses</span>. A encomenda só é iniciada mediante o pagamento do sinal de <span className="font-bold">10% do valor orçado</span>.
                </p>
              </div>
            </div>

            <div className="p-6 pt-0 bg-blue-50/50 dark:bg-blue-900/10 shrink-0">
              <button
                onClick={handleSubmitEncomenda}
                disabled={submitting}
                className="w-full py-4 bg-vanta-blue hover:bg-vanta-darkblue text-white font-bold rounded-xl transition-all shadow-[0_10px_20px_rgba(11,46,243,0.2)] hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <MessageCircle className="w-5 h-5" />
                    Enviar e Abrir Chat
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal de Chat */}
      {activeChat && (
        <EncomendaChat
          encomenda={activeChat}
          onClose={() => setActiveChat(null)}
        />
      )}

      {/* Modal de Rastreio */}
      {trackingCode && (
        <TrackingModal
          codigo={trackingCode}
          onClose={() => setTrackingCode(null)}
        />
      )}
    </>
  );
}
