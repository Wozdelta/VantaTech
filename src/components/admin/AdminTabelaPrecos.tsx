import { useState, useEffect, useRef } from 'react';
import { DollarSign, Plus, Save, Trash2, Edit2, X, Tag, ChevronDown, ChevronUp, Search, TrendingUp, Layers, GripVertical, Copy, Sparkles, Loader2, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAlert } from '../../contexts/AlertContext';
import { useRealtimeUpdate } from '../../hooks/useRealtimeUpdate';
import { CustomSelect } from '../ui/CustomSelect';
import { generatePDFCatalog } from '../../utils/exportPDF';

interface Marca {
  id: string;
  nome: string;
}

interface Variacao {
  id: string;
  grupo_id: string;
  nome: string;
  valor_pago: number;
  valor_venda: number;
  ordem?: number;
  venda_excelente?: number | null;
  venda_bom?: number | null;
  venda_regular?: number | null;
  ia_atualizado_em?: string | null;
}

interface Grupo {
  id: string;
  nome: string;
  marca_id: string;
  ordem?: number;
  variacoes: Variacao[];
}

const SUGESTOES_VARIEDADES = [
  "64GB", "128GB", "256GB", "512GB", "1TB",
  "Pro 128GB", "Pro 256GB", "Pro 512GB", "Pro 1TB",
  "Pro Max 128GB", "Pro Max 256GB", "Pro Max 512GB", "Pro Max 1TB",
  "Plus 128GB", "Plus 256GB", "Plus 512GB",
  "Ultra 256GB", "Ultra 512GB", "Ultra 1TB",
  "Normal 128GB", "Normal 256GB"
];

