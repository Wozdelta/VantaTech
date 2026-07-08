import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAlert } from '../../contexts/AlertContext';
import { Plus, Trash2, Image as ImageIcon, Loader2, X, Edit, UploadCloud, Award, Medal, Package, Settings, Users, Gift, Star, Ticket } from 'lucide-react';
import AdminOrders from './AdminOrders';

type Nivel = {
  id: string;
  nome: string;
  pontos_minimos: number;
  cor_hex: string;
};

type Recompensa = {
  id: string;
  nome: string;
  pontos: number;
  badge: string | null;
  ativo: boolean;
  nivel_id?: string | null;
  cupom_valor?: number | null;
  cupom_tipo?: string | null;
  imagem_url?: string;
};

interface Perfil {
  id: string;
  nome_completo: string;
  pontos: number;
  pontos_acumulados?: number;
};

export default function AdminFidelidade() {
  const { showAlert } = useAlert();
  const [activeTab, setActiveTab] = useState<'geral' | 'config' | 'pedidos'>('geral');
  
  // State Níveis
  const [niveis, setNiveis] = useState<Nivel[]>([]);
  const [loadingNiveis, setLoadingNiveis] = useState(true);
  
  // State Recompensas
  const [recompensas, setRecompensas] = useState<Recompensa[]>([]);
  const [loadingRecompensas, setLoadingRecompensas] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  // State Perfis
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [loadingPerfis, setLoadingPerfis] = useState(true);

  // Form Data
  const [formData, setFormData] = useState({
    nome: '',
    pontos: '',
    badge: '',
    nivel_id: '',
    tipo: 'produto',
    cupom_valor: '',
    cupom_tipo: 'fixo'
  });
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  
  const [pendingResgatesCount, setPendingResgatesCount] = useState(0);

  useEffect(() => {
    fetchNiveis();
    fetchRecompensas();
    fetchPerfis();
    fetchPendingResgates();

    const channel = supabase
      .channel('fidelidade-counts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, fetchPendingResgates)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchPendingResgates() {
    try {
      const { data } = await supabase
        .from('pedidos')
        .select(`total, itens_pedido(produto_nome)`)
        .eq('status', 'Pendente');
        
      if (data) {
        const count = data.filter((p: any) => 
          p.itens_pedido?.some((i: any) => i.produto_nome.includes('[Vanta Club]'))
        ).length;
        setPendingResgatesCount(count);
      }
    } catch (error) {
      console.error('Erro ao buscar pedidos de resgate pendentes:', error);
    }
  }

  async function fetchNiveis() {
    try {
      setLoadingNiveis(true);
      const { data, error } = await supabase
        .from('niveis_fidelidade')
        .select('*')
        .order('pontos_minimos', { ascending: true });

      if (error) throw error;
      setNiveis(data || []);
    } catch (error) {
      console.error('Erro ao buscar níveis:', error);
    } finally {
      setLoadingNiveis(false);
    }
  }

  async function fetchRecompensas() {
    try {
      setLoadingRecompensas(true);
      const { data, error } = await supabase
        .from('recompensas')
        .select('*')
        .order('pontos', { ascending: true });

      if (error) throw error;
      setRecompensas(data || []);
    } catch (error) {
      console.error('Erro ao buscar recompensas:', error);
    } finally {
      setLoadingRecompensas(false);
    }
  }

  async function fetchPerfis() {
    try {
      setLoadingPerfis(true);
      const { data, error } = await supabase
        .from('perfis')
        .select('id, nome_completo, pontos, pontos_acumulados')
        .order('pontos', { ascending: false });

      if (error) throw error;
      setPerfis(data || []);
    } catch (error) {
      console.error('Erro ao buscar perfis:', error);
    } finally {
      setLoadingPerfis(false);
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleEdit = (recompensa: Recompensa) => {
    setEditId(recompensa.id);
    setFormData({
      nome: recompensa.nome,
      pontos: recompensa.pontos.toString(),
      badge: recompensa.badge || '',
      nivel_id: recompensa.nivel_id || '',
      tipo: recompensa.cupom_valor ? 'cupom' : 'produto',
      cupom_valor: recompensa.cupom_valor ? recompensa.cupom_valor.toString() : '',
      cupom_tipo: recompensa.cupom_tipo || 'fixo'
    });
    setImagePreview(recompensa.imagem_url || '');
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showAlert({
      title: 'Excluir Recompensa?',
      message: 'Tem certeza que deseja excluir esta recompensa permanentemente?',
      type: 'warning',
      showConfirm: true,
      confirmText: 'Excluir',
      cancelText: 'Cancelar'
    });

    if (!confirmed) return;

    try {
      const { error } = await supabase.from('recompensas').delete().eq('id', id);
      if (error) throw error;
      
      showAlert({ title: 'Sucesso', message: 'Recompensa excluída com sucesso!', type: 'success' });
      fetchRecompensas();
    } catch (error) {
      console.error('Erro ao excluir recompensa:', error);
      showAlert({ title: 'Erro', message: 'Erro ao excluir recompensa.', type: 'error' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.pontos) {
      showAlert({ title: 'Atenção', message: 'Preencha o nome e o valor em pontos.', type: 'warning' });
      return;
    }
    
    if (formData.tipo === 'cupom' && (!formData.cupom_valor || isNaN(parseFloat(formData.cupom_valor)))) {
      showAlert({ title: 'Atenção', message: 'Informe um valor numérico válido para o desconto.', type: 'warning' });
      return;
    }
    
    if (formData.tipo === 'produto' && !editId && !imageFile && !imagePreview) {
      showAlert({ title: 'Atenção', message: 'Adicione uma imagem para a recompensa física.', type: 'warning' });
      return;
    }

    setSaving(true);

    try {
      let imagem_url = imagePreview;

      if (formData.tipo === 'cupom') {
        imagem_url = 'https://i.ibb.co/6P0rJ89/coupon-icon.png';
      } else if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('produtos_imagens')
          .upload(`recompensas/${fileName}`, imageFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('produtos_imagens')
          .getPublicUrl(`recompensas/${fileName}`);
          
        imagem_url = publicUrlData.publicUrl;
      }

      const dataToSave = {
        nome: formData.nome,
        pontos: parseInt(formData.pontos),
        badge: formData.badge || null,
        imagem_url,
        nivel_id: formData.nivel_id || null,
        cupom_valor: formData.tipo === 'cupom' ? parseFloat(formData.cupom_valor) : null,
        cupom_tipo: formData.tipo === 'cupom' ? formData.cupom_tipo : null
      };

      if (editId) {
        const { error } = await supabase.from('recompensas').update(dataToSave).eq('id', editId);
        if (error) throw error;
        showAlert({ title: 'Sucesso', message: 'Recompensa atualizada!', type: 'success' });
      } else {
        const { error } = await supabase.from('recompensas').insert(dataToSave);
        if (error) throw error;
        showAlert({ title: 'Sucesso', message: 'Recompensa cadastrada!', type: 'success' });
      }

      setIsModalOpen(false);
      fetchRecompensas();
    } catch (error) {
      console.error('Erro ao salvar recompensa:', error);
      showAlert({ title: 'Erro', message: 'Erro ao salvar recompensa.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({ nome: '', pontos: '', badge: '', nivel_id: '', tipo: 'produto', cupom_valor: '', cupom_tipo: 'fixo' });
    setImageFile(null);
    setImagePreview('');
    setEditId(null);
    setIsModalOpen(false);
  };

  const handleSaveNivel = async (nivel: Nivel, novosPontos: number) => {
    try {
      const { error } = await supabase
        .from('niveis_fidelidade')
        .update({ pontos_minimos: novosPontos })
        .eq('id', nivel.id);

      if (error) throw error;
      showAlert({ title: 'Sucesso', message: `Meta do nível ${nivel.nome} atualizada!`, type: 'success' });
      fetchNiveis();
    } catch (error) {
      console.error('Erro ao atualizar nível:', error);
      showAlert({ title: 'Erro', message: 'Erro ao atualizar nível.', type: 'error' });
    }
  };

  const getNivelInfo = (pontosAcumulados: number) => {
    if (niveis.length > 0) {
      let n = niveis[0];
      for (let i = 0; i < niveis.length; i++) {
        if (pontosAcumulados >= niveis[i].pontos_minimos) n = niveis[i];
      }
      return { nome: n.nome, bg: 'text-white shadow-md', cor: n.cor_hex || '#1D8EFF' };
    }
    
    if (pontosAcumulados >= 5000) return { nome: 'Diamante', bg: 'bg-cyan-900 text-white shadow-md', cor: undefined };
    if (pontosAcumulados >= 2500) return { nome: 'Ouro', bg: 'bg-yellow-700 text-white shadow-md', cor: undefined };
    if (pontosAcumulados >= 1000) return { nome: 'Prata', bg: 'bg-gray-600 text-white shadow-md', cor: undefined };
    return { nome: 'Bronze', bg: 'bg-orange-800 text-white shadow-md', cor: undefined };
  };

  return (
    <div className="space-y-6">
      {/* Abas Superiores */}
      <div className="flex overflow-x-auto pb-2 -mx-2 px-2 sm:mx-0 sm:px-0 sm:pb-0 sm:flex-wrap gap-2 sm:gap-4 mb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <button
          onClick={() => setActiveTab('geral')}
          className={`px-4 py-2 rounded-lg font-bold transition-colors whitespace-nowrap ${activeTab === 'geral' ? 'bg-vanta-blue text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}
        >
          Visão Geral
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'config' ? 'bg-vanta-blue text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}
        >
          <Settings className="w-4 h-4" /> Configurações de Níveis
        </button>
          <button
            onClick={() => setActiveTab('pedidos')}
            className={`px-6 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'pedidos' 
                ? 'bg-vanta-blue text-white shadow-lg shadow-blue-500/25' 
                : 'bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Package className="w-4 h-4" />
            Pedidos de Resgate
            {pendingResgatesCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">
                {pendingResgatesCount}
              </span>
            )}
          </button>
      </div>

      {activeTab === 'config' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Settings className="w-6 h-6 text-vanta-blue" />
              Metas de Fidelidade
            </h2>
            <p className="text-gray-500 text-sm mt-1">Defina quantos VantaCoins o cliente precisa acumular para atingir cada nível.</p>
          </div>

          {loadingNiveis ? (
             <div className="flex items-center justify-center py-12">
               <Loader2 className="w-8 h-8 text-vanta-blue animate-spin" />
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {niveis.map(nivel => (
                <div key={nivel.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-gray-50 dark:bg-gray-900/50">
                   <div className="flex items-center gap-2 mb-4">
                     <Medal className="w-5 h-5" style={{ color: nivel.cor_hex }} />
                     <h3 className="font-bold text-lg text-gray-900 dark:text-white">{nivel.nome}</h3>
                   </div>
                   
                   <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Pontos Mínimos</label>
                   <div className="flex flex-col sm:flex-row gap-2">
                     <input 
                        type="number"
                        id={`input-nivel-${nivel.id}`}
                        defaultValue={nivel.pontos_minimos}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                     />
                     <button
                        onClick={() => {
                          const input = document.getElementById(`input-nivel-${nivel.id}`) as HTMLInputElement;
                          if (input) handleSaveNivel(nivel, parseInt(input.value));
                         }}
                        className="w-full sm:w-auto px-3 py-2 bg-vanta-blue text-white rounded-lg hover:bg-blue-600 font-medium"
                     >
                       Salvar
                     </button>
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'geral' && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Coluna Esquerda: Ranking de Usuários */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft overflow-hidden flex flex-col h-[500px] sm:h-[600px] lg:h-[800px]">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-vanta-blue" />
            Ranking de Clientes
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {loadingPerfis ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="w-10 h-10 text-vanta-blue animate-spin mb-4" />
              <p className="text-gray-500">Carregando clientes...</p>
            </div>
          ) : perfis.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              Nenhum cliente encontrado.
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {perfis.map((perfil, index) => {
                return (
                  <div key={perfil.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-500">
                        {index + 1}º
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">{perfil.nome_completo || 'Usuário Sem Nome'}</p>
                        <p className="text-sm text-gray-500">{perfil.pontos || 0} VantaCoins</p>
                      </div>
                    </div>
                    <div>
                      <span 
                        className={`px-3 py-1 rounded-full text-xs font-bold ${getNivelInfo(perfil.pontos_acumulados || 0).bg}`}
                        style={getNivelInfo(perfil.pontos_acumulados || 0).cor ? { backgroundColor: getNivelInfo(perfil.pontos_acumulados || 0).cor } : undefined}
                      >
                        {getNivelInfo(perfil.pontos_acumulados || 0).nome}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Coluna Direita: Recompensas */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft overflow-hidden flex flex-col h-[500px] sm:h-[600px] lg:h-[800px]">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Gift className="w-6 h-6 text-vanta-orange" />
            Recompensas
          </h2>
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-vanta-blue text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 font-medium"
          >
            <Plus className="w-4 h-4" />
            Nova
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {loadingRecompensas ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="w-10 h-10 text-vanta-blue animate-spin mb-4" />
              <p className="text-gray-500">Carregando recompensas...</p>
            </div>
          ) : recompensas.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Award className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 text-lg font-medium">Nenhuma recompensa cadastrada</p>
              <p className="text-gray-400 text-sm mt-2">Clique no botão acima para adicionar a primeira.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {recompensas.map((rec) => {
                const nivel = rec.nivel_id ? niveis.find(n => n.id === rec.nivel_id) : null;
                const bgCor = nivel?.cor_hex || '#f97316'; // vanta-orange default
                
                return (
                  <div key={rec.id} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden group flex bg-white dark:bg-gray-800 relative h-28 hover:border-gray-300 dark:hover:border-gray-600 transition-all shadow-sm hover:shadow-md">
                    {/* Imagem ou Ícone do Cupom */}
                    <div className="w-28 h-full flex-shrink-0 relative">
                      {rec.cupom_valor ? (
                        <div 
                           className="w-full h-full flex flex-col items-center justify-center text-white"
                           style={{ backgroundColor: bgCor }}
                        >
                          <Ticket className="w-8 h-8 mb-1 opacity-90" />
                          <span className="font-black text-lg leading-none">
                            {rec.cupom_tipo === 'porcentagem' ? `${rec.cupom_valor}%` : `R$ ${rec.cupom_valor}`}
                          </span>
                        </div>
                      ) : (
                        <img src={rec.imagem_url || '/placeholder.png'} alt={rec.nome} className="w-full h-full object-cover" />
                      )}
                    </div>
                    
                    {/* Conteúdo */}
                    <div className="p-4 flex-1 flex flex-col justify-center min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-bold text-gray-900 dark:text-white truncate">{rec.nome}</h3>
                        {rec.badge && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 whitespace-nowrap flex-shrink-0">
                            {rec.badge}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-vanta-orange font-black flex items-center gap-1.5 text-sm mb-2">
                        <Star className="w-4 h-4 fill-vanta-orange" /> {rec.pontos} pts
                      </p>
                      
                      {nivel && (
                         <span 
                            className="inline-block px-2 py-0.5 text-white text-[10px] uppercase tracking-wider font-bold rounded-md w-max"
                            style={{ backgroundColor: nivel.cor_hex }}
                          >
                            Exclusivo {nivel.nome}
                          </span>
                      )}
                    </div>

                    {/* Ações Hover */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-1.5 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                      <button
                        onClick={() => handleEdit(rec)}
                        className="p-1.5 text-gray-500 hover:text-vanta-blue rounded-md transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(rec.id)}
                        className="p-1.5 text-gray-500 hover:text-red-500 rounded-md transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Recompensa */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md max-h-[95vh] shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 z-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editId ? 'Editar Recompensa' : 'Nova Recompensa'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipo de Recompensa
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-vanta-blue focus:border-transparent outline-none transition-all dark:text-white"
                  >
                    <option value="produto">Produto Físico / Brinde</option>
                    <option value="cupom">Cupom de Desconto Exclusivo</option>
                  </select>
                </div>

                {formData.tipo === 'cupom' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tipo do Desconto
                      </label>
                      <select
                        value={formData.cupom_tipo}
                        onChange={(e) => setFormData({ ...formData, cupom_tipo: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-vanta-blue focus:border-transparent outline-none transition-all dark:text-white"
                      >
                        <option value="fixo">Valor Fixo (R$)</option>
                        <option value="porcentagem">Porcentagem (%)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Valor do Desconto
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.cupom_valor}
                        onChange={(e) => setFormData({ ...formData, cupom_valor: e.target.value })}
                        placeholder={formData.cupom_tipo === 'porcentagem' ? 'Ex: 10' : 'Ex: 50.00'}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-vanta-blue focus:border-transparent outline-none transition-all dark:text-white"
                      />
                    </div>
                  </div>
                )}
                
                {formData.tipo === 'produto' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Imagem da Recompensa
                    </label>
                    <div className="flex items-center gap-4">
                      {imagePreview ? (
                        <div className="relative w-32 h-32 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden group">
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => { setImagePreview(''); setImageFile(null); }}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                          >
                            <Trash2 className="w-6 h-6" />
                          </button>
                        </div>
                      ) : (
                        <label className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center text-gray-500 hover:text-vanta-blue hover:border-vanta-blue hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors">
                          <ImageIcon className="w-8 h-8 mb-2" />
                          <span className="text-xs font-medium">Fazer Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome da Recompensa
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-vanta-blue focus:border-transparent outline-none transition-all dark:text-white"
                    placeholder="Ex: Capinha Transparente"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Valor em Pontos
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.pontos}
                    onChange={(e) => setFormData({ ...formData, pontos: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-vanta-blue focus:border-transparent outline-none transition-all dark:text-white"
                    placeholder="Ex: 1000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Badge (Opcional)
                  </label>
                  <select
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-vanta-blue focus:border-transparent outline-none transition-all dark:text-white appearance-none"
                  >
                    <option value="">Sem Badge</option>
                    <option value="Mais Resgatado">Mais Resgatado</option>
                    <option value="Exclusivo">Exclusivo</option>
                    <option value="Novidade">Novidade</option>
                    <option value="Promoção">Promoção</option>
                    <option value="Esgotando">Esgotando</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nível Exclusivo (Opcional)
                  </label>
                  <select
                    value={formData.nivel_id}
                    onChange={(e) => setFormData({ ...formData, nivel_id: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-vanta-blue focus:border-transparent outline-none transition-all dark:text-white appearance-none"
                  >
                    <option value="">Disponível para Todos</option>
                    {niveis.map(nivel => (
                      <option key={nivel.id} value={nivel.id}>Exclusivo {nivel.nome}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Apenas usuários deste nível ou superior poderão resgatar.</p>
                </div>
              </div>

              <div className="pt-4 sticky bottom-0 bg-white dark:bg-gray-800 pb-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-4 px-6 bg-vanta-blue hover:bg-blue-600 active:bg-blue-700 text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin mr-2" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Recompensa'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
      )}

      {activeTab === 'pedidos' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft overflow-hidden p-6">
          <AdminOrders onlyVantaClub={true} />
        </div>
      )}
    </div>
  );
}
