import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Shield, MapPin, Loader2, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Perfil() {
  const { user, perfil } = useAuth();
  const userName = perfil?.nome_completo || user?.user_metadata?.nome_completo || user?.user_metadata?.full_name || user?.user_metadata?.name || 'Usuário';

  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [saving, setSaving] = useState(false);
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

  // Preenche o formulário com os dados do perfil quando carrega
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
    }
  }, [perfil]);

  // Busca o CEP na BrasilAPI
  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let cep = e.target.value.replace(/\D/g, ''); // Remove tudo que não for número
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

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

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

      setSuccessMsg('Endereço salvo com sucesso!');
      setIsEditingAddress(false);
      
      // Limpa a mensagem de sucesso depois de 3 segundos
      setTimeout(() => setSuccessMsg(''), 3000);
      
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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-soft">
            <div className="w-24 h-24 bg-vanta-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-12 h-12 text-vanta-blue" />
            </div>
            <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-1">{userName}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">{perfil?.cargo || 'Cliente'}</p>
          </div>
        </div>
        
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-soft">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-vanta-blue" />
              Dados da Conta
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Completo</label>
                <input type="text" value={userName} readOnly className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="email" value={user.email || ''} readOnly className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 cursor-not-allowed" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-vanta-orange" />
                Endereço de Entrega
              </h3>
              {hasAddress && !isEditingAddress && (
                <button 
                  onClick={() => setIsEditingAddress(true)}
                  className="text-sm font-medium text-vanta-blue hover:text-vanta-darkblue transition-colors"
                >
                  Editar
                </button>
              )}
            </div>

            {successMsg && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium rounded-lg flex items-center">
                <Check className="w-4 h-4 mr-2" />
                {successMsg}
              </div>
            )}
            
            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg">
                {errorMsg}
              </div>
            )}

            {!isEditingAddress ? (
              hasAddress ? (
                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                  <p className="text-gray-900 dark:text-white font-medium">{perfil?.rua}, {perfil?.numero}</p>
                  {perfil?.complemento && <p className="text-gray-500 dark:text-gray-400 text-sm">{perfil?.complemento}</p>}
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{perfil?.bairro}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{perfil?.cidade} - {perfil?.estado}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">CEP: {perfil?.cep?.replace(/^(\d{5})(\d{3})$/, '$1-$2')}</p>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Nenhum endereço cadastrado ainda.</p>
                  <button 
                    onClick={() => setIsEditingAddress(true)}
                    className="px-6 py-2.5 bg-vanta-blue text-white text-sm font-bold rounded-lg hover:bg-vanta-darkblue transition-colors hover:-translate-y-0.5 shadow-sm"
                  >
                    Adicionar Endereço
                  </button>
                </div>
              )
            ) : (
              <form onSubmit={handleSaveAddress} className="space-y-4">
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
                        className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:border-vanta-blue focus:ring-2 focus:ring-vanta-blue/20 outline-none transition-all"
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
                      className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:border-vanta-blue focus:ring-2 focus:ring-vanta-blue/20 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Número</label>
                    <input 
                      type="text" 
                      required
                      value={endereco.numero}
                      onChange={(e) => setEndereco({...endereco, numero: e.target.value})}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:border-vanta-blue focus:ring-2 focus:ring-vanta-blue/20 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Complemento <span className="text-gray-400 font-normal">(Opcional)</span></label>
                    <input 
                      type="text" 
                      value={endereco.complemento}
                      onChange={(e) => setEndereco({...endereco, complemento: e.target.value})}
                      placeholder="Apto, Bloco, etc."
                      className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:border-vanta-blue focus:ring-2 focus:ring-vanta-blue/20 outline-none transition-all"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bairro</label>
                    <input 
                      type="text" 
                      required
                      value={endereco.bairro}
                      onChange={(e) => setEndereco({...endereco, bairro: e.target.value})}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:border-vanta-blue focus:ring-2 focus:ring-vanta-blue/20 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cidade</label>
                    <input 
                      type="text" 
                      required
                      value={endereco.cidade}
                      onChange={(e) => setEndereco({...endereco, cidade: e.target.value})}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:border-vanta-blue focus:ring-2 focus:ring-vanta-blue/20 outline-none transition-all"
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
                      className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:border-vanta-blue focus:ring-2 focus:ring-vanta-blue/20 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
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
                    className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-bold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
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