export default function AdminTabelaPrecos() {
  const { showAlert } = useAlert();
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMarcaId, setSelectedMarcaId] = useState<string>('all');
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const dragGroupItem = useRef<number | null>(null);
  const dragVariantItem = useRef<{grupoId: string, index: number} | null>(null);
  
  // Create States
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroup, setNewGroup] = useState({ nome: '', marca_id: '' });
  
  const [addingVariantTo, setAddingVariantTo] = useState<string | null>(null);
  const [newVariant, setNewVariant] = useState({ nome: '', valor_pago: '', valor_venda: '' });
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [editingVariantData, setEditingVariantData] = useState({ nome: '', valor_pago: '', valor_venda: '' });

  const [isUpdatingAI, setIsUpdatingAI] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useRealtimeUpdate(['tabela_precos_grupos', 'tabela_precos_variacoes', 'marcas'], fetchData);

  const handleUpdateAIPrices = async () => {
    setIsUpdatingAI(true);
    try {
      showAlert({ type: 'success', message: 'Iniciando atualização pela Inteligência Artificial... Isso pode demorar alguns segundos.' });
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch('/api/update-ai-prices', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      if (!res.ok) throw new Error('Falha na API da Inteligência Artificial');
      
      const data = await res.json();
      showAlert({ type: 'success', message: data.message || 'Atualização concluída com sucesso!' });
      
      fetchData(); // recarrega a tabela
    } catch (err) {
      console.error(err);
      showAlert({ type: 'error', message: 'Ocorreu um erro ao atualizar os preços via IA.' });
    } finally {
      setIsUpdatingAI(false);
    }
  };

  async function fetchData() {
    try {
      const [marcasRes, gruposRes, variacoesRes] = await Promise.all([
        supabase.from('marcas').select('*').order('nome'),
        supabase.from('tabela_precos_grupos').select('*').order('ordem', { ascending: true, nullsFirst: false }).order('nome'),
        supabase.from('tabela_precos_variacoes').select('*').order('ordem', { ascending: true, nullsFirst: false }).order('valor_venda')
      ]);

      let variacoesData = variacoesRes.data || [];
      
      // Fallback: se der erro por falta da coluna 'ordem'
      if (variacoesRes.error && variacoesRes.error.message.includes('ordem')) {
        const fallbackRes = await supabase.from('tabela_precos_variacoes').select('*').order('valor_venda');
        variacoesData = fallbackRes.data || [];
      }

      if (marcasRes.error) throw marcasRes.error;
      
      const marcasData = marcasRes.data || [];
      const gruposData = gruposRes.data || [];

      // Montar a árvore
      const gruposTree = gruposData.map(g => ({
        ...g,
        variacoes: variacoesData.filter(v => v.grupo_id === g.id)
      }));

      setMarcas(marcasData);
      setGrupos(gruposTree);
    } catch (err) {
      console.error('Erro ao buscar dados (As tabelas existem?):', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => 
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const handleGroupDragStart = (e: React.DragEvent, index: number) => {
    if (searchTerm || selectedMarcaId !== 'all') return;
    dragGroupItem.current = index;
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
  };

  const handleGroupDragEnter = (e: React.DragEvent, index: number) => {
    if (searchTerm || selectedMarcaId !== 'all') return;
    if (dragGroupItem.current !== null && dragGroupItem.current !== index) {
      const newGrupos = [...grupos];
      const draggedItemContent = newGrupos[dragGroupItem.current];
      newGrupos.splice(dragGroupItem.current, 1);
      newGrupos.splice(index, 0, draggedItemContent);
      setGrupos(newGrupos);
      dragGroupItem.current = index;
    }
  };

  const handleGroupDragEnd = async () => {
    if (dragGroupItem.current === null || searchTerm || selectedMarcaId !== 'all') {
      dragGroupItem.current = null;
      return;
    }
    
    dragGroupItem.current = null;
    
    try {
      await Promise.all(grupos.map((g, index) => 
        supabase.from('tabela_precos_grupos').update({ ordem: index }).eq('id', g.id)
      ));
    } catch (err) {
      console.error('Erro ao salvar ordem:', err);
    }
  };

  const handleVariantDragStart = (e: React.DragEvent, grupoId: string, index: number) => {
    dragVariantItem.current = { grupoId, index };
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
  };

  const handleVariantDragEnter = (e: React.DragEvent, grupoId: string, index: number) => {
    if (dragVariantItem.current && dragVariantItem.current.grupoId === grupoId && dragVariantItem.current.index !== index) {
      const newGrupos = [...grupos];
      const grupoIndex = newGrupos.findIndex(g => g.id === grupoId);
      if (grupoIndex === -1) return;
      
      const newVariacoes = [...newGrupos[grupoIndex].variacoes];
      const draggedItemContent = newVariacoes[dragVariantItem.current.index];
      newVariacoes.splice(dragVariantItem.current.index, 1);
      newVariacoes.splice(index, 0, draggedItemContent);
      
      newGrupos[grupoIndex].variacoes = newVariacoes;
      setGrupos(newGrupos);
      dragVariantItem.current = { grupoId, index };
    }
  };

  const handleVariantDragEnd = async (grupoId: string) => {
    if (!dragVariantItem.current) return;
    dragVariantItem.current = null;
    
    const grupo = grupos.find(g => g.id === grupoId);
    if (!grupo) return;

    try {
      const { error } = await supabase.from('tabela_precos_variacoes').update({ ordem: 0 }).eq('id', grupo.variacoes[0]?.id || 'null');
      if (error && error.message.includes('ordem')) {
        showAlert({ type: 'warning', message: 'Execute o SQL sugerido para habilitar a ordenação.' });
        return;
      }
      
      await Promise.all(grupo.variacoes.map((v, index) => 
        supabase.from('tabela_precos_variacoes').update({ ordem: index }).eq('id', v.id)
      ));
    } catch (err) {
      console.error('Erro ao salvar ordem das variações:', err);
    }
  };

  const handleSaveGroup = async () => {
    if (!newGroup.nome || !newGroup.marca_id) {
      showAlert({ type: 'warning', message: 'Preencha o Nome e a Marca do aparelho base.' });
      return;
    }
    try {
      const { data, error } = await supabase.from('tabela_precos_grupos')
        .insert([{ nome: newGroup.nome, marca_id: newGroup.marca_id }])
        .select()
        .single();
      
      if (error) throw error;
      showAlert({ type: 'success', message: 'Aparelho Base criado!' });
      setIsAddingGroup(false);
      setNewGroup({ nome: '', marca_id: '' });
      // Adicionar à lista imediatamente
      setGrupos(prev => [...prev, { ...data, variacoes: [] }].sort((a, b) => a.nome.localeCompare(b.nome)));
      setExpandedGroups(prev => [...prev, data.id]);
    } catch (err) {
      console.error(err);
      showAlert({ type: 'error', message: 'Erro ao criar aparelho.' });
    }
  };

  const handleSaveVariant = async (grupo_id: string) => {
    if (!newVariant.nome) {
      showAlert({ type: 'warning', message: 'Preencha o nome da variação (ex: Pro Max 256GB).' });
      return;
    }
    try {
      const { data, error } = await supabase.from('tabela_precos_variacoes')
        .insert([{
          grupo_id,
          nome: newVariant.nome,
          valor_pago: Number(newVariant.valor_pago) || 0,
          valor_venda: Number(newVariant.valor_venda) || 0,
          ia_atualizado_em: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      showAlert({ type: 'success', message: 'Variação adicionada!' });
      setAddingVariantTo(null);
      setNewVariant({ nome: '', valor_pago: '', valor_venda: '' });
      
      setGrupos(prev => prev.map(g => {
        if (g.id === grupo_id) {
          return { ...g, variacoes: [...g.variacoes, data].sort((a, b) => a.valor_venda - b.valor_venda) };
        }
        return g;
      }));
    } catch (err) {
      console.error(err);
      showAlert({ type: 'error', message: 'Erro ao criar variação.' });
    }
  };

  const handleEditVariantSubmit = async (grupo_id: string, variacao_id: string) => {
    if (!editingVariantData.nome || !editingVariantData.valor_pago || !editingVariantData.valor_venda) {
      showAlert({ type: 'warning', message: 'Preencha todos os campos.' });
      return;
    }
    
    try {
      const payload = {
        nome: editingVariantData.nome,
        valor_pago: parseFloat(editingVariantData.valor_pago),
        valor_venda: parseFloat(editingVariantData.valor_venda),
        ia_atualizado_em: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('tabela_precos_variacoes')
        .update(payload)
        .eq('id', variacao_id)
        .select()
        .single();
        
      if (error) throw error;
      
      showAlert({ type: 'success', message: 'Variação atualizada!' });
      setEditingVariantId(null);
      
      setGrupos(prev => prev.map(g => {
        if (g.id === grupo_id) {
          return { 
            ...g, 
            variacoes: g.variacoes.map(v => v.id === variacao_id ? data : v).sort((a, b) => a.valor_venda - b.valor_venda) 
          };
        }
        return g;
      }));
    } catch (err) {
      console.error(err);
      showAlert({ type: 'error', message: 'Erro ao atualizar variação.' });
    }
  };

  const handleDeleteGroup = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = await showAlert({
      title: 'Atenção',
      message: 'Deletar este aparelho e TODAS as variações dele?',
      type: 'warning',
      showConfirm: true
    });
    if (!confirmed) return;
    try {
      await supabase.from('tabela_precos_grupos').delete().eq('id', id);
      setGrupos(prev => prev.filter(g => g.id !== id));
      showAlert({ type: 'success', message: 'Aparelho apagado.' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteVariant = async (grupo_id: string, variacao_id: string) => {
    const confirmed = await showAlert({ title: 'Atenção', message: 'Deletar variação?', type: 'warning', showConfirm: true });
    if (!confirmed) return;
    try {
      await supabase.from('tabela_precos_variacoes').delete().eq('id', variacao_id);
      setGrupos(prev => prev.map(g => {
        if (g.id === grupo_id) {
          return { ...g, variacoes: g.variacoes.filter(v => v.id !== variacao_id) };
        }
        return g;
      }));
      showAlert({ type: 'success', message: 'Variação apagada.' });
    } catch (err) {
      console.error(err);
    }
  };

  // Filtragem
  const filteredGrupos = grupos.filter(g => {
    const matchMarca = selectedMarcaId === 'all' || g.marca_id === selectedMarcaId;
    const matchSearch = g.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        g.variacoes.some(v => v.nome.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchMarca && matchSearch;
  });

  const handleCopyGroup = (grupo: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!grupo.variacoes || grupo.variacoes.length === 0) {
      showAlert({ title: 'Aviso', message: 'Nenhuma variação para copiar.', type: 'error' });
      return;
    }

    let text = `📱 *Tabela de Preço: ${grupo.nome}*\n\n`;
    
    grupo.variacoes.forEach((v: any) => {
      const formatado = Number(v.valor_venda).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      text += `• ${grupo.nome} ${v.nome} ➔ *${formatado}*\n`;
    });

    navigator.clipboard.writeText(text).then(() => {
      showAlert({ title: 'Copiado!', message: 'Tabela copiada para a área de transferência.', type: 'success' });
    }).catch(() => {
      showAlert({ title: 'Erro', message: 'Não foi possível copiar.', type: 'error' });
    });
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-4 tracking-tight">
            <div className="w-14 h-14 bg-vanta-blue/10 rounded-2xl flex items-center justify-center">
              <DollarSign className="w-8 h-8 text-vanta-blue" />
            </div>
            Tabela de Preços
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium max-w-xl">
            Gerencie os valores de custo e venda dos aparelhos. Crie aparelhos base e adicione variações de cor ou capacidade.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              showAlert({ type: 'success', message: 'Gerando PDF... Aguarde.' });
              setTimeout(() => generatePDFCatalog(grupos), 100);
            }}
            className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 px-6 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-sm hover:-translate-y-1 whitespace-nowrap"
          >
            <FileText className="w-5 h-5 text-red-500" />
            <span className="hidden sm:inline">Exportar PDF</span>
          </button>
          <button
            onClick={handleUpdateAIPrices}
            disabled={isUpdatingAI}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-indigo-200 dark:shadow-none hover:-translate-y-1 whitespace-nowrap"
          >
            {isUpdatingAI ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-yellow-300" />}
            <span className="hidden sm:inline">Gerar Preços com IA</span>
          </button>
          <button
            onClick={() => setIsAddingGroup(true)}
            disabled={isAddingGroup}
            className="bg-gray-900 hover:bg-black dark:bg-vanta-blue dark:hover:bg-vanta-darkblue text-white px-6 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-gray-200 dark:shadow-none hover:-translate-y-1 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Novo Aparelho Base</span>
          </button>
        </div>
      </div>

      {/* Toolbar: Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="relative w-full lg:w-96">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar aparelho ou variação..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-gray-800 border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-vanta-blue shadow-sm text-gray-900 dark:text-white"
          />
        </div>
        
        {/* Pills Filtro de Marca */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <button
            onClick={() => setSelectedMarcaId('all')}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
              selectedMarcaId === 'all' 
                ? 'bg-vanta-blue text-white shadow-md shadow-vanta-blue/20' 
                : 'bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Todas as Marcas
          </button>
          {marcas.map(marca => (
            <button
              key={marca.id}
              onClick={() => setSelectedMarcaId(marca.id)}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                selectedMarcaId === marca.id 
                  ? 'bg-vanta-blue text-white shadow-md shadow-vanta-blue/20' 
                  : 'bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {marca.nome}
            </button>
          ))}
        </div>
      </div>

      {/* Add Group Form */}
      {isAddingGroup && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border-2 border-vanta-blue/30 animate-slide-down">
          <div className="flex items-center gap-3 mb-4">
            <Layers className="w-5 h-5 text-vanta-blue" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Criar Aparelho Base (Ex: iPhone 13)</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 mb-1.5 block">Nome do Aparelho</label>
              <input
                type="text"
                value={newGroup.nome}
                onChange={e => setNewGroup({...newGroup, nome: e.target.value})}
                placeholder="Ex: iPhone 15 Pro"
                className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-vanta-blue text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 mb-1.5 block">Marca</label>
              <CustomSelect
                value={newGroup.marca_id}
                onChange={val => setNewGroup({...newGroup, marca_id: val})}
                placeholder="Selecione uma marca..."
                options={marcas.map(m => ({ value: m.id, label: m.nome }))}
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 mt-6">
            <button onClick={() => setIsAddingGroup(false)} className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
              Cancelar
            </button>
            <button onClick={handleSaveGroup} className="px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-sm transition-all shadow-md">
              Salvar Aparelho
            </button>
          </div>
        </div>
      )}

      {/* Tabela de Accordions */}
      {loading ? (
        <div className="text-center py-20 text-gray-400 font-medium">Carregando tabela inteligente...</div>
      ) : filteredGrupos.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
          <DollarSign className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Nenhum aparelho encontrado</h3>
          <p className="text-gray-500 text-sm mt-1">Crie um novo aparelho base para começar a montar sua tabela.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGrupos.map((grupo, index) => {
            const isExpanded = expandedGroups.includes(grupo.id);
            const marcaNome = marcas.find(m => m.id === grupo.marca_id)?.nome || 'Sem marca';
            const isDragEnabled = !searchTerm && selectedMarcaId === 'all' && !isExpanded;
            
            return (
              <div 
                key={grupo.id} 
                draggable={isDragEnabled}
                onDragStart={(e) => handleGroupDragStart(e, index)}
                onDragEnter={(e) => handleGroupDragEnter(e, index)}
                onDragEnd={handleGroupDragEnd}
                onDragOver={(e) => e.preventDefault()}
                className={`bg-white dark:bg-gray-800 rounded-2xl transition-all duration-300 ${isExpanded ? 'shadow-lg border-vanta-blue/50 z-10' : 'shadow-sm border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'} border overflow-hidden relative`}
              >
                
                {/* Header do Accordion */}
                <div 
                  onClick={() => toggleGroup(grupo.id)}
                  className="px-6 py-5 cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    {isDragEnabled && (
                      <GripVertical className="w-5 h-5 text-gray-300 dark:text-gray-500 cursor-move hover:text-vanta-blue transition-colors mr-2" />
                    )}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isExpanded ? 'bg-vanta-blue text-white' : 'bg-gray-100 dark:bg-gray-900 text-gray-500 group-hover:bg-vanta-blue/10 group-hover:text-vanta-blue'}`}>
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-gray-900 dark:text-white leading-none mb-1.5">{grupo.nome}</h3>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="font-bold text-gray-500 bg-gray-100 dark:bg-gray-900 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Tag className="w-3 h-3" /> {marcaNome}
                        </span>
                        <span className="font-medium text-gray-400">
                          {grupo.variacoes.length} variaç{grupo.variacoes.length === 1 ? 'ão' : 'ões'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => handleCopyGroup(grupo, e)}
                      className="p-2 text-gray-400 hover:text-vanta-blue hover:bg-vanta-blue/10 rounded-xl transition-colors"
                      title="Copiar tabela de preços"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setAddingVariantTo(grupo.id); if (!isExpanded) toggleGroup(grupo.id); }}
                      className="p-2 text-vanta-blue hover:bg-vanta-blue/10 rounded-xl transition-colors font-bold text-sm hidden sm:flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> Variedade
                    </button>
                    <button 
                      onClick={(e) => handleDeleteGroup(grupo.id, e)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Conteúdo Expandido (Variedades) */}
                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20 p-6 animate-slide-down">
                    
                    {grupo.variacoes.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="text-[10px] sm:text-[10px] font-black text-gray-400 uppercase tracking-wider">
                              <th className="pb-3 px-2 sm:px-4 max-sm:sticky max-sm:left-0 max-sm:z-20 max-sm:bg-gray-50 max-sm:dark:bg-[#13151a] max-sm:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Modelo / Variedade</th>
                              <th className="pb-3 px-2 sm:px-4">Custo</th>
                              <th className="pb-3 px-2 sm:px-4">Venda</th>
                              <th className="pb-3 px-2 sm:px-4 text-emerald-500">Excelente Estado</th>
                              <th className="pb-3 px-2 sm:px-4 text-blue-500">Bom Estado</th>
                              <th className="pb-3 px-2 sm:px-4 text-orange-500">Estado Regular</th>
                              <th className="pb-3 px-4 hidden sm:table-cell">Lucro</th>
                              <th className="pb-3 px-2 sm:px-4 text-right">Ação</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {grupo.variacoes.map((variacao, index) => {
                              const lucroReal = variacao.valor_venda - variacao.valor_pago;
                              const margem = variacao.valor_pago > 0 ? ((lucroReal / variacao.valor_pago) * 100).toFixed(0) : '100';
                              
                              return editingVariantId === variacao.id ? (
                                <tr key={variacao.id} className="bg-gray-50 dark:bg-gray-800/50">
                                  <td className="py-2 px-4 max-sm:sticky max-sm:left-0 max-sm:z-10 max-sm:bg-gray-50 max-sm:dark:bg-[#1d222b]">
                                    <input 
                                      type="text" 
                                      value={editingVariantData.nome} 
                                      onChange={e => setEditingVariantData({...editingVariantData, nome: e.target.value})} 
                                      className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-vanta-blue" 
                                      placeholder="Nome"
                                    />
                                  </td>
                                  <td className="py-2 px-4">
                                    <input 
                                      type="number" 
                                      value={editingVariantData.valor_pago} 
                                      onChange={e => setEditingVariantData({...editingVariantData, valor_pago: e.target.value})} 
                                      className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-vanta-blue" 
                                    />
                                  </td>
                                  <td className="py-2 px-4">
                                    <input 
                                      type="number" 
                                      value={editingVariantData.valor_venda} 
                                      onChange={e => setEditingVariantData({...editingVariantData, valor_venda: e.target.value})} 
                                      className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-vanta-blue" 
                                    />
                                  </td>
                                  <td className="py-2 px-4"><span className="text-gray-400 text-xs italic opacity-50">Auto</span></td>
                                  <td className="py-2 px-4"><span className="text-gray-400 text-xs italic opacity-50">Auto</span></td>
                                  <td className="py-2 px-4"><span className="text-gray-400 text-xs italic opacity-50">Auto</span></td>
                                  <td className="py-2 px-4">
                                    <div className="text-gray-400 text-xs italic opacity-50">Auto</div>
                                  </td>
                                  <td className="py-2 px-4 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <button 
                                        onClick={() => handleEditVariantSubmit(grupo.id, variacao.id)}
                                        className="p-1.5 text-vanta-blue hover:bg-vanta-blue/10 rounded-md transition-colors"
                                        title="Salvar"
                                      >
                                        <Save className="w-4 h-4" />
                                      </button>
                                      <button 
                                        onClick={() => setEditingVariantId(null)}
                                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
                                        title="Cancelar"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ) : (
                                <tr 
                                  key={variacao.id} 
                                  className="hover:bg-white dark:hover:bg-gray-800 transition-colors group/row"
                                  draggable
                                  onDragStart={(e) => handleVariantDragStart(e, grupo.id, index)}
                                  onDragEnter={(e) => handleVariantDragEnter(e, grupo.id, index)}
                                  onDragEnd={() => handleVariantDragEnd(grupo.id)}
                                  onDragOver={(e) => e.preventDefault()}
                                >
                                  <td className="py-3 px-2 sm:px-4 font-bold text-gray-900 dark:text-white text-xs sm:text-sm flex items-center gap-1 sm:gap-2 max-sm:sticky max-sm:left-0 max-sm:z-10 max-sm:bg-gray-50 max-sm:dark:bg-[#13151a] max-sm:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] max-sm:group-hover/row:bg-white max-sm:dark:group-hover/row:bg-gray-800">
                                    <div className="text-gray-300 dark:text-gray-600 cursor-grab hover:text-gray-500">
                                      <GripVertical className="w-3 h-3 sm:w-4 sm:h-4" />
                                    </div>
                                    <span className="truncate max-w-[100px] sm:max-w-none">{variacao.nome}</span>
                                  </td>
                                  <td className="py-3 px-2 sm:px-4 font-medium text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                                    {Number(variacao.valor_pago).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                  </td>
                                  <td className="py-3 px-2 sm:px-4 font-black text-gray-900 dark:text-white text-xs sm:text-sm">
                                    {Number(variacao.valor_venda).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                  </td>
                                  <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm">
                                    <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 py-1 px-2 rounded-md font-bold">
                                      {variacao.venda_excelente ? Number(variacao.venda_excelente).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
                                    </span>
                                  </td>
                                  <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm">
                                    <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 py-1 px-2 rounded-md font-bold">
                                      {variacao.venda_bom ? Number(variacao.venda_bom).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
                                    </span>
                                  </td>
                                  <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm">
                                    <span className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 py-1 px-2 rounded-md font-bold">
                                      {variacao.venda_regular ? Number(variacao.venda_regular).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 hidden sm:table-cell">
                                    <div className="flex flex-col">
                                      <span className="font-bold text-green-600 dark:text-green-400 text-sm flex items-center gap-1">
                                        <TrendingUp className="w-3.5 h-3.5" />
                                        {lucroReal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                      </span>
                                      <span className="text-[10px] font-bold text-gray-400 uppercase">Margem: {margem}%</span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-2 sm:px-4 text-right">
                                    <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover/row:opacity-100 transition-all">
                                      <button 
                                        onClick={() => {
                                          setEditingVariantId(variacao.id);
                                          setEditingVariantData({
                                            nome: variacao.nome,
                                            valor_pago: variacao.valor_pago.toString(),
                                            valor_venda: variacao.valor_venda.toString()
                                          });
                                        }}
                                        className="p-1.5 text-gray-400 hover:text-vanta-blue transition-colors rounded-lg"
                                        title="Editar Variação"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteVariant(grupo.id, variacao.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg"
                                        title="Apagar Variação"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-sm text-gray-500 italic">
                        Nenhuma variação cadastrada ainda.
                      </div>
                    )}

                    {/* Formulário In-line de Nova Variação */}
                    {addingVariantTo === grupo.id ? (
                      <div className="mt-4 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row items-end gap-3 animate-fade-in">
                        <div className="w-full md:flex-1 relative">
                          <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Variedade (Ex: Pro 128GB)</label>
                          <input 
                            type="text" 
                            value={newVariant.nome} 
                            onChange={e => {
                              setNewVariant({...newVariant, nome: e.target.value});
                              setShowSuggestions(true);
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            onKeyDown={(e) => {
                              if (e.key === 'Tab' && showSuggestions && newVariant.nome) {
                                const variacoesExistentes = grupo.variacoes.map(v => v.nome.toLowerCase());
                                const sugestoesFiltradas = SUGESTOES_VARIEDADES.filter(sug => 
                                  sug.toLowerCase().includes(newVariant.nome.toLowerCase()) && 
                                  !variacoesExistentes.includes(sug.toLowerCase())
                                );
                                if (sugestoesFiltradas.length > 0) {
                                  e.preventDefault(); // Previne ir para o próximo campo
                                  setNewVariant({...newVariant, nome: sugestoesFiltradas[0]});
                                  setShowSuggestions(false);
                                }
                              }
                            }}
                            className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-vanta-blue" 
                            placeholder="Nome da variação" 
                          />
                          
                          {/* Dropdown de Sugestões */}
                          {showSuggestions && newVariant.nome && (
                            (() => {
                              const variacoesExistentes = grupo.variacoes.map(v => v.nome.toLowerCase());
                              const sugestoesFiltradas = SUGESTOES_VARIEDADES.filter(sug => 
                                sug.toLowerCase().includes(newVariant.nome.toLowerCase()) && 
                                !variacoesExistentes.includes(sug.toLowerCase())
                              ).slice(0, 5);

                              if (sugestoesFiltradas.length === 0) return null;

                              return (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl z-10 overflow-hidden animate-slide-down">
                                  {sugestoesFiltradas.map(sug => (
                                    <button
                                      key={sug}
                                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-gray-700 dark:text-gray-300 border-b border-gray-50 dark:border-gray-700/50 last:border-0"
                                      onMouseDown={(e) => {
                                        e.preventDefault(); // Evita que o input perca o foco antes do clique
                                        setNewVariant({...newVariant, nome: sug});
                                        setShowSuggestions(false);
                                      }}
                                    >
                                      {sug}
                                    </button>
                                  ))}
                                </div>
                              );
                            })()
                          )}
                        </div>
                        <div className="w-full md:w-32">
                          <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Valor Pago (Custo)</label>
                          <input type="number" value={newVariant.valor_pago} onChange={e => setNewVariant({...newVariant, valor_pago: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-vanta-blue" placeholder="R$ 0,00" />
                        </div>
                        <div className="w-full md:w-32">
                          <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Valor Venda</label>
                          <input type="number" value={newVariant.valor_venda} onChange={e => setNewVariant({...newVariant, valor_venda: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-vanta-blue" placeholder="R$ 0,00" />
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto mt-4 md:mt-0">
                          <button onClick={() => setAddingVariantTo(null)} className="p-2.5 text-gray-400 hover:text-red-500 bg-gray-50 dark:bg-gray-900 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors flex-1 md:flex-none flex justify-center">
                            <X className="w-5 h-5" />
                          </button>
                          <button onClick={() => handleSaveVariant(grupo.id)} className="p-2.5 text-white bg-green-500 hover:bg-green-600 rounded-xl transition-colors flex-1 md:flex-none flex justify-center shadow-md">
                            <Save className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setAddingVariantTo(grupo.id)}
                        className="mt-4 w-full py-3 border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-vanta-blue hover:text-vanta-blue text-gray-400 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" /> Adicionar Derivado / Variação
                      </button>
                    )}

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
