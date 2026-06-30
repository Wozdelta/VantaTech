import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAlert } from '../../contexts/AlertContext';
import { Plus, Trash2, Image as ImageIcon, Loader2, X, Edit, UploadCloud, Palette } from 'lucide-react';
import RichTextEditor from '../ui/RichTextEditor';

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
  galeria: { url: string; cor: string; cor_tipo?: string; cor_valor?: string; memoria?: string; bateria?: string; mostrar_bateria?: boolean; preco?: string; preco_antigo?: string }[];
};

type ImageUploadItem = {
  id: string;
  file?: File;
  preview: string;
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [editId, setEditId] = useState<string | null>(null);
  const [temDesconto, setTemDesconto] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    marca: '',
    condicao: 'Novo',
    memoria: '',
    preco: '',
    preco_antigo: '',
    badge: '',
    categoria: 'Celulares',
    descricao: ''
  });

  const [images, setImages] = useState<ImageUploadItem[]>([]);
  const [marcas, setMarcas] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);

  // Cores do Produto (Local)
  const [productColors, setProductColors] = useState<ProductColor[]>([]);
  const [novaCorNome, setNovaCorNome] = useState('');
  const [novaCorTipo, setNovaCorTipo] = useState<'hex' | 'image'>('hex');
  const [novaCorHex, setNovaCorHex] = useState('#1d8eff');
  const [novaCorFile, setNovaCorFile] = useState<File | null>(null);

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

  function handleEdit(product: Product) {
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
      descricao: product.descricao || ''
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
            tipo: (g.cor_tipo as 'hex'|'image') || 'hex',
            valor: g.cor_valor || '#ccc'
          });
        }
      });
      setProductColors(extractedColors);

      setImages(product.galeria.map((g: any, idx) => ({
        id: `existing-${idx}`,
        preview: g.url,
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
        preview: URL.createObjectURL(file),
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
      
      const productData = {
        nome: formData.nome,
        marca: formData.marca,
        condicao: formData.condicao,
        memoria: formData.memoria,
        cor: uniqueColors,
        preco: parseFloat(formData.preco || '0'),
        preco_antigo: temDesconto && formData.preco_antigo ? parseFloat(formData.preco_antigo) : null,
        badge: formData.badge || null,
        categoria: formData.categoria,
        descricao: formData.descricao || null,
        imagem_url: mainImageUrl,
        galeria: uploadedGallery
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
      preco: '', preco_antigo: '', badge: '', categoria: 'Celulares', descricao: ''
    });
    setImages([]);
    setProductColors([]);
    setNovaCorNome('');
    setNovaCorFile(null);
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-soft rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Produtos</h2>
          <p className="text-sm text-gray-500">Gerencie o catálogo da sua loja.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-vanta-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" /> Novo Produto
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-vanta-blue" /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {products.map(product => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img className="h-10 w-10 rounded-lg object-cover" src={product.imagem_url} alt="" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{product.nome}</div>
                        <div className="text-sm text-gray-500 truncate w-48">{product.cor} • {product.memoria}</div>
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
                    <button onClick={() => handleEdit(product)} className="text-blue-600 hover:text-blue-900 ml-4">
                      <Edit className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900 ml-4">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">Nenhum produto cadastrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop blur */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          
          <div className="relative bg-white dark:bg-gray-900 rounded-[32px] shadow-2xl w-[95vw] sm:w-full max-w-4xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden flex flex-col transform transition-all">
            
            {/* Header fixo */}
            <div className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 p-4 sm:p-6 sm:px-10 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                  {editId ? 'Editar Aparelho' : 'Novo Aparelho'}
                </h3>
                <p className="text-sm text-gray-500 mt-1">Preencha os detalhes do produto abaixo.</p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-full transition-colors"><X className="w-6 h-6" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-10 space-y-8 sm:space-y-10">

                {/* Seção: Cores do Produto (Local) */}
                <div className="bg-purple-50/50 dark:bg-purple-900/10 p-4 sm:p-8 rounded-[24px] border border-purple-100 dark:border-purple-800/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Palette className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">Cores deste Produto</h4>
                  </div>
                  <p className="text-sm text-gray-500 mb-6">Crie as cores que estarão disponíveis para este aparelho e vincule-as às fotos depois.</p>
                  
                  <div className="bg-white dark:bg-gray-900 p-3 sm:p-4 rounded-xl border border-gray-100 dark:border-gray-800 mb-6 flex flex-col md:flex-row gap-4 items-end shadow-sm">
                    <div className="flex-1 w-full">
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nome (Ex: Titânio)</label>
                      <input 
                        type="text" 
                        value={novaCorNome} 
                        onChange={e => setNovaCorNome(e.target.value)} 
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2 text-sm outline-none focus:border-vanta-blue focus:ring-1 focus:ring-vanta-blue"
                      />
                    </div>
                    
                    <div className="w-full md:w-auto">
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Tipo</label>
                      <div className="flex gap-2">
                        <button 
                          type="button" onClick={() => setNovaCorTipo('hex')}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${novaCorTipo === 'hex' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500'}`}
                        >
                          Hexadecimal
                        </button>
                        <button 
                          type="button" onClick={() => setNovaCorTipo('image')}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${novaCorTipo === 'image' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500'}`}
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
                            <input type="color" value={novaCorHex} onChange={e => setNovaCorHex(e.target.value)} className="h-9 w-12 p-0.5 rounded cursor-pointer border border-gray-200 dark:border-gray-700" />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Imagem</label>
                          <label className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors h-9">
                            <UploadCloud className="w-4 h-4 text-gray-500" />
                            <span className="text-xs text-gray-600 dark:text-gray-300 truncate w-20">{novaCorFile ? novaCorFile.name : 'Upload...'}</span>
                            <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files && setNovaCorFile(e.target.files[0])} />
                          </label>
                        </div>
                      )}
                    </div>

                    <button type="button" onClick={handleAddColor} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-bold h-9">
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
                
                {/* Seção: Galeria de Imagens */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-6 sm:p-8 rounded-[24px] border border-gray-100 dark:border-gray-800">
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Galeria de Fotos</h4>
                  <p className="text-sm text-gray-500 mb-6">Suba as fotos e selecione a cor de cada uma logo abaixo da miniatura.</p>
                  
                  <div className="flex flex-wrap gap-4">
                    {images.map((img, index) => (
                      <div key={img.id} className="relative bg-white dark:bg-gray-900 p-3 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm w-56 flex flex-col group gap-2">
                        <button type="button" onClick={() => handleRemoveImage(img.id)} className="absolute -top-3 -right-3 bg-red-500 text-white p-1.5 rounded-full shadow hover:bg-red-600 z-10 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></button>
                        <div className="h-28 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                          <img src={img.preview} alt="" className="max-h-full max-w-full object-contain" />
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <label className="flex items-center justify-center gap-2 cursor-pointer w-full p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:border-vanta-blue transition-colors">
                            <input type="checkbox" checked={img.isVariant || false} onChange={(e) => handleUpdateImageField(img.id, 'isVariant', e.target.checked)} className="w-4 h-4 text-vanta-blue rounded border-gray-300 dark:border-gray-600 focus:ring-vanta-blue cursor-pointer transition-colors" />
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Variação / Produto</span>
                          </label>
                        </div>
                        {img.isVariant && (
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
                      </div>
                    ))}

                    <label className="w-36 h-44 flex flex-col items-center justify-center bg-white dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl cursor-pointer hover:border-vanta-blue hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors group">
                      <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                        <UploadCloud className="w-6 h-6 text-gray-400 group-hover:text-vanta-blue" />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-bold">Adicionar Foto</span>
                      <input type="file" multiple accept="image/*" className="hidden" onChange={handleAddImage} />
                    </label>
                  </div>
                </div>

                {/* Seção: Informações Principais */}
                <div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Informações Principais</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Nome do Aparelho</label>
                      <input required type="text" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 outline-none focus:border-vanta-blue focus:ring-2 focus:ring-vanta-blue/20 transition-all text-sm font-medium" placeholder="Ex: iPhone 15 Pro Max" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Marca</label>
                      <select required value={formData.marca} onChange={e => setFormData({...formData, marca: e.target.value})} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 outline-none focus:border-vanta-blue focus:ring-2 focus:ring-vanta-blue/20 transition-all text-sm font-medium appearance-none">
                        <option value="">Selecione...</option>
                        {marcas.map(m => (
                          <option key={m.id} value={m.nome}>{m.nome}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Categoria</label>
                      <select required value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 outline-none focus:border-vanta-blue focus:ring-2 focus:ring-vanta-blue/20 transition-all text-sm font-medium appearance-none">
                        <option value="">Selecione...</option>
                        {categorias.map(c => (
                          <option key={c.id} value={c.nome}>{c.nome}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Condição</label>
                      <select required value={formData.condicao} onChange={e => setFormData({...formData, condicao: e.target.value})} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 outline-none focus:border-vanta-blue focus:ring-2 focus:ring-vanta-blue/20 transition-all text-sm font-medium appearance-none">
                        <option value="Novo">Novo</option>
                        <option value="Lacrado">Lacrado</option>
                        <option value="Seminovo">Seminovo</option>
                        <option value="Usado">Usado</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Etiqueta (Badge)</label>
                      <select value={formData.badge} onChange={e => setFormData({...formData, badge: e.target.value})} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 outline-none focus:border-vanta-blue focus:ring-2 focus:ring-vanta-blue/20 transition-all text-sm font-medium appearance-none">
                        <option value="">Nenhuma</option>
                        <option value="Novo">Novo</option>
                        <option value="Oferta">Oferta</option>
                        <option value="Mais Vendido">Mais Vendido</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Seção: Variações e Preço */}
                <div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Preço Principal</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Preço Base (R$)</label>
                      <input required type="number" step="0.01" value={formData.preco} onChange={e => setFormData({...formData, preco: e.target.value})} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 outline-none focus:border-vanta-blue focus:ring-2 focus:ring-vanta-blue/20 transition-all text-sm font-medium" placeholder="Ex: 5999.00" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 h-5">
                        <input type="checkbox" id="temDesconto" checked={temDesconto} onChange={e => {
                          setTemDesconto(e.target.checked);
                          if (!e.target.checked) setFormData({...formData, preco_antigo: ''});
                        }} className="w-4 h-4 text-vanta-blue rounded border-gray-300 dark:border-gray-600 dark:bg-gray-800 focus:ring-vanta-blue cursor-pointer transition-colors" />
                        <label htmlFor="temDesconto" className="block text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer leading-none mt-0.5">Tem preço antigo? (Desconto)</label>
                      </div>
                      {temDesconto && (
                        <input type="number" step="0.01" value={formData.preco_antigo} onChange={e => setFormData({...formData, preco_antigo: e.target.value})} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 outline-none focus:border-vanta-blue focus:ring-2 focus:ring-vanta-blue/20 transition-all text-sm font-medium" placeholder="Ex: 8299.00" />
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">Se uma imagem da galeria tiver um preço preenchido, ele vai substituir este preço base quando a cor for selecionada.</p>
                </div>

                {/* Seção: Descrição */}
                <div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Detalhes do Produto</h4>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Descrição Completa</label>
                  <RichTextEditor 
                    value={formData.descricao || ''} 
                    onChange={val => setFormData({...formData, descricao: val})} 
                    placeholder="Escreva os detalhes, garantia, câmeras, estado de conservação, itens inclusos..." 
                  />
                </div>

              {/* Rodapé Fixo */}
              <div className="sticky bottom-0 -mx-6 sm:-mx-10 -mb-6 sm:-mb-10 p-6 sm:p-8 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 flex justify-end gap-4 rounded-b-[32px]">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-bold transition-colors">Cancelar</button>
                <button type="submit" disabled={saving} className="px-8 py-3 rounded-xl bg-vanta-blue text-white hover:bg-blue-600 disabled:opacity-50 flex items-center font-bold shadow-[0_10px_20px_rgba(29,142,255,0.2)] hover:shadow-[0_15px_25px_rgba(29,142,255,0.3)] hover:-translate-y-0.5 transition-all">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                  {saving ? 'Salvando...' : (editId ? 'Salvar Alterações' : 'Publicar Produto')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
