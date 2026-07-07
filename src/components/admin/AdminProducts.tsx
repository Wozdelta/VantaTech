import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAlert } from '../../contexts/AlertContext';
import { Plus, Trash2, Image as ImageIcon, Loader2, X, Edit, UploadCloud, Palette, Smartphone, Package, Search, ChevronDown, Check, Undo2, LayoutGrid, List } from 'lucide-react';
import { Reorder } from 'framer-motion';
import RichTextEditor from '../ui/RichTextEditor';
import ImageCropper from './ImageCropper';

type Product = {
  id: string;
  nome: string;
  marca: string;
  condicao: string;
  memoria: string;
  cor: string;
  preco: number;
  preco_antigo: number | null;
  badge: string | null;
  categoria: string;
  imagem_url: string;
  ativo: boolean;
  descricao: string | null;
  estoque: number | null;
  galeria: { url: string; cor: string; cor_tipo?: string; cor_valor?: string; memoria?: string; bateria?: string; mostrar_bateria?: boolean; preco?: string; preco_antigo?: string }[];
  is_adicional?: boolean;
};

type ImageUploadItem = {
  id: string;
  file?: File;
  originalFile?: File;
  preview: string;
  originalPreview?: string;
  isVariant?: boolean;
  color: string;
  existingUrl?: string;
  storage?: string;
  battery?: string;
  showBattery?: boolean;
  preco?: string;
  preco_antigo?: string;
};

type ProductColor = {
  id: string;
  nome: string;
  tipo: 'hex' | 'image';
  valor: string; // hex code or image URL/preview
  file?: File; // file to upload if new image
};

