import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAlert } from '../../contexts/AlertContext';
import { Plus, Trash2, Loader2, Tags, Layers } from 'lucide-react';

export default function AdminAttributes() {
  const { showAlert } = useAlert();
  const [marcas, setMarcas] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loadingMarcas, setLoadingMarcas] = useState(true);
  const [loadingCategorias, setLoadingCategorias] = useState(true);
  
  const [novaMarca, setNovaMarca] = useState('');
  const [novaCategoria, setNovaCategoria] = useState('');
  const [savingMarca, setSavingMarca] = useState(false);
  const [savingCategoria, setSavingCategoria] = useState(false);

  useEffect(() => {
    fetchMarcas();
    fetchCategorias();
  }, []);

  async function fetchMarcas() {
    try {
      const { data, error } = await supabase.from('marcas').select('*').order('nome');
      if (error) throw error;
      setMarcas(data || []);
    } catch (error) {
      console.error('Erro ao buscar marcas:', error);
    } finally {
      setLoadingMarcas(false);
    }
  }

  async function fetchCategorias() {
    try {
      const { data, error } = await supabase.from('categorias').select('*').order('nome');
      if (error) throw error;
      setCategorias(data || []);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
    } finally {
      setLoadingCategorias(false);
    }
  }

  async function handleAddMarca(e: React.FormEvent) {
    e.preventDefault();
    if (!novaMarca.trim()) return;
    setSavingMarca(true);
    try {
      const { error } = await supabase.from('marcas').insert([{ nome: novaMarca.trim() }]);
      if (error) throw error;
      setNovaMarca('');
      fetchMarcas();
    } catch (error: any) {
      console.error('Erro ao adicionar marca:', error);
      showAlert({ title: 'Erro', message: error.message || 'Erro ao adicionar marca.', type: 'error' });
    } finally {
      setSavingMarca(false);
    }
  }

  async function handleAddCategoria(e: React.FormEvent) {
    e.preventDefault();
    if (!novaCategoria.trim()) return;
    setSavingCategoria(true);
    try {
      const { error } = await supabase.from('categorias').insert([{ nome: novaCategoria.trim() }]);
      if (error) throw error;
      setNovaCategoria('');
      fetchCategorias();
    } catch (error: any) {
      console.error('Erro ao adicionar categoria:', error);
      showAlert({ title: 'Erro', message: error.message || 'Erro ao adicionar categoria.', type: 'error' });
    } finally {
      setSavingCategoria(false);
    }
  }

  async function handleDeleteMarca(id: string) {
    const confirmed = await showAlert({
      title: 'Atenção',
      message: 'Excluir esta marca? Isso pode afetar produtos cadastrados.',
      type: 'warning',
      showConfirm: true
    });
    if (!confirmed) return;
    
    try {
      const { error } = await supabase.from('marcas').delete().eq('id', id);
      if (error) throw error;
      fetchMarcas();
    } catch (error) {
      console.error(error);
      showAlert({ title: 'Erro', message: 'Erro ao excluir marca.', type: 'error' });
    }
  }

  async function handleDeleteCategoria(id: string) {
    const confirmed = await showAlert({
      title: 'Atenção',
      message: 'Excluir esta categoria? Isso pode afetar produtos cadastrados.',
      type: 'warning',
      showConfirm: true
    });
    if (!confirmed) return;
    
    try {
      const { error } = await supabase.from('categorias').delete().eq('id', id);
      if (error) throw error;
      fetchCategorias();
    } catch (error) {
      console.error(error);
      showAlert({ title: 'Erro', message: 'Erro ao excluir categoria.', type: 'error' });
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Container Marcas */}
      <div className="bg-white dark:bg-gray-800 shadow-soft rounded-xl p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-vanta-blue/10 flex items-center justify-center">
            <Tags className="w-5 h-5 text-vanta-blue" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Marcas</h2>
            <p className="text-sm text-gray-500">Fabricantes dos seus produtos</p>
          </div>
        </div>

        <form onSubmit={handleAddMarca} className="flex gap-2 mb-6">
          <input 
            type="text" 
            value={novaMarca} 
            onChange={e => setNovaMarca(e.target.value)} 
            placeholder="Ex: Apple" 
            className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 p-2.5 text-sm outline-none focus:border-vanta-blue focus:ring-2 focus:ring-vanta-blue/20 transition-all"
          />
          <button type="submit" disabled={savingMarca || !novaMarca.trim()} className="px-4 py-2.5 bg-vanta-blue text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center font-medium">
            {savingMarca ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Adicionar'}
          </button>
        </form>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          {loadingMarcas ? (
            <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-vanta-blue" /></div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
              {marcas.length === 0 ? (
                <li className="p-4 text-center text-sm text-gray-500">Nenhuma marca cadastrada.</li>
              ) : (
                marcas.map(marca => (
                  <li key={marca.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{marca.nome}</span>
                    <button onClick={() => handleDeleteMarca(marca.id)} className="text-red-500 hover:text-red-700 p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </div>

      {/* Container Categorias */}
      <div className="bg-white dark:bg-gray-800 shadow-soft rounded-xl p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-vanta-orange/10 flex items-center justify-center">
            <Layers className="w-5 h-5 text-vanta-orange" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Categorias</h2>
            <p className="text-sm text-gray-500">Departamentos da loja</p>
          </div>
        </div>

        <form onSubmit={handleAddCategoria} className="flex gap-2 mb-6">
          <input 
            type="text" 
            value={novaCategoria} 
            onChange={e => setNovaCategoria(e.target.value)} 
            placeholder="Ex: Celulares" 
            className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 p-2.5 text-sm outline-none focus:border-vanta-blue focus:ring-2 focus:ring-vanta-blue/20 transition-all"
          />
          <button type="submit" disabled={savingCategoria || !novaCategoria.trim()} className="px-4 py-2.5 bg-vanta-blue text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center font-medium">
            {savingCategoria ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Adicionar'}
          </button>
        </form>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          {loadingCategorias ? (
            <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-vanta-blue" /></div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
              {categorias.length === 0 ? (
                <li className="p-4 text-center text-sm text-gray-500">Nenhuma categoria cadastrada.</li>
              ) : (
                categorias.map(cat => (
                  <li key={cat.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{cat.nome}</span>
                    <button onClick={() => handleDeleteCategoria(cat.id)} className="text-red-500 hover:text-red-700 p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
