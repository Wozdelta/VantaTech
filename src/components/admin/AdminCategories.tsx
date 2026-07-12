import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAlert } from '../../contexts/AlertContext';
import { useRealtimeUpdate } from '../../hooks/useRealtimeUpdate';
import { Plus, Trash2, Edit2, Loader2, X, MoveUp, MoveDown, ChevronDown, Check, Lock } from 'lucide-react';

type Categoria = {
  id: string;
  nome: string;
  ordem: number;
  ativo: boolean;
};

export default function AdminCategories() {
  const { showAlert } = useAlert();
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isOrderDropdownOpen, setIsOrderDropdownOpen] = useState(false);
  
  const [formData, setFormData] = useState({ id: '', nome: '', ordem: '', ativo: true });

  useEffect(() => {
    fetchCategories();
  }, []);

  useRealtimeUpdate(['categorias_menu'], fetchCategories);

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('categorias_menu')
        .select('*')
        .order('ordem', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = await showAlert({
      title: 'Atenção',
      message: 'Tem certeza que deseja excluir esta categoria do menu?',
      type: 'warning',
      showConfirm: true,
      confirmText: 'Sim, excluir',
      cancelText: 'Cancelar'
    });
    
    if (!confirmed) return;
    
    try {
      const { error } = await supabase.from('categorias_menu').delete().eq('id', id);
      if (error) throw error;
      fetchCategories();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      showAlert({ title: 'Erro', message: 'Erro ao excluir categoria.', type: 'error' });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    
    try {
      if (formData.id) {
        // Update
        const { error } = await supabase.from('categorias_menu')
          .update({
            nome: formData.nome,
            ordem: parseInt(formData.ordem),
            ativo: formData.ativo
          })
          .eq('id', formData.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase.from('categorias_menu')
          .insert([{
            nome: formData.nome,
            ordem: parseInt(formData.ordem),
            ativo: formData.ativo
          }]);
        if (error) throw error;
      }
      
      setIsModalOpen(false);
      resetForm();
      fetchCategories();
      
    } catch (error) {
      console.error('Erro ao salvar:', error);
      showAlert({ title: 'Erro', message: 'Erro ao salvar categoria.', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    let available = '';
    for (let i = 1; i <= 7; i++) {
      if (!categories.some(c => c.ordem === i)) {
        available = i.toString();
        break;
      }
    }
    setFormData({ id: '', nome: '', ordem: available, ativo: true });
  }

  function editCategory(cat: Categoria) {
    setFormData({
      id: cat.id,
      nome: cat.nome,
      ordem: cat.ordem.toString(),
      ativo: cat.ativo
    });
    setIsModalOpen(true);
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-soft rounded-xl p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Menu do Site</h2>
          <p className="text-sm text-gray-500">Gerencie as categorias que aparecem no topo do site.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          disabled={categories.length >= 7}
          title={categories.length >= 7 ? "Limite máximo de 7 categorias atingido" : ""}
          className={`w-full sm:w-auto flex justify-center items-center gap-2 px-4 py-2.5 sm:py-2 rounded-lg font-medium transition-colors ${
            categories.length >= 7 
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed' 
              : 'bg-vanta-blue text-white hover:bg-blue-600'
          }`}
        >
          <Plus className="w-5 h-5 sm:w-4 sm:h-4" /> Nova Categoria
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-vanta-blue" /></div>
      ) : (
        <>
          {/* Versão Mobile (Cards) */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {categories.map(cat => (
              <div key={cat.id} className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Ordem: {cat.ordem}</div>
                    <div className="text-base font-bold text-gray-900 dark:text-white">{cat.nome}</div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => editCategory(cat)} className="p-2 text-vanta-blue hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(cat.id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-2">
                  <span className={`px-2.5 py-1 inline-flex text-xs font-semibold rounded-full ${cat.ativo ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                    {cat.ativo ? 'Visível no menu' : 'Oculto'}
                  </span>
                </div>
              </div>
            ))}
            {categories.length === 0 && (
              <div className="py-8 text-center text-gray-500 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
                Nenhuma categoria cadastrada.
              </div>
            )}
          </div>

          {/* Versão Desktop (Tabela) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Ordem</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome da Categoria</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {categories.map(cat => (
                  <tr key={cat.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {cat.ordem}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900 dark:text-white">{cat.nome}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${cat.ativo ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {cat.ativo ? 'Visível no menu' : 'Oculto'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => editCategory(cat)} className="text-vanta-blue hover:text-blue-900 dark:hover:text-blue-400">
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDelete(cat.id)} className="text-red-600 hover:text-red-900 dark:hover:text-red-400 ml-4">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500">Nenhuma categoria cadastrada.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal Cadastro/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {formData.id ? 'Editar Categoria' : 'Nova Categoria'}
                </h3>
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome no Menu</label>
                  <input required type="text" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2.5 outline-none focus:border-vanta-blue" placeholder="Ex: Acessórios" />
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ordem (Posição)</label>
                  
                  <button
                    type="button"
                    onClick={() => setIsOrderDropdownOpen(!isOrderDropdownOpen)}
                    className="w-full flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3.5 text-left shadow-sm hover:border-vanta-blue/50 focus:border-vanta-blue focus:ring-4 focus:ring-vanta-blue/10 transition-all outline-none group"
                  >
                    <span className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-colors ${formData.ordem ? 'bg-vanta-blue text-white shadow-md shadow-blue-500/20' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
                        {formData.ordem || '-'}
                      </div>
                      <span className={formData.ordem ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-400 font-medium'}>
                        {formData.ordem ? `Posição ${formData.ordem}` : 'Selecione uma posição'}
                      </span>
                    </span>
                    <ChevronDown className={`w-5 h-5 text-gray-400 group-hover:text-vanta-blue transition-transform duration-300 ${isOrderDropdownOpen ? 'rotate-180 text-vanta-blue' : ''}`} />
                  </button>

                  {isOrderDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsOrderDropdownOpen(false)} />
                      <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 max-h-60 overflow-y-auto custom-scrollbar">
                        <div className="px-3 pb-2 mb-2 border-b border-gray-100 dark:border-gray-700">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Disponíveis (Máx: 7)</span>
                        </div>
                        {[1, 2, 3, 4, 5, 6, 7].map(num => {
                          const isTaken = categories.some(c => c.ordem === num && c.id !== formData.id);
                          const isSelected = formData.ordem === num.toString();
                          
                          return (
                            <button
                              key={num}
                              type="button"
                              disabled={isTaken}
                              onClick={() => {
                                setFormData({...formData, ordem: num.toString()});
                                setIsOrderDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${
                                isTaken 
                                  ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-900/30' 
                                  : isSelected
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-vanta-blue'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-200'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold ${
                                  isTaken ? 'bg-gray-200 dark:bg-gray-700 text-gray-500' :
                                  isSelected ? 'bg-vanta-blue text-white shadow-sm' :
                                  'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                }`}>
                                  {num}
                                </div>
                                <span className="font-medium">
                                  {isTaken ? 'Em uso' : `Posição ${num}`}
                                </span>
                              </div>
                              
                              {isTaken && <Lock className="w-4 h-4 text-gray-400" />}
                              {isSelected && <Check className="w-5 h-5 text-vanta-blue" />}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
                <div className="flex items-center mt-2">
                  <input type="checkbox" id="ativo" checked={formData.ativo} onChange={e => setFormData({...formData, ativo: e.target.checked})} className="w-4 h-4 text-vanta-blue bg-gray-100 border-gray-300 rounded focus:ring-vanta-blue" />
                  <label htmlFor="ativo" className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">Mostrar no menu do topo</label>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Cancelar</button>
                <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-lg bg-vanta-blue text-white hover:bg-blue-600 disabled:opacity-50 flex items-center">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