export default function AdminProducts() {
  const { showAlert } = useAlert();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'detailed'|'minimal'>('detailed');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [productType, setProductType] = useState<'aparelho' | 'item' | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'Produtos' | 'Adicionais'>('Produtos');

  const [editId, setEditId] = useState<string | null>(null);
  const [temDesconto, setTemDesconto] = useState(false);
  const [croppingImage, setCroppingImage] = useState<ImageUploadItem | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    marca: '',
    condicao: 'Novo',
    memoria: '',
    preco: '',
    preco_antigo: '',
    badge: '',
    categoria: 'Celulares',
    descricao: '',
    estoque: ''
  });

  const [images, setImages] = useState<ImageUploadItem[]>([]);
  const [marcas, setMarcas] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);

  // Cores do Produto (Local)
  const [productColors, setProductColors] = useState<ProductColor[]>([]);
  const [novaCorNome, setNovaCorNome] = useState('');
  const [novaCorTipo, setNovaCorTipo] = useState<'hex' | 'image'>('hex');
  const [novaCorHex, setNovaCorHex] = useState('#000000');
  const [novaCorFile, setNovaCorFile] = useState<File | null>(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchAdicionais, setSearchAdicionais] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPreco, setFilterPreco] = useState('');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Drag and drop referências (Removidas, usando framer-motion)

  useEffect(() => {
    fetchProducts();
    fetchAttributes();
  }, []);

  async function fetchAttributes() {
    try {
      const [marcasRes, categoriasRes] = await Promise.all([
        supabase.from('marcas').select('*').order('nome'),
        supabase.from('categorias').select('*').order('nome')
      ]);
      if (marcasRes.data) setMarcas(marcasRes.data);
      if (categoriasRes.data) setCategorias(categoriasRes.data);
    } catch (e) {
      console.error('Erro ao buscar atributos:', e);
    }
  }

  async function fetchProducts() {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('criado_em', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = await showAlert({
      title: 'Excluir Produto?',
      message: 'Tem certeza que deseja excluir este produto?',
      type: 'warning',
      showConfirm: true,
      confirmText: 'Excluir',
      cancelText: 'Cancelar'
    });

    if (!confirmed) return;

    try {
      const { error } = await supabase.from('produtos').delete().eq('id', id);
      if (error) throw error;
      fetchProducts();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      showAlert({ title: 'Erro', message: 'Erro ao excluir produto.', type: 'error' });
    }
  }

  async function handleToggleActive(id: string, currentAtivo: boolean) {
    try {
      const { error } = await supabase
        .from('produtos')
        .update({ ativo: !currentAtivo })
        .eq('id', id);

      if (error) throw error;
      setProducts(products.map(p => p.id === id ? { ...p, ativo: !currentAtivo } : p));
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      showAlert({ title: 'Erro', message: 'Erro ao atualizar status.', type: 'error' });
    }
  }

  async function handleToggleAdicional(product: Product) {
    const isCurrentlyAdicional = product.is_adicional || false;
    
    if (!isCurrentlyAdicional) {
      const activeCount = products.filter(p => p.categoria?.toLowerCase().includes('acessóri') && p.is_adicional).length;
      if (activeCount >= 3) {
        showAlert({ title: 'Limite Atingido', message: 'Você só pode ativar no máximo 3 acessórios como adicionais.', type: 'warning' });
        return;
      }
    }

    try {
      const { error } = await supabase
        .from('produtos')
        .update({ is_adicional: !isCurrentlyAdicional })
        .eq('id', product.id);

      if (error) throw error;
      setProducts(products.map(p => p.id === product.id ? { ...p, is_adicional: !isCurrentlyAdicional } : p));
    } catch (error) {
      console.error('Erro ao atualizar adicional:', error);
      showAlert({ title: 'Erro de Banco de Dados', message: 'Não foi possível salvar. Certifique-se de que a coluna "is_adicional" (booleano) foi criada na tabela "produtos".', type: 'error' });
    }
  }

  function handleEdit(product: Product) {
    setProductType(product.cor || product.memoria || (product.galeria && product.galeria.length > 0 && product.galeria.some((g:any)=>g.cor)) ? 'aparelho' : 'item');
    setEditId(product.id);
    setFormData({
      nome: product.nome,
      marca: product.marca,
      condicao: product.condicao,
      memoria: product.memoria || '',
      preco: product.preco.toString(),
      preco_antigo: product.preco_antigo ? product.preco_antigo.toString() : '',
      badge: product.badge || '',
      categoria: product.categoria,
      descricao: product.descricao || '',
      estoque: product.estoque !== null && product.estoque !== undefined ? product.estoque.toString() : ''
    });
    setTemDesconto(!!product.preco_antigo);

    if (product.galeria && product.galeria.length > 0) {
      // Extrair cores únicas da galeria
      const extractedColors: ProductColor[] = [];
      product.galeria.forEach(g => {
        if (g.cor && !extractedColors.find(c => c.nome === g.cor)) {
          extractedColors.push({
            id: Math.random().toString(),
            nome: g.cor,
            tipo: (g.cor_tipo as 'hex' | 'image') || 'hex',
            valor: g.cor_valor || '#ccc'
          });
        }
      });
      setProductColors(extractedColors);

      setImages(product.galeria.map((g: any, idx) => ({
        id: `existing-${idx}`,
        preview: g.url,
        originalPreview: g.url,
        isVariant: !!(g.cor || g.memoria || g.bateria || g.preco || g.preco_antigo),
        color: g.cor || '',
        existingUrl: g.url,
        storage: g.memoria || '',
        battery: g.bateria || '',
        showBattery: g.mostrar_bateria || false,
        preco: g.preco || '',
        preco_antigo: g.preco_antigo || ''
      })));
    } else if (product.imagem_url) {
      setImages([{
        id: 'existing-0',
        preview: product.imagem_url,
        originalPreview: product.imagem_url,
        color: product.cor || '',
        existingUrl: product.imagem_url
      }]);
      setProductColors([]);
    } else {
      setImages([]);
      setProductColors([]);
    }

    setIsModalOpen(true);
  }

  function handleAddColor() {
    if (!novaCorNome.trim()) return;
    if (novaCorTipo === 'image' && !novaCorFile) {
      showAlert({ title: 'Atenção', message: 'Selecione uma imagem para a textura da cor.', type: 'warning' });
      return;
    }

    const newColor: ProductColor = {
      id: Math.random().toString(),
      nome: novaCorNome.trim(),
      tipo: novaCorTipo,
      valor: novaCorTipo === 'hex' ? novaCorHex : URL.createObjectURL(novaCorFile!),
      file: novaCorFile || undefined
    };

    setProductColors([...productColors, newColor]);
    setNovaCorNome('');
    setNovaCorFile(null);
  }

  function handleRemoveColor(id: string) {
    setProductColors(productColors.filter(c => c.id !== id));
    // Atualiza as imagens para remover a cor se estiver selecionada
    const colorToRemove = productColors.find(c => c.id === id);
    if (colorToRemove) {
      setImages(images.map(img => img.color === colorToRemove.nome ? { ...img, color: '' } : img));
    }
  }

  function handleAddImage(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const newImages = Array.from(e.target.files).map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        originalFile: file,
        preview: URL.createObjectURL(file),
        originalPreview: URL.createObjectURL(file),
        isVariant: false,
        color: ''
      }));
      setImages([...images, ...newImages]);
    }
  }

  function handleUpdateImageColor(id: string, color: string) {
    setImages(images.map(img => img.id === id ? { ...img, color } : img));
  }

  function handleUpdateImageField(id: string, field: keyof ImageUploadItem, value: any) {
    setImages(images.map(img => img.id === id ? { ...img, [field]: value } : img));
  }

  function handleUndoCrop(id: string) {
    setImages(images.map(img => 
      img.id === id
        ? { 
            ...img, 
            file: img.originalFile, 
            preview: img.originalPreview || img.preview,
            existingUrl: img.originalPreview?.startsWith('http') ? img.originalPreview : undefined
          }
        : img
    ));
  }

  function handleRemoveImage(id: string) {
    setImages(images.filter(img => img.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      if (images.length === 0) {
        showAlert({ title: 'Atenção', message: 'Por favor, adicione pelo menos uma imagem.', type: 'warning' });
        setSaving(false);
        return;
      }

      // 1. Upload das texturas de cor, se houver novas
      const finalColors = [...productColors];
      for (let i = 0; i < finalColors.length; i++) {
        const pc = finalColors[i];
        if (pc.tipo === 'image' && pc.file) {
          const fileExt = pc.file.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from('produtos_imagens').upload(`cores/${fileName}`, pc.file);
          if (uploadError) throw uploadError;
          const { data: publicUrlData } = supabase.storage.from('produtos_imagens').getPublicUrl(`cores/${fileName}`);
          finalColors[i].valor = publicUrlData.publicUrl;
        }
      }

      // 2. Upload da Galeria
      const uploadedGallery = [];

      for (const img of images) {
        const colorInfo = finalColors.find(c => c.nome === img.color);
        const cor_tipo = colorInfo?.tipo || null;
        const cor_valor = colorInfo?.valor || null;

        if (img.existingUrl) {
          uploadedGallery.push({
            url: img.existingUrl,
            cor: img.isVariant ? img.color : undefined,
            cor_tipo: img.isVariant ? cor_tipo : undefined,
            cor_valor: img.isVariant ? cor_valor : undefined,
            memoria: img.isVariant ? img.storage : undefined,
            bateria: img.isVariant ? img.battery : undefined,
            mostrar_bateria: img.isVariant ? img.showBattery : undefined,
            preco: img.isVariant ? img.preco : undefined,
            preco_antigo: img.isVariant ? img.preco_antigo : undefined
          });
        } else if (img.file) {
          const fileExt = img.file.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from('produtos_imagens')
            .upload(fileName, img.file);

          if (uploadError) throw uploadError;

          const { data: publicUrlData } = supabase.storage
            .from('produtos_imagens')
            .getPublicUrl(fileName);

          uploadedGallery.push({
            url: publicUrlData.publicUrl,
            cor: img.isVariant ? img.color : undefined,
            cor_tipo: img.isVariant ? cor_tipo : undefined,
            cor_valor: img.isVariant ? cor_valor : undefined,
            memoria: img.isVariant ? img.storage : undefined,
            bateria: img.isVariant ? img.battery : undefined,
            mostrar_bateria: img.isVariant ? img.showBattery : undefined,
            preco: img.isVariant ? img.preco : undefined,
            preco_antigo: img.isVariant ? img.preco_antigo : undefined
          });
        }
      }

      const mainImageUrl = uploadedGallery.length > 0 ? uploadedGallery[0].url : '';

      const uniqueColors = Array.from(new Set(uploadedGallery.filter(g => g.cor).map(g => g.cor))).join(', ');

      const parsedPreco = parseFloat(formData.preco || '0');
      const firstVariantPrice = uploadedGallery.find(g => g.preco)?.preco;
      const finalPrice = parsedPreco > 0 ? parsedPreco : parseFloat(firstVariantPrice || '0');

      const parsedPrecoAntigo = parseFloat(formData.preco_antigo || '0');
      const firstVariantOldPrice = uploadedGallery.find(g => g.preco_antigo)?.preco_antigo;
      const finalOldPrice = (temDesconto && parsedPrecoAntigo > 0)
        ? parsedPrecoAntigo
        : (firstVariantOldPrice ? parseFloat(firstVariantOldPrice) : null);

      const productData = {
        nome: formData.nome,
        marca: formData.marca,
        condicao: productType === 'aparelho' ? formData.condicao : 'Novo',
        memoria: productType === 'aparelho' ? formData.memoria : '',
        cor: productType === 'aparelho' ? uniqueColors : '',
        preco: finalPrice,
        preco_antigo: finalOldPrice,
        badge: formData.badge || null,
        categoria: formData.categoria,
        descricao: formData.descricao || null,
        imagem_url: mainImageUrl,
        galeria: uploadedGallery,
        estoque: productType === 'item' ? (formData.estoque ? parseInt(formData.estoque) : 0) : null
      };

      if (editId) {
        const { error } = await supabase.from('produtos').update(productData).eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('produtos').insert([productData]);
        if (error) throw error;
      }

      setIsModalOpen(false);
      resetForm();
      fetchProducts();

    } catch (error) {
      console.error('Erro ao salvar:', error);
      showAlert({ title: 'Erro', message: 'Erro ao salvar produto.', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setEditId(null);
    setTemDesconto(false);
    setFormData({
      nome: '', marca: '', condicao: 'Novo', memoria: '',
      preco: '', preco_antigo: '', badge: '', categoria: 'Celulares', descricao: '', estoque: ''
    });
    setImages([]);
    setProductColors([]);
    setNovaCorNome('');
    setNovaCorFile(null);
  }

  function openTypeSelector() {
    resetForm();
    setShowTypeSelector(true);
  }

  function handleSelectType(type: 'aparelho' | 'item') {
    setProductType(type);
    setShowTypeSelector(false);
    setIsModalOpen(true);
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-soft rounded-xl p-6">
      <div className="flex justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Produtos</h2>
          <p className="text-sm text-gray-500 line-clamp-1 sm:line-clamp-none">Gerencie o catálogo da loja.</p>
        </div>
        {activeTab === 'Produtos' && (
          <button
            onClick={openTypeSelector}
            className="flex-shrink-0 flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 bg-vanta-blue text-white rounded-lg hover:bg-blue-600 transition-colors font-bold text-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Produto</span>
            <span className="sm:hidden">Novo</span>
          </button>
        )}
      </div>

      <div className="inline-flex bg-gray-100/80 dark:bg-gray-900/80 p-1.5 rounded-2xl mb-6 border border-gray-200/60 dark:border-gray-700/60 shadow-inner">
        {(['Produtos', 'Adicionais'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-8 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 whitespace-nowrap ${
              activeTab === tab 
                ? 'bg-white dark:bg-gray-800 text-vanta-blue shadow-sm ring-1 ring-black/5 dark:ring-white/10' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/60 dark:hover:bg-gray-800/60'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Produtos' ? (
        <>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar produto pelo nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-vanta-blue/20 focus:border-vanta-blue transition-all text-gray-900 dark:text-white"
          />
        </div>
        
        <div className="flex md:hidden items-center bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700 mx-auto w-full max-w-sm justify-between">
          <button 
            onClick={() => setViewMode('detailed')}
            className={`flex-1 p-2 px-3 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all ${viewMode === 'detailed' ? 'bg-white dark:bg-gray-700 text-vanta-blue shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            <LayoutGrid className="w-4 h-4" /> Detalhada
          </button>
          <button 
            onClick={() => setViewMode('minimal')}
            className={`flex-1 p-2 px-3 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all ${viewMode === 'minimal' ? 'bg-white dark:bg-gray-700 text-vanta-blue shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            <List className="w-4 h-4" /> Minimalista
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-vanta-blue" /></div>
      ) : (
        <>
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto min-h-[380px]">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                <th className="px-6 py-3 text-left relative">
                  <button 
                    onClick={() => setOpenDropdown(openDropdown === 'preco' ? null : 'preco')}
                    className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 uppercase tracking-wider transition-colors"
                  >
                    Preço
                    {filterPreco && <span className="w-1.5 h-1.5 rounded-full bg-vanta-blue ml-0.5"></span>}
                    <ChevronDown className={`w-3.5 h-3.5 ml-0.5 transition-transform ${openDropdown === 'preco' ? 'rotate-180' : ''}`} />
                  </button>
                  {openDropdown === 'preco' && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)}></div>
                      <div className="absolute top-full left-4 mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-2 z-50 overflow-hidden text-sm">
                        <button onClick={() => { setFilterPreco(''); setOpenDropdown(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between text-gray-700 dark:text-gray-300">
                          <span>Nenhum</span>
                          {!filterPreco && <Check className="w-4 h-4 text-vanta-blue" />}
                        </button>
                        <button onClick={() => { setFilterPreco('maior'); setOpenDropdown(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between text-gray-700 dark:text-gray-300">
                          <span>Maior Preço</span>
                          {filterPreco === 'maior' && <Check className="w-4 h-4 text-vanta-blue" />}
                        </button>
                        <button onClick={() => { setFilterPreco('menor'); setOpenDropdown(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between text-gray-700 dark:text-gray-300">
                          <span>Menor Preço</span>
                          {filterPreco === 'menor' && <Check className="w-4 h-4 text-vanta-blue" />}
                        </button>
                      </div>
                    </>
                  )}
                </th>
                <th className="px-6 py-3 text-left relative">
                  <button 
                    onClick={() => setOpenDropdown(openDropdown === 'categoria' ? null : 'categoria')}
                    className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 uppercase tracking-wider transition-colors"
                  >
                    Categoria
                    {filterCategoria && <span className="w-1.5 h-1.5 rounded-full bg-vanta-blue ml-0.5"></span>}
                    <ChevronDown className={`w-3.5 h-3.5 ml-0.5 transition-transform ${openDropdown === 'categoria' ? 'rotate-180' : ''}`} />
                  </button>
                  {openDropdown === 'categoria' && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)}></div>
                      <div className="absolute top-full left-4 mt-1 w-48 max-h-64 overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-2 z-50 text-sm custom-scrollbar">
                        <button onClick={() => { setFilterCategoria(''); setOpenDropdown(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between text-gray-700 dark:text-gray-300">
                          <span>Todas</span>
                          {!filterCategoria && <Check className="w-4 h-4 text-vanta-blue" />}
                        </button>
                        {categorias.map(c => (
                          <button key={c.id} onClick={() => { setFilterCategoria(c.nome); setOpenDropdown(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between text-gray-700 dark:text-gray-300">
                            <span>{c.nome}</span>
                            {filterCategoria === c.nome && <Check className="w-4 h-4 text-vanta-blue" />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </th>
                <th className="px-6 py-3 text-left relative">
                  <button 
                    onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
                    className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 uppercase tracking-wider transition-colors"
                  >
                    Status
                    {filterStatus && <span className="w-1.5 h-1.5 rounded-full bg-vanta-blue ml-0.5"></span>}
                    <ChevronDown className={`w-3.5 h-3.5 ml-0.5 transition-transform ${openDropdown === 'status' ? 'rotate-180' : ''}`} />
                  </button>
                  {openDropdown === 'status' && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)}></div>
                      <div className="absolute top-full left-4 mt-1 w-40 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-2 z-50 overflow-hidden text-sm">
                        <button onClick={() => { setFilterStatus(''); setOpenDropdown(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between text-gray-700 dark:text-gray-300">
                          <span>Todos</span>
                          {!filterStatus && <Check className="w-4 h-4 text-vanta-blue" />}
                        </button>
                        <button onClick={() => { setFilterStatus('ativo'); setOpenDropdown(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between text-gray-700 dark:text-gray-300">
                          <span>Ativos</span>
                          {filterStatus === 'ativo' && <Check className="w-4 h-4 text-vanta-blue" />}
                        </button>
                        <button onClick={() => { setFilterStatus('oculto'); setOpenDropdown(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between text-gray-700 dark:text-gray-300">
                          <span>Ocultos</span>
                          {filterStatus === 'oculto' && <Check className="w-4 h-4 text-vanta-blue" />}
                        </button>
                      </div>
                    </>
                  )}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {products
                .filter(p => {
                  if (searchTerm && !p.nome.toLowerCase().includes(searchTerm.toLowerCase())) return false;
                  if (filterCategoria && p.categoria !== filterCategoria) return false;
                  if (filterStatus) {
                    const isAtivo = filterStatus === 'ativo';
                    if (p.ativo !== isAtivo) return false;
                  }
                  return true;
                })
                .sort((a, b) => {
                  if (filterPreco === 'maior') return b.preco - a.preco;
                  if (filterPreco === 'menor') return a.preco - b.preco;
                  return 0;
                })
                .map((product) => (
                <tr 
                  key={product.id}
                  onContextMenu={async (e) => {
                    e.preventDefault();
                    const confirm = await showAlert({
                      title: 'Alterar Status do Produto',
                      message: `Deseja ${product.ativo ? 'ocultar' : 'ativar'} o produto "${product.nome}"?`,
                      type: 'info',
                      showConfirm: true,
                      confirmText: product.ativo ? 'Ocultar Produto' : 'Ativar Produto',
                      cancelText: 'Cancelar'
                    });
                    if (confirm) {
                      handleToggleActive(product.id, product.ativo);
                    }
                  }}
                  className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/50 cursor-pointer"
                  title="Clique com o botão direito para alternar entre Ativo e Oculto"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img className="h-10 w-10 rounded-lg object-cover" src={product.imagem_url} alt="" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{product.nome}</div>
                        {(() => {
                          const isAparelho = product.cor || product.memoria || (product.galeria && product.galeria.length > 0 && product.galeria.some((g:any)=>g.cor));
                          if (!isAparelho) {
                            return (
                              <div className="text-sm font-semibold text-vanta-blue break-words w-48 mt-0.5">
                                Estoque: {product.estoque !== null && product.estoque !== undefined ? product.estoque : 0} un.
                              </div>
                            );
                          }
                          const subtitle = [product.cor, product.memoria].filter(Boolean).join(' • ');
                          return subtitle ? (
                            <div className="text-sm text-gray-500 break-words w-48 mt-0.5">{subtitle}</div>
                          ) : null;
                        })()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      R$ {product.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {product.categoria}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {product.ativo ? 'Ativo' : 'Oculto'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEdit(product)} className="text-blue-600 hover:text-blue-900 ml-4 p-1">
                      <Edit className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900 ml-4 p-1">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {products.filter(p => {
                  if (searchTerm && !p.nome.toLowerCase().includes(searchTerm.toLowerCase())) return false;
                  if (filterCategoria && p.categoria !== filterCategoria) return false;
                  if (filterStatus) {
                    const isAtivo = filterStatus === 'ativo';
                    if (p.ativo !== isAtivo) return false;
                  }
                  return true;
                }).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">Nenhum produto encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile List View */}
        <div className="md:hidden">
          <div className="flex items-center gap-2 mb-4 px-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Produtos</span>
            <div className="h-px bg-gray-200 dark:bg-gray-800 flex-1"></div>
          </div>
          
          <div className={`${viewMode === 'minimal' ? 'space-y-0 divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-2' : 'space-y-4'}`}>
            {products
              .filter(p => {
                if (searchTerm && !p.nome.toLowerCase().includes(searchTerm.toLowerCase())) return false;
                if (filterCategoria && p.categoria !== filterCategoria) return false;
                if (filterStatus) {
                  const isAtivo = filterStatus === 'ativo';
                  if (p.ativo !== isAtivo) return false;
                }
                return true;
              })
              .sort((a, b) => {
                if (filterPreco === 'maior') return b.preco - a.preco;
                if (filterPreco === 'menor') return a.preco - b.preco;
                return 0;
              })
              .map((product) => {
                const isAparelho = product.cor || product.memoria || (product.galeria && product.galeria.length > 0 && product.galeria.some((g:any)=>g.cor));
                const subtitle = isAparelho ? [product.cor, product.memoria].filter(Boolean).join(' • ') : `Estoque: ${product.estoque !== null && product.estoque !== undefined ? product.estoque : 0} un.`;

                return viewMode === 'minimal' ? (
                  <div key={product.id} className="flex flex-col gap-2 py-3 px-2 first:pt-2 last:pb-2 relative group">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 h-12 w-12 bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                        <img className="h-full w-full object-cover" src={product.imagem_url} alt="" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-gray-900 dark:text-white truncate pr-2">{product.nome}</div>
                        {subtitle && (
                          <div className={`text-xs truncate ${!isAparelho ? 'text-vanta-blue font-semibold' : 'text-gray-500'}`}>{subtitle}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => handleEdit(product)} className="text-blue-600 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="text-red-600 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div key={product.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm relative overflow-hidden">
                     <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 h-20 w-20 bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                          <img className="h-full w-full object-cover" src={product.imagem_url} alt="" />
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                          <div className="text-sm font-bold text-gray-900 dark:text-white leading-tight mb-1 line-clamp-2">{product.nome}</div>
                          <div className="text-xs text-gray-500 mb-2 font-medium">
                            {product.categoria}
                          </div>
                          <div className="text-lg font-black text-vanta-blue">
                            R$ {product.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                     </div>
                     
                     <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <span className={`px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-lg ${product.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                          {product.ativo ? 'Ativo' : 'Oculto'}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleEdit(product)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold transition-colors">
                            <Edit className="w-3.5 h-3.5" /> Editar
                          </button>
                          <button onClick={() => handleDelete(product.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold transition-colors">
                            <Trash2 className="w-3.5 h-3.5" /> Excluir
                          </button>
                        </div>
                     </div>
                  </div>
                );
              })}
              
              {products.filter(p => {
                if (searchTerm && !p.nome.toLowerCase().includes(searchTerm.toLowerCase())) return false;
                if (filterCategoria && p.categoria !== filterCategoria) return false;
                if (filterStatus) {
                  const isAtivo = filterStatus === 'ativo';
                  if (p.ativo !== isAtivo) return false;
                }
                return true;
              }).length === 0 && (
                <div className="text-center py-10 text-gray-500 text-sm">
                  Nenhum produto encontrado.
                </div>
              )}
          </div>
        </div>
        </>
      )}
      </>
      ) : (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6 md:p-8 flex flex-col max-h-[800px]">
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-vanta-blue" />
                Acessórios em Destaque
              </h3>
              <p className="text-sm text-gray-500 mt-1">Selecione até 3 acessórios para exibir no processo de compra como sugestão (Upsell).</p>
            </div>
            
            <div className="relative w-full md:w-64 flex-shrink-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Pesquisar acessórios..."
                value={searchAdicionais}
                onChange={(e) => setSearchAdicionais(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-vanta-blue/20 focus:border-vanta-blue transition-all text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="overflow-y-auto custom-scrollbar flex-1 pr-2 -mr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
              {products
                .filter(p => p.categoria?.toLowerCase().includes('acessóri'))
                .filter(p => !searchAdicionais || p.nome.toLowerCase().includes(searchAdicionais.toLowerCase()))
                .sort((a, b) => {
                  if (a.is_adicional && !b.is_adicional) return -1;
                  if (!a.is_adicional && b.is_adicional) return 1;
                  return a.nome.localeCompare(b.nome);
                })
                .map(acessorio => (
                <div 
                  key={acessorio.id} 
                  className={`relative flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300 ${acessorio.is_adicional ? 'border-vanta-blue bg-blue-50/30 dark:bg-vanta-blue/10' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white dark:bg-gray-900 rounded-xl overflow-hidden flex-shrink-0 shadow-sm border border-gray-100 dark:border-gray-800 p-1">
                      <img src={acessorio.imagem_url || '/Phone.png'} alt={acessorio.nome} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1 max-w-[120px]" title={acessorio.nome}>{acessorio.nome}</span>
                      <span className="text-xs font-semibold text-vanta-blue mt-0.5">{Number(acessorio.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleToggleAdicional(acessorio)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-vanta-blue focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${acessorio.is_adicional ? 'bg-vanta-blue' : 'bg-gray-200 dark:bg-gray-700'}`}
                    role="switch"
                    aria-checked={acessorio.is_adicional || false}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${acessorio.is_adicional ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </button>
                </div>
              ))}
              {products.filter(p => p.categoria?.toLowerCase().includes('acessóri') && (!searchAdicionais || p.nome.toLowerCase().includes(searchAdicionais.toLowerCase()))).length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 border-dashed">
                  Nenhum acessório encontrado.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showTypeSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowTypeSelector(false)}></div>
          <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-xl overflow-hidden flex flex-col p-6 sm:p-8 border border-gray-100 dark:border-gray-800">
            
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">O que deseja cadastrar?</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Selecione o tipo de produto para continuar.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button onClick={() => handleSelectType('aparelho')} className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border border-gray-200 hover:border-vanta-blue bg-white hover:bg-blue-50/50 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-vanta-blue dark:hover:bg-blue-900/10 transition-all group">
                <Smartphone className="w-8 h-8 text-gray-400 group-hover:text-vanta-blue transition-colors" strokeWidth={1.5} />
                <div className="text-center">
                  <span className="block font-bold text-sm text-gray-900 dark:text-white">Aparelho</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Celulares e iPads</span>
                </div>
              </button>
              
              <button onClick={() => handleSelectType('item')} className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border border-gray-200 hover:border-vanta-blue bg-white hover:bg-blue-50/50 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-vanta-blue dark:hover:bg-blue-900/10 transition-all group">
                <Package className="w-8 h-8 text-gray-400 group-hover:text-vanta-blue transition-colors" strokeWidth={1.5} />
                <div className="text-center">
                  <span className="block font-bold text-sm text-gray-900 dark:text-white">Item / Acessório</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Capinhas e Cabos</span>
                </div>
              </button>
            </div>
            
            <button onClick={() => setShowTypeSelector(false)} className="mt-6 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium self-center transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-6">
          {/* Backdrop blur */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>

          <div className="relative bg-white dark:bg-gray-900 sm:rounded-[32px] shadow-2xl w-full h-full sm:h-auto sm:w-full sm:max-w-4xl sm:max-h-[90vh] flex flex-col transform transition-all overflow-hidden animate-in fade-in zoom-in-95 duration-200">

            {/* Header fixo */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 p-5 sm:p-6 sm:px-10 flex justify-between items-center shrink-0 z-10">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                  {editId ? (productType === 'aparelho' ? 'Editar Aparelho' : 'Editar Item') : (productType === 'aparelho' ? 'Novo Aparelho' : 'Novo Item')}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Preencha os detalhes do produto abaixo.</p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-full transition-colors"><X className="w-5 h-5 sm:w-6 sm:h-6" /></button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 sm:p-10 space-y-8 sm:space-y-10 custom-scrollbar">

              {/* Seção: Cores do Produto (Local) */}
              {productType === 'aparelho' && (
              <div className="bg-purple-50/50 dark:bg-purple-900/10 p-4 sm:p-8 rounded-[24px] border border-purple-100 dark:border-purple-800/30">
                <div className="flex items-center gap-2 mb-2">
                  <Palette className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white">Cores deste Produto</h4>
                </div>
                <p className="text-sm text-gray-500 mb-6">Crie as cores que estarão disponíveis para este aparelho e vincule-as às fotos depois.</p>

                <div className="bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-xl border border-gray-100 dark:border-gray-800 mb-6 flex flex-col md:flex-row gap-4 items-start md:items-end shadow-sm">
                  <div className="w-full md:flex-1">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nome (Ex: Titânio)</label>
                    <input
                      type="text"
                      value={novaCorNome}
                      onChange={e => setNovaCorNome(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2.5 text-sm outline-none focus:border-vanta-blue focus:ring-2 focus:ring-vanta-blue/20 transition-all"
                    />
                  </div>

                  <div className="w-full md:w-auto">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Tipo</label>
                    <div className="flex gap-2">
                      <button
                        type="button" onClick={() => setNovaCorTipo('hex')}
                        className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${novaCorTipo === 'hex' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 ring-2 ring-purple-500/20' : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                      >
                        Hexadecimal
                      </button>
                      <button
                        type="button" onClick={() => setNovaCorTipo('image')}
                        className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${novaCorTipo === 'image' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 ring-2 ring-purple-500/20' : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                      >
                        Textura
                      </button>
                    </div>
                  </div>

                  <div className="w-full md:w-48">
                    {novaCorTipo === 'hex' ? (
                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Cor</label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={novaCorHex} onChange={e => setNovaCorHex(e.target.value)} className="h-10 w-full md:w-16 p-0.5 rounded-xl cursor-pointer border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Imagem</label>
                        <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors h-10">
                          <UploadCloud className="w-4 h-4 text-gray-500 shrink-0" />
                          <span className="text-xs font-bold text-gray-600 dark:text-gray-300 truncate w-full max-w-[120px]">{novaCorFile ? novaCorFile.name : 'Upload...'}</span>
                          <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files && setNovaCorFile(e.target.files[0])} />
                        </label>
                      </div>
                    )}
                  </div>

                  <button type="button" onClick={handleAddColor} className="w-full md:w-auto px-6 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors text-sm font-bold h-10 mt-2 md:mt-0">
                    Adicionar
                  </button>
                </div>

                {productColors.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {productColors.map(cor => (
                      <div key={cor.id} className="flex items-center gap-3 bg-white dark:bg-gray-900 pl-2 pr-1 py-1 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
                        {cor.tipo === 'hex' ? (
                          <div className="w-6 h-6 rounded-full border border-gray-200 dark:border-gray-600" style={{ backgroundColor: cor.valor }} />
                        ) : (
                          <div className="w-6 h-6 rounded-full border border-gray-200 dark:border-gray-600 bg-cover bg-center" style={{ backgroundImage: `url(${cor.valor})` }} />
                        )}
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{cor.nome}</span>
                        <button type="button" onClick={() => handleRemoveColor(cor.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              )}

              {/* Seção: Galeria de Imagens */}
              <div className="bg-gray-50 dark:bg-gray-800/50 p-6 sm:p-8 rounded-[24px] border border-gray-100 dark:border-gray-800">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Galeria de Fotos</h4>
                <p className="text-sm text-gray-500 mb-6">Suba as fotos e selecione a cor de cada uma logo abaixo da miniatura.</p>

                <div className="flex flex-wrap gap-4 items-start">
                  <Reorder.Group axis="x" values={images} onReorder={setImages} className="flex flex-wrap gap-4">
                  {images.map((img) => (
                    <Reorder.Item
                      key={img.id}
                      value={img}
                      id={img.id}
                      drag
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      whileDrag={{ 
                        scale: 1.05, 
                        boxShadow: '0px 10px 30px rgba(0,0,0,0.15)', 
                        opacity: 0.85, 
                        zIndex: 50 
                      }}
                      className="relative bg-white dark:bg-gray-900 p-3 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm w-56 flex flex-col group gap-2 cursor-grab active:cursor-grabbing hover:border-vanta-blue transition-colors"
                    >
                      <div className="absolute -top-3 -right-3 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        {(img.preview !== img.originalPreview && img.originalPreview) && (
                          <button type="button" onClick={() => handleUndoCrop(img.id)} title="Desfazer Corte" className="bg-orange-500 text-white p-1.5 rounded-full shadow hover:bg-orange-600"><Undo2 className="w-4 h-4" /></button>
                        )}
                        <button type="button" onClick={() => setCroppingImage(img)} title="Editar/Cortar" className="bg-vanta-blue text-white p-1.5 rounded-full shadow hover:bg-blue-600"><Edit className="w-4 h-4" /></button>
                        <button type="button" onClick={() => handleRemoveImage(img.id)} title="Remover" className="bg-red-500 text-white p-1.5 rounded-full shadow hover:bg-red-600"><X className="w-4 h-4" /></button>
                      </div>
                      <div className="h-28 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                        <img src={img.preview} draggable={false} alt="" className="max-h-full max-w-full object-contain pointer-events-none select-none" />
                      </div>
                      
                      {productType === 'aparelho' && (
                        <div className="flex items-center gap-2 mt-1">
                          <label className="flex items-center justify-center gap-2 cursor-pointer w-full p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:border-vanta-blue transition-colors">
                            <input type="checkbox" checked={img.isVariant || false} onChange={(e) => handleUpdateImageField(img.id, 'isVariant', e.target.checked)} className="w-4 h-4 text-vanta-blue rounded border-gray-300 dark:border-gray-600 focus:ring-vanta-blue cursor-pointer transition-colors" />
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Variação / Produto</span>
                          </label>
                        </div>
                      )}
                      
                      {productType === 'aparelho' && img.isVariant && (
                        <>
                          <select
                            value={img.color}
                            onChange={(e) => handleUpdateImageColor(img.id, e.target.value)}
                            className="text-xs w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-800 outline-none focus:border-vanta-blue transition-all font-medium appearance-none"
                          >
                            <option value="">Sem Cor</option>
                            {productColors.map(c => (
                              <option key={c.id} value={c.nome}>{c.nome}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            placeholder="Armazenamento (ex: 256GB)"
                            value={img.storage || ''}
                            onChange={(e) => handleUpdateImageField(img.id, 'storage', e.target.value)}
                            className="text-xs w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-800 outline-none focus:border-vanta-blue transition-all font-medium"
                          />
                          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-1.5 rounded-lg border border-gray-100 dark:border-gray-700">
                            <label className="flex items-center gap-1.5 cursor-pointer flex-1">
                              <input
                                type="checkbox"
                                checked={img.showBattery || false}
                                onChange={(e) => handleUpdateImageField(img.id, 'showBattery', e.target.checked)}
                                className="w-3 h-3 text-vanta-blue rounded border-gray-300 dark:border-gray-600 dark:bg-gray-800 cursor-pointer"
                              />
                              <span className="text-[10px] font-bold text-gray-500">Exibir Bat.</span>
                            </label>
                            <input
                              type="text"
                              placeholder="%"
                              value={img.battery || ''}
                              onChange={(e) => handleUpdateImageField(img.id, 'battery', e.target.value)}
                              className="text-xs w-12 p-1 border border-gray-200 dark:border-gray-700 rounded-md dark:bg-gray-800 outline-none focus:border-vanta-blue transition-all font-medium text-center"
                              disabled={!img.showBattery}
                            />
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              placeholder="Preço"
                              value={img.preco || ''}
                              onChange={(e) => handleUpdateImageField(img.id, 'preco', e.target.value)}
                              className="text-xs w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-800 outline-none focus:border-vanta-blue transition-all font-medium"
                            />
                            <input
                              type="number"
                              placeholder="Antigo"
                              value={img.preco_antigo || ''}
                              onChange={(e) => handleUpdateImageField(img.id, 'preco_antigo', e.target.value)}
                              className="text-xs w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-800 outline-none focus:border-vanta-blue transition-all font-medium text-gray-400"
                            />
                          </div>
                        </>
                      )}
                    </Reorder.Item>
                  ))}
                  </Reorder.Group>

                  <div className="flex flex-col items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                    <label className="w-full sm:w-36 h-36 sm:h-44 flex flex-col items-center justify-center bg-white dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl cursor-pointer hover:border-vanta-blue hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors group">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-2 sm:mb-3 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                        <UploadCloud className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 group-hover:text-vanta-blue" />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-bold">Adicionar Foto</span>
                      <input type="file" multiple accept="image/*" className="hidden" onChange={handleAddImage} />
                    </label>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium text-center max-w-[140px]">Recomendado: Proporção 1:1 (Ex: 1080x1080) para preencher sem sobras.</span>
                  </div>
                </div>
              </div>

              {/* Seção: Informações Principais */}
              <div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Informações Principais</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Nome do {productType === 'aparelho' ? 'Aparelho' : 'Item'}</label>
                    <input required type="text" value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 outline-none focus:border-vanta-blue focus:ring-2 focus:ring-vanta-blue/20 transition-all text-sm font-medium" placeholder={productType === 'aparelho' ? "Ex: iPhone 15 Pro Max" : "Ex: Capinha Transparente iPhone 15"} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Marca</label>
                    <select required value={formData.marca} onChange={e => setFormData({ ...formData, marca: e.target.value })} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 outline-none focus:border-vanta-blue focus:ring-2 focus:ring-vanta-blue/20 transition-all text-sm font-medium appearance-none">
                      <option value="">Selecione...</option>
                      {marcas.map(m => (
                        <option key={m.id} value={m.nome}>{m.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Categoria</label>
                    <select required value={formData.categoria} onChange={e => setFormData({ ...formData, categoria: e.target.value })} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 outline-none focus:border-vanta-blue focus:ring-2 focus:ring-vanta-blue/20 transition-all text-sm font-medium appearance-none">
                      <option value="">Selecione...</option>
                      {categorias.map(c => (
                        <option key={c.id} value={c.nome}>{c.nome}</option>
                      ))}
                    </select>
                  </div>

                  {productType === 'aparelho' && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Condição</label>
                    <select required value={formData.condicao} onChange={e => setFormData({ ...formData, condicao: e.target.value })} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 outline-none focus:border-vanta-blue focus:ring-2 focus:ring-vanta-blue/20 transition-all text-sm font-medium appearance-none">
                      <option value="Novo">Novo</option>
                      <option value="Lacrado">Lacrado</option>
                      <option value="Seminovo">Seminovo</option>
                      <option value="Usado">Usado</option>
                    </select>
                  </div>
                  )}

                  {productType === 'item' && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Quantidade em Estoque (QTD)</label>
                    <input required type="number" min="0" value={formData.estoque} onChange={e => setFormData({ ...formData, estoque: e.target.value })} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 outline-none focus:border-vanta-blue focus:ring-2 focus:ring-vanta-blue/20 transition-all text-sm font-medium" placeholder="Ex: 50" />
                  </div>
                  )}

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Etiqueta (Badge)</label>
                    <select value={formData.badge} onChange={e => setFormData({ ...formData, badge: e.target.value })} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 outline-none focus:border-vanta-blue focus:ring-2 focus:ring-vanta-blue/20 transition-all text-sm font-medium appearance-none">
                      <option value="">Nenhuma</option>
                      <option value="Novo">Novo</option>
                      <option value="Oferta">Oferta</option>
                      <option value="Mais Vendido">Mais Vendido</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Seção: Variações e Preço */}
              {!images.some(img => img.isVariant) && (
                <div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Preço Principal</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Preço Base (R$)</label>
                      <input required type="number" step="0.01" value={formData.preco} onChange={e => setFormData({ ...formData, preco: e.target.value })} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 outline-none focus:border-vanta-blue focus:ring-2 focus:ring-vanta-blue/20 transition-all text-sm font-medium" placeholder="Ex: 5999.00" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 h-5">
                        <input type="checkbox" id="temDesconto" checked={temDesconto} onChange={e => {
                          setTemDesconto(e.target.checked);
                          if (!e.target.checked) setFormData({ ...formData, preco_antigo: '' });
                        }} className="w-4 h-4 text-vanta-blue rounded border-gray-300 dark:border-gray-600 dark:bg-gray-800 focus:ring-vanta-blue cursor-pointer transition-colors" />
                        <label htmlFor="temDesconto" className="block text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer leading-none mt-0.5">Tem preço antigo? (Desconto)</label>
                      </div>
                      {temDesconto && (
                        <input type="number" step="0.01" value={formData.preco_antigo} onChange={e => setFormData({ ...formData, preco_antigo: e.target.value })} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 outline-none focus:border-vanta-blue focus:ring-2 focus:ring-vanta-blue/20 transition-all text-sm font-medium" placeholder="Ex: 8299.00" />
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">Se uma imagem da galeria tiver um preço preenchido, ele vai substituir este preço base quando a cor for selecionada.</p>
                </div>
              )}

              {/* Seção: Descrição */}
              <div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Detalhes do Produto</h4>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Descrição Completa</label>
                <RichTextEditor
                  value={formData.descricao || ''}
                  onChange={val => setFormData({ ...formData, descricao: val })}
                  placeholder="Escreva os detalhes, garantia, câmeras, estado de conservação, itens inclusos..."
                />
              </div>

              </div>
              
              {/* Rodapé Fixo */}
              <div className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 p-5 sm:p-8 flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 shrink-0 z-10">
                <button type="button" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto px-6 py-3.5 sm:py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-bold transition-colors">Cancelar</button>
                <button type="submit" disabled={saving} className="w-full sm:w-auto px-8 py-3.5 sm:py-3 rounded-xl bg-vanta-blue text-white hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center font-bold shadow-[0_10px_20px_rgba(29,142,255,0.2)] hover:shadow-[0_15px_25px_rgba(29,142,255,0.3)] hover:-translate-y-0.5 transition-all">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                  {saving ? 'Salvando...' : (editId ? 'Salvar Alterações' : 'Publicar Produto')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {croppingImage && (
        <ImageCropper
          imageSrc={croppingImage.originalPreview || croppingImage.preview}
          onCropComplete={(file, preview) => {
            setImages(images.map(img => 
              img.id === croppingImage.id
                ? { ...img, file, preview, existingUrl: undefined }
                : img
            ));
            setCroppingImage(null);
          }}
          onRevert={() => {
            setImages(images.map(img => 
              img.id === croppingImage.id
                ? { 
                    ...img, 
                    file: img.originalFile, 
                    preview: img.originalPreview || img.preview,
                    existingUrl: img.originalPreview?.startsWith('http') ? img.originalPreview : undefined
                  }
                : img
            ));
            setCroppingImage(null);
          }}
          onCancel={() => setCroppingImage(null)}
        />
      )}
    </div>
  );
}
