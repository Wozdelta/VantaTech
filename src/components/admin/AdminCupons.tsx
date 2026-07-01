import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAlert } from '../../contexts/AlertContext';
import { Plus, Trash2, Edit, CheckCircle, XCircle, Tag, Loader2, Save, X, Users, Box, Clock, DollarSign } from 'lucide-react';

type Cupom = {
  id: string;
  codigo: string;
  tipo_desconto: 'porcentagem' | 'fixo';
  valor_desconto: number;
  quantidade_disponivel: number | null;
  ativo: boolean;
  user_id: string | null;
  categoria_nome: string | null;
  data_expiracao: string | null;
  valor_minimo: number | null;
  valor_maximo: number | null;
  nivel_id: string | null;
  criado_em: string;
};

type Perfil = {
  id: string;
  nome_completo: string;
};

type Categoria = {
  id: string;
  nome: string;
};

type Nivel = {
  id: string;
  nome: string;
};

export default function AdminCupons() {
  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [niveis, setNiveis] = useState<Nivel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const { showAlert } = useAlert();
  const [currentTime, setCurrentTime] = useState(new Date());

  const [formData, setFormData] = useState({
    id: '',
    codigo: '',
    tipo_desconto: 'porcentagem',
    valor_desconto: '',
    quantidade_disponivel: '',
    ativo: true,
    user_id: '',
    categoria_nome: '',
    data_expiracao: '',
    valor_minimo: '',
    valor_maximo: '',
    nivel_id: ''
  });

  useEffect(() => {
    fetchData();
    
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    try {
      const [cuponsRes, perfisRes, catRes, niveisRes] = await Promise.all([
        supabase.from('cupons').select('*').order('criado_em', { ascending: false }),
        supabase.from('perfis').select('id, nome_completo').order('nome_completo'),
        supabase.from('categorias').select('nome').order('nome'),
        supabase.from('niveis_fidelidade').select('id, nome').order('pontos_minimos', { ascending: true })
      ]);

      if (cuponsRes.error) throw cuponsRes.error;
      setCupons(cuponsRes.data || []);
      if (perfisRes.data) setPerfis(perfisRes.data);
      if (catRes.data) setCategorias(catRes.data);
      if (niveisRes.data) setNiveis(niveisRes.data);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleSaveCupom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.codigo || !formData.valor_desconto) {
      showAlert({ title: 'Atenção', message: 'Preencha os campos obrigatórios', type: 'warning' });
      return;
    }

    try {
      setLoading(true);
      const payload = {
        codigo: formData.codigo.toUpperCase(),
        tipo_desconto: formData.tipo_desconto,
        valor_desconto: parseFloat(formData.valor_desconto),
        quantidade_disponivel: formData.quantidade_disponivel ? parseInt(formData.quantidade_disponivel) : null,
        ativo: formData.ativo,
        user_id: formData.user_id || null,
        categoria_nome: formData.categoria_nome || null,
        data_expiracao: formData.data_expiracao ? new Date(formData.data_expiracao).toISOString() : null,
        valor_minimo: formData.valor_minimo ? parseFloat(formData.valor_minimo) : null,
        valor_maximo: formData.valor_maximo ? parseFloat(formData.valor_maximo) : null,
        nivel_id: formData.nivel_id || null
      };

      if (formData.id) {
        // Atualizar
        const { error } = await supabase.from('cupons').update(payload).eq('id', formData.id);
        if (error) throw error;
        showAlert({ title: 'Sucesso', message: 'Cupom atualizado com sucesso!', type: 'success' });
      } else {
        // Criar novo
        const { error } = await supabase.from('cupons').insert([payload]);
        if (error) {
          if (error.code === '23505') {
            throw new Error('Já existe um cupom com este código.');
          }
          throw error;
        }
        showAlert({ title: 'Sucesso', message: 'Cupom criado com sucesso!', type: 'success' });
      }

      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Erro ao salvar cupom:', error);
      showAlert({ title: 'Erro', message: error.message || 'Erro ao salvar cupom', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCupom = async (id: string) => {
    const confirm = await showAlert({
      title: 'Excluir Cupom',
      message: 'Tem certeza que deseja excluir este cupom?',
      type: 'warning',
      showConfirm: true,
      confirmText: 'Excluir'
    });

    if (confirm) {
      try {
        setLoading(true);
        const { error } = await supabase.from('cupons').delete().eq('id', id);
        if (error) throw error;
        setCupons(cupons.filter(c => c.id !== id));
        showAlert({ title: 'Sucesso', message: 'Cupom excluído!', type: 'success' });
      } catch (error) {
        console.error('Erro ao excluir cupom:', error);
        showAlert({ title: 'Erro', message: 'Erro ao excluir cupom', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
  };

  const silentDeleteCupom = async (id: string) => {
    try {
      const { error } = await supabase.from('cupons').delete().eq('id', id);
      if (!error) {
        setCupons(prev => prev.filter(c => c.id !== id));
      }
    } catch (error) {
      console.error('Erro ao excluir cupom silenciosamente:', error);
    }
  };

  useEffect(() => {
    cupons.forEach(cupom => {
      let isEsgotado = cupom.quantidade_disponivel !== null && cupom.quantidade_disponivel <= 0;
      if (cupom.data_expiracao) {
        let expDateStr = cupom.data_expiracao;
        if (!expDateStr.endsWith('Z') && !expDateStr.includes('+') && !expDateStr.includes('-')) {
          expDateStr += 'Z';
        }
        const expDate = new Date(expDateStr);
        if (expDate < currentTime || isEsgotado) {
          const deletionTime = new Date(expDate.getTime() + 60 * 60 * 1000);
          const diffMs = deletionTime.getTime() - currentTime.getTime();
          if (diffMs <= 0 && diffMs > -5000) {
            silentDeleteCupom(cupom.id);
          }
        }
      }
    });
  }, [currentTime]);

  const resetForm = () => {
    setFormData({
      id: '',
      codigo: '',
      tipo_desconto: 'porcentagem',
      valor_desconto: '',
      quantidade_disponivel: '',
      ativo: true,
      user_id: '',
      categoria_nome: '',
      data_expiracao: '',
      valor_minimo: '',
      valor_maximo: '',
      nivel_id: ''
    });
    setIsEditing(false);
  };

  const editCupom = (cupom: Cupom) => {
    let formattedDate = '';
    if (cupom.data_expiracao) {
      // Create local date string for datetime-local input without shifting to UTC
      const d = new Date(cupom.data_expiracao);
      const tzOffset = d.getTimezoneOffset() * 60000; // offset in milliseconds
      const localISOTime = (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 16);
      formattedDate = localISOTime;
    }

    setFormData({
      id: cupom.id,
      codigo: cupom.codigo,
      tipo_desconto: cupom.tipo_desconto,
      valor_desconto: cupom.valor_desconto.toString(),
      quantidade_disponivel: cupom.quantidade_disponivel ? cupom.quantidade_disponivel.toString() : '',
      ativo: cupom.ativo,
      user_id: cupom.user_id || '',
      categoria_nome: cupom.categoria_nome || '',
      data_expiracao: formattedDate,
      valor_minimo: cupom.valor_minimo ? cupom.valor_minimo.toString() : '',
      valor_maximo: cupom.valor_maximo ? cupom.valor_maximo.toString() : '',
      nivel_id: cupom.nivel_id || ''
    });
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDiscount = (cupom: Cupom) => {
    if (cupom.tipo_desconto === 'porcentagem') {
      return `${cupom.valor_desconto}% OFF`;
    }
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cupom.valor_desconto) + ' OFF';
  };

  const formatMoney = (val: number | null) => {
    if (!val) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Tag className="w-6 h-6 text-vanta-blue" />
            Gerenciar Cupons
          </h2>
          <p className="text-sm text-gray-500 mt-1">Crie e edite códigos de desconto para seus clientes.</p>
        </div>
      </div>

      {/* Formulário */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-100 dark:border-gray-800 pb-4">
            {isEditing ? 'Editar Cupom' : 'Criar Novo Cupom'}
          </h3>
          <form onSubmit={handleSaveCupom} className="space-y-6">
            
            {/* Secao 1: Basico */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4 text-gray-400" />
                Informações Básicas
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Código do Cupom *</label>
                  <input required type="text" value={formData.codigo} onChange={e => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 outline-none focus:border-vanta-blue focus:ring-2 focus:ring-vanta-blue/20 transition-all text-sm font-medium uppercase" placeholder="Ex: PROMO10" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Tipo de Desconto *</label>
                  <select required value={formData.tipo_desconto} onChange={e => setFormData({ ...formData, tipo_desconto: e.target.value as any })} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 outline-none focus:border-vanta-blue focus:ring-2 focus:ring-vanta-blue/20 transition-all text-sm font-medium">
                    <option value="porcentagem">Porcentagem (%)</option>
                    <option value="fixo">Valor Fixo (R$)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Valor do Desconto *</label>
                  <input required type="number" step="0.01" min="0" value={formData.valor_desconto} onChange={e => setFormData({ ...formData, valor_desconto: e.target.value })} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 outline-none focus:border-vanta-blue focus:ring-2 focus:ring-vanta-blue/20 transition-all text-sm font-medium" placeholder={formData.tipo_desconto === 'porcentagem' ? 'Ex: 10' : 'Ex: 50'} />
                </div>
              </div>
            </div>

            {/* Secao 2: Restricoes */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Box className="w-4 h-4 text-gray-400" />
                Regras e Restrições (Opcional)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> Cliente Específico
                  </label>
                  <select value={formData.user_id} onChange={e => setFormData({ ...formData, user_id: e.target.value })} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 outline-none focus:border-vanta-blue focus:ring-2 focus:ring-vanta-blue/20 transition-all text-sm font-medium">
                    <option value="">Todos os Clientes</option>
                    {perfis.map(p => (
                      <option key={p.id} value={p.id}>{p.nome_completo || 'Cliente sem nome'}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                    <Box className="w-3.5 h-3.5" /> Apenas para Categoria
                  </label>
                  <select value={formData.categoria_nome} onChange={e => setFormData({ ...formData, categoria_nome: e.target.value })} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 outline-none focus:border-vanta-blue focus:ring-2 focus:ring-vanta-blue/20 transition-all text-sm font-medium">
                    <option value="">Todas as Categorias</option>
                    {categorias.map(c => (
                      <option key={c.nome} value={c.nome}>{c.nome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Válido Até
                  </label>
                  <input type="datetime-local" value={formData.data_expiracao} onChange={e => setFormData({ ...formData, data_expiracao: e.target.value })} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 outline-none focus:border-vanta-blue focus:ring-2 focus:ring-vanta-blue/20 transition-all text-sm font-medium" />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" /> Apenas para Nível (Clube)
                  </label>
                  <select value={formData.nivel_id} onChange={e => setFormData({ ...formData, nivel_id: e.target.value })} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 outline-none focus:border-vanta-blue focus:ring-2 focus:ring-vanta-blue/20 transition-all text-sm font-medium">
                    <option value="">Qualquer Nível</option>
                    {niveis.map(n => (
                      <option key={n.id} value={n.id}>{n.nome} (ou superior)</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Secao 3: Limites */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-400" />
                Limites de Compra
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Limite de Usos (Geral)</label>
                  <input type="number" min="1" value={formData.quantidade_disponivel} onChange={e => setFormData({ ...formData, quantidade_disponivel: e.target.value })} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 outline-none focus:border-vanta-blue focus:ring-2 focus:ring-vanta-blue/20 transition-all text-sm font-medium" placeholder="Ex: 100 (vazio = ilimitado)" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Compra Mínima (R$)</label>
                  <input type="number" step="0.01" min="0" value={formData.valor_minimo} onChange={e => setFormData({ ...formData, valor_minimo: e.target.value })} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 outline-none focus:border-vanta-blue focus:ring-2 focus:ring-vanta-blue/20 transition-all text-sm font-medium" placeholder="Ex: 100" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Compra Máxima (R$)</label>
                  <input type="number" step="0.01" min="0" value={formData.valor_maximo} onChange={e => setFormData({ ...formData, valor_maximo: e.target.value })} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 outline-none focus:border-vanta-blue focus:ring-2 focus:ring-vanta-blue/20 transition-all text-sm font-medium" placeholder="Ex: 1000" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <label className="flex items-center gap-2 cursor-pointer p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <input type="checkbox" checked={formData.ativo} onChange={e => setFormData({ ...formData, ativo: e.target.checked })} className="w-4 h-4 text-vanta-blue rounded border-gray-300 focus:ring-vanta-blue cursor-pointer" />
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Cupom Ativo</span>
              </label>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <button type="submit" disabled={loading} className="flex items-center gap-2 bg-vanta-blue text-white px-6 py-2.5 rounded-xl font-bold hover:bg-vanta-darkblue transition-colors disabled:opacity-50">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {isEditing ? 'Atualizar Cupom' : 'Criar Cupom'}
              </button>
              {isEditing && (
                <button type="button" onClick={resetForm} className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-6 py-2.5 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <X className="w-5 h-5" />
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Lista */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <h3 className="font-bold text-gray-900 dark:text-white">Cupons Cadastrados</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Código</th>
                <th className="px-6 py-4">Desconto</th>
                <th className="px-6 py-4">Regras</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {loading && cupons.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-vanta-blue" />
                    <p>Carregando cupons...</p>
                  </td>
                </tr>
              ) : cupons.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Nenhum cupom cadastrado.
                  </td>
                </tr>
              ) : (
                cupons.map(cupom => (
                  <tr key={cupom.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="font-bold text-vanta-blue px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30 w-max text-base tracking-wider">
                          {cupom.codigo}
                        </span>
                        {cupom.quantidade_disponivel !== null && (
                          <span className="text-xs text-gray-500 font-medium">{cupom.quantidade_disponivel} usos restantes</span>
                        )}
                        
                        {/* Timer super bonito e integrado */}
                        {(() => {
                          let isEsgotado = cupom.quantidade_disponivel !== null && cupom.quantidade_disponivel <= 0;
                          let deletionTime: Date | null = null;
                          if (cupom.data_expiracao) {
                            let expDateStr = cupom.data_expiracao;
                            if (!expDateStr.endsWith('Z') && !expDateStr.includes('+') && !expDateStr.includes('-')) {
                              expDateStr += 'Z';
                            }
                            const expDate = new Date(expDateStr);
                            if (expDate < currentTime || isEsgotado) {
                              deletionTime = new Date(expDate.getTime() + 60 * 60 * 1000);
                            }
                          }
                          
                          if (deletionTime) {
                            const diffMs = deletionTime.getTime() - currentTime.getTime();
                            if (diffMs > 0) {
                              const mins = Math.floor(diffMs / 60000);
                              const secs = Math.floor((diffMs % 60000) / 1000);
                              return (
                                <div className="mt-2 flex items-center gap-3 bg-red-50/80 dark:bg-red-900/20 px-3 py-2 rounded-xl border border-red-100 dark:border-red-800/30 w-max shadow-sm animate-fade-in">
                                  <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                                    <Trash2 className="w-3.5 h-3.5 animate-pulse" />
                                    <span className="text-xs font-bold whitespace-nowrap">Exclui em {mins}m {secs}s</span>
                                  </div>
                                  <button onClick={() => handleDeleteCupom(cupom.id)} className="text-[10px] bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800/50 font-bold px-2 py-1 rounded-md transition-colors shadow-sm whitespace-nowrap">
                                    Apagar
                                  </button>
                                </div>
                              );
                            }
                          }
                          return null;
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-gray-900 dark:text-white">
                        {formatDiscount(cupom)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-xs">
                        {cupom.user_id && <span className="text-purple-600 font-medium">Restrito a cliente</span>}
                        {cupom.categoria_nome && <span className="text-orange-600 font-medium">Cat: {cupom.categoria_nome}</span>}
                        {cupom.nivel_id && <span className="text-blue-600 font-medium">Nível: {niveis.find(n => n.id === cupom.nivel_id)?.nome} +</span>}
                        {cupom.data_expiracao && <span className="text-red-600 font-medium">Exp: {new Date(cupom.data_expiracao).toLocaleDateString()}</span>}
                        {(cupom.valor_minimo || cupom.valor_maximo) && (
                          <span className="text-gray-500">
                            R$ {cupom.valor_minimo || 0} - {cupom.valor_maximo ? formatMoney(cupom.valor_maximo) : '∞'}
                          </span>
                        )}
                        {!cupom.user_id && !cupom.categoria_nome && !cupom.data_expiracao && !cupom.valor_minimo && !cupom.valor_maximo && !cupom.nivel_id && (
                          <span className="text-gray-400 italic">Sem restrições</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        let isExpired = false;
                        let isEsgotado = cupom.quantidade_disponivel !== null && cupom.quantidade_disponivel <= 0;
                        let deletionTime: Date | null = null;
                        
                        if (cupom.data_expiracao) {
                          let expDateStr = cupom.data_expiracao;
                          if (!expDateStr.endsWith('Z') && !expDateStr.includes('+') && !expDateStr.includes('-')) {
                            expDateStr += 'Z';
                          }
                          const expDate = new Date(expDateStr);
                          isExpired = expDate < currentTime;
                          if (isExpired || isEsgotado) {
                            deletionTime = new Date(expDate.getTime() + 60 * 60 * 1000);
                          }
                        } else if (isEsgotado) {
                          // Se nao tiver data, mas esgotou, a gente nao tem como saber quando, 
                          // entao fica só como esgotado mesmo
                        }

                        if (!cupom.ativo) {
                          return (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700">
                              <XCircle className="w-3.5 h-3.5" /> Inativo
                            </span>
                          );
                        }
                        
                        if (isEsgotado || isExpired) {
                          let timeString = '';
                          let canDelete = false;
                          if (deletionTime) {
                            const diffMs = deletionTime.getTime() - currentTime.getTime();
                            if (diffMs > 0) {
                              const mins = Math.floor(diffMs / 60000);
                              const secs = Math.floor((diffMs % 60000) / 1000);
                              timeString = `${mins}m ${secs}s`;
                              canDelete = true;
                            } else {
                              timeString = 'Apagando...';
                            }
                          }
                          return (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-800/30">
                              <Clock className="w-3.5 h-3.5" /> {isEsgotado ? 'Esgotado' : 'Expirado'}
                            </span>
                          );
                        }

                        return (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-800/30">
                            <CheckCircle className="w-3.5 h-3.5" /> Ativo
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => editCupom(cupom)} className="p-2 text-vanta-blue hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Editar">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteCupom(cupom.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Excluir">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
