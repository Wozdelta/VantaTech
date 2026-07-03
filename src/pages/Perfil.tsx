import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Shield, MapPin, Loader2, Check, Camera, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAlert } from '../contexts/AlertContext';
import { useSettings } from '../contexts/SettingsContext';
import BlockScreen from '../components/common/BlockScreen';

export default function Perfil() {
  const { user, perfil, refreshPerfil, loading } = useAuth();
  const { showAlert } = useAlert();
  const { settings } = useSettings();
  const [searchParams, setSearchParams] = useSearchParams();
  const userName = perfil?.nome_completo || user?.user_metadata?.nome_completo || user?.user_metadata?.full_name || user?.user_metadata?.name || 'Usuário';
  const userAvatar = perfil?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  const showPerfil = settings?.acesso_perfil === 'todos' || perfil?.cargo === 'Admin';

  // Estados de endereço
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [saving, setSaving] = useState(false);

  // Estados de perfil (nome e foto)
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(userName);
  const [editAvatar, setEditAvatar] = useState(userAvatar);
  const [savingProfile, setSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mensagens
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [endereco, setEndereco] = useState({
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: ''
  });

  // Atualiza os inputs quando os dados carregam
  useEffect(() => {
    if (perfil) {
      setEndereco({
        cep: perfil.cep || '',
        rua: perfil.rua || '',
        numero: perfil.numero || '',
        complemento: perfil.complemento || '',
        bairro: perfil.bairro || '',
        cidade: perfil.cidade || '',
        estado: perfil.estado || ''
      });
      setEditName(perfil.nome_completo || userName);
      setEditAvatar(perfil.avatar_url || userAvatar);
    }
  }, [perfil, userName, userAvatar]);

  // Flag para evitar race condition
  const isProcessingRef = useRef(false);

  // Processa o retorno do pagamento da InfinitePay
  useEffect(() => {
    const orderNsu = searchParams.get('order_nsu');
    const slug = searchParams.get('slug');

    if (orderNsu && slug && !isProcessingRef.current) {
      isProcessingRef.current = true;
      
      const confirmPayment = async () => {
        try {
          // 1. Verifica se a encomenda já foi atualizada antes
          const { data: orderData } = await supabase
            .from('encomendas_pedidos')
            .select('status')
            .eq('id', orderNsu)
            .single();

          if (orderData?.status === 'Em Andamento' || orderData?.status === 'Concluído') {
            // Já foi processado antes, apenas limpa a URL e sai
            setSearchParams({});
            return;
          }

          // 2. Atualiza o status da encomenda para Em Andamento
          const { error } = await supabase
            .from('encomendas_pedidos')
            .update({ status: 'Em Andamento' })
            .eq('id', orderNsu);

          if (!error) {
            showAlert({ type: 'success', message: 'Pagamento recebido! O status da encomenda foi atualizado.' });

            // Buscar ID do Admin para enviar a mensagem automática
            const { data: adminData } = await supabase
              .from('perfis')
              .select('id')
              .eq('cargo', 'Admin')
              .limit(1)
              .single();

            if (adminData) {
              // 3. Verifica se a mensagem já existe (proteção extra contra o React StrictMode disparar duas vezes rápido)
              const { data: existingMsg } = await supabase
                .from('encomendas_mensagens')
                .select('id')
                .eq('encomenda_id', orderNsu)
                .ilike('mensagem', 'Agora que o pagamento foi aprovado%')
                .limit(1)
                .maybeSingle();

              if (!existingMsg) {
                await supabase.from('encomendas_mensagens').insert([{
                  encomenda_id: orderNsu,
                  user_id: adminData.id,
                  mensagem: "Agora que o pagamento foi aprovado, o código de rastreio será liberado em até 10 dias e você pode localizar seu pedido na mesma aba 'Encomendar Produto'.\n\nEsse chat será deletado em 3 horas. Você tem mais alguma dúvida?"
                }]);
              }
            }
          }
          
          // Limpa a URL para evitar atualizações repetidas
          setSearchParams({});
        } catch (err) {
          console.error('Erro ao atualizar status do pagamento:', err);
        } finally {
          // Permite processar novamente se a URL mudar no futuro (embora a gente limpe a URL, então não vai)
          setTimeout(() => {
            isProcessingRef.current = false;
          }, 2000);
        }
      };
      
      confirmPayment();
    }
  }, [searchParams, setSearchParams, showAlert]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // ----- FUNÇÕES DE PERFIL (NOME E FOTO) -----

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Verifica tamanho (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setErrorMsg('A imagem deve ter no máximo 2MB.');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditAvatar(reader.result as string);
        setIsEditingProfile(true); // Ativa o modo de edição para mostrar o botão salvar
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    setErrorMsg('');
    
    try {
      const { error } = await supabase
        .from('perfis')
        .update({
          nome_completo: editName,
          avatar_url: editAvatar
        })
        .eq('id', user.id);

      if (error) throw error;

      showSuccess('Perfil atualizado com sucesso!');
      setIsEditingProfile(false);
      await refreshPerfil();
      
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao atualizar perfil.');
    } finally {
      setSavingProfile(false);
    }
  };

  const cancelProfileEdit = () => {
    setEditName(userName);
    setEditAvatar(userAvatar);
    setIsEditingProfile(false);
    setErrorMsg('');
  };

  // ----- FUNÇÕES DE ENDEREÇO -----

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let cep = e.target.value.replace(/\D/g, ''); 
    if (cep.length > 8) cep = cep.slice(0, 8);
    
    setEndereco(prev => ({ ...prev, cep }));

    if (cep.length === 8) {
      setLoadingAddress(true);
      setErrorMsg('');
      try {
        const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`);
        if (!response.ok) throw new Error('CEP não encontrado');
        
        const data = await response.json();
        
        setEndereco(prev => ({
          ...prev,
          rua: data.street || '',
          bairro: data.neighborhood || '',
          cidade: data.city || '',
          estado: data.state || ''
        }));
      } catch (err) {
        setErrorMsg('CEP inválido ou não encontrado.');
      } finally {
        setLoadingAddress(false);
      }
    }
  };

  const handleDeleteAddress = async () => {
    if (!user) return;
    
    const confirmed = await showAlert({
      title: 'Atenção',
      message: 'Tem certeza que deseja apagar seu endereço?',
      type: 'warning',
      showConfirm: true
    });
    
    if (!confirmed) return;

    setSaving(true);
    setErrorMsg('');

    try {
      const { error } = await supabase
        .from('perfis')
        .update({
          cep: null,
          rua: null,
          numero: null,
          complemento: null,
          bairro: null,
          cidade: null,
          estado: null
        })
        .eq('id', user.id);

      if (error) throw error;
      
      setEndereco({ cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' });
      await refreshPerfil();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao apagar endereço.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSaving(true);
    setErrorMsg('');

    try {
      const { error } = await supabase
        .from('perfis')
        .update({
          cep: endereco.cep,
          rua: endereco.rua,
          numero: endereco.numero,
          complemento: endereco.complemento,
          bairro: endereco.bairro,
          cidade: endereco.cidade,
          estado: endereco.estado
        })
        .eq('id', user.id);

      if (error) throw error;

      showSuccess('Endereço salvo com sucesso!');
      setIsEditingAddress(false);
      await refreshPerfil();
      
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar o endereço.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-gray-500">Você precisa estar logado para ver esta página.</p>
      </div>
    );
  }

  const hasAddress = Boolean(perfil?.cep && perfil?.rua && perfil?.numero);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Configurar Perfil</h1>
      
      {successMsg && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium rounded-xl flex items-center shadow-sm">
          <Check className="w-5 h-5 mr-3" />
          {successMsg}
        </div>
      )}
      
      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium rounded-xl shadow-sm">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Coluna da Foto */}
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-soft text-center">
            <div className="relative inline-block mb-4">
              <div className="w-32 h-32 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto overflow-hidden border-4 border-white dark:border-gray-800 shadow-md">
                {editAvatar ? (
                  <img src={editAvatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-16 h-16 text-gray-400" />
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-2 w-10 h-10 bg-vanta-blue text-white rounded-full flex items-center justify-center hover:bg-vanta-darkblue transition-colors shadow-lg border-2 border-white dark:border-gray-800"
                title="Mudar foto"
              >
                <Camera className="w-5 h-5" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/jpeg,image/png,image/webp" 
                onChange={handleImageUpload}
              />
            </div>
            
            {!isEditingProfile ? (
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1 px-2 break-words" title={userName}>{userName}</h2>
            ) : (
              <div className="text-sm text-vanta-orange font-medium mb-1">Editando perfil...</div>
            )}
            
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{perfil?.cargo || 'Cliente'}</p>
          </div>
        </div>
        
        {/* Coluna dos Formulários */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Dados da Conta */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                <Shield className="w-5 h-5 mr-2 text-vanta-blue" />
                Dados da Conta
              </h3>
              {!isEditingProfile && (
                <button 
                  onClick={() => setIsEditingProfile(true)}
                  className="text-sm font-medium text-vanta-blue hover:text-vanta-darkblue transition-colors flex items-center"
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  Editar
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Completo</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  readOnly={!isEditingProfile}
                  className={`w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border rounded-lg text-gray-900 dark:text-white outline-none transition-all ${
                    isEditingProfile 
                    ? 'border-gray-300 dark:border-gray-600 focus:border-vanta-blue focus:ring-2 focus:ring-vanta-blue/20' 
                    : 'border-transparent text-gray-600 dark:text-gray-400 cursor-not-allowed'
                  }`} 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-mail <span className="text-gray-400 font-normal">(Não editável)</span></label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="email" value={user.email || ''} readOnly className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-transparent rounded-lg text-gray-500 cursor-not-allowed" />
                </div>
              </div>

              {isEditingProfile && (
                <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700 mt-4">
                  <button 
                    onClick={handleSaveProfile}
                    disabled={savingProfile || !editName.trim()}
                    className="flex-1 py-2.5 bg-vanta-blue text-white text-sm font-bold rounded-lg hover:bg-vanta-darkblue transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {savingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar Alterações'}
                  </button>
                  <button 
                    onClick={cancelProfileEdit}
                    disabled={savingProfile}
                    className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-bold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Endereço de Entrega */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-vanta-orange" />
                Endereço de Entrega
              </h3>
              {hasAddress && !isEditingAddress && (
                <div className="flex gap-4 items-center">
                  <button 
                    onClick={() => setIsEditingAddress(true)}
                    className="text-sm font-medium text-vanta-blue hover:text-vanta-darkblue transition-colors flex items-center"
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Editar
                  </button>
                  <button 
                    onClick={handleDeleteAddress}
                    className="text-sm font-medium text-red-500 hover:text-red-700 transition-colors flex items-center"
                    disabled={saving}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Apagar
                  </button>
                </div>
              )}
            </div>

            {!isEditingAddress ? (
              hasAddress ? (
                <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-xl border border-gray-100 dark:border-gray-700 transition-all hover:border-vanta-orange/30">
                  <div className="flex items-start">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5 mr-3 shrink-0" />
                    <div>
                      <p className="text-gray-900 dark:text-white font-medium text-base">{perfil?.rua}, {perfil?.numero}</p>
                      {perfil?.complemento && <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{perfil?.complemento}</p>}
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{perfil?.bairro}</p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">{perfil?.cidade} - {perfil?.estado}</p>
                      <p className="text-gray-500 dark:text-gray-500 text-sm mt-2 font-mono bg-gray-200 dark:bg-gray-800 inline-block px-2 py-0.5 rounded">CEP: {perfil?.cep?.replace(/^(\d{5})(\d{3})$/, '$1-$2')}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                  <MapPin className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Nenhum endereço cadastrado ainda.</p>
                  <button 
                    onClick={() => setIsEditingAddress(true)}
                    className="px-6 py-2.5 bg-vanta-blue text-white text-sm font-bold rounded-lg hover:bg-vanta-darkblue transition-colors hover:-translate-y-0.5 shadow-sm inline-flex items-center"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Adicionar Endereço
                  </button>
                </div>
              )
            ) : (
              <form onSubmit={handleSaveAddress} className="space-y-4 bg-gray-50 dark:bg-gray-900/50 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CEP</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        required
                        maxLength={8}
                        value={endereco.cep}
                        onChange={handleCepChange}
                        placeholder="Apenas números"
                        className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:border-vanta-blue focus:ring-2 focus:ring-vanta-blue/20 outline-none transition-all"
                      />
                      {loadingAddress && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="w-5 h-5 text-vanta-blue animate-spin" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rua / Logradouro</label>
                    <input 
                      type="text" 
                      required
                      value={endereco.rua}
                      onChange={(e) => setEndereco({...endereco, rua: e.target.value})}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:border-vanta-blue focus:ring-2 focus:ring-vanta-blue/20 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Número</label>
                    <input 
                      type="text" 
                      required
                      value={endereco.numero}
                      onChange={(e) => setEndereco({...endereco, numero: e.target.value})}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:border-vanta-blue focus:ring-2 focus:ring-vanta-blue/20 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Complemento <span className="text-gray-400 font-normal">(Opcional)</span></label>
                    <input 
                      type="text" 
                      value={endereco.complemento}
                      onChange={(e) => setEndereco({...endereco, complemento: e.target.value})}
                      placeholder="Apto, Bloco, etc."
                      className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:border-vanta-blue focus:ring-2 focus:ring-vanta-blue/20 outline-none transition-all"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bairro</label>
                    <input 
                      type="text" 
                      required
                      value={endereco.bairro}
                      onChange={(e) => setEndereco({...endereco, bairro: e.target.value})}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:border-vanta-blue focus:ring-2 focus:ring-vanta-blue/20 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cidade</label>
                    <input 
                      type="text" 
                      required
                      value={endereco.cidade}
                      onChange={(e) => setEndereco({...endereco, cidade: e.target.value})}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:border-vanta-blue focus:ring-2 focus:ring-vanta-blue/20 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado (UF)</label>
                    <input 
                      type="text" 
                      required
                      maxLength={2}
                      value={endereco.estado}
                      onChange={(e) => setEndereco({...endereco, estado: e.target.value.toUpperCase()})}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:border-vanta-blue focus:ring-2 focus:ring-vanta-blue/20 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
                  <button 
                    type="submit" 
                    disabled={saving}
                    className="flex-1 py-2.5 bg-vanta-blue text-white text-sm font-bold rounded-lg hover:bg-vanta-darkblue transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar Endereço'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setIsEditingAddress(false);
                      setErrorMsg('');
                    }}
                    disabled={saving}
                    className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-bold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
