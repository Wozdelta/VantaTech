import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Trash2, Image as ImageIcon, Loader2, X } from 'lucide-react';

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
};

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: '',
    marca: '',
    condicao: 'Novo',
    memoria: '',
    cor: '',
    preco: '',
    preco_antigo: '',
    badge: '',
    categoria: 'Celulares'
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    fetchProducts();
  }, []);

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
    if (!window.confirm('Tem certeza que deseja excluir este produto?')) return;
    
    try {
      const { error } = await supabase.from('produtos').delete().eq('id', id);
      if (error) throw error;
      fetchProducts();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir produto.');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    
    try {
      let imagem_url = '';
      
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('produtos_imagens')
          .upload(filePath, imageFile);
          
        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage
          .from('produtos_imagens')
          .getPublicUrl(filePath);
          
        imagem_url = publicUrlData.publicUrl;
      } else {
        alert('Por favor, selecione uma imagem.');
        setSaving(false);
        return;
      }

      const { error } = await supabase.from('produtos').insert([{
        nome: formData.nome,
        marca: formData.marca,
        condicao: formData.condicao,
        memoria: formData.memoria,
        cor: formData.cor,
        preco: parseFloat(formData.preco),
        preco_antigo: formData.preco_antigo ? parseFloat(formData.preco_antigo) : null,
        badge: formData.badge || null,
        categoria: formData.categoria,
        imagem_url
      }]);

      if (error) throw error;
      
      setIsModalOpen(false);
      resetForm();
      fetchProducts();
      
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar produto.');
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setFormData({
      nome: '', marca: '', condicao: 'Novo', memoria: '', cor: '', 
      preco: '', preco_antigo: '', badge: '', categoria: 'Celulares'
    });
    setImageFile(null);
    setImagePreview('');
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-soft rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Produtos</h2>
          <p className="text-sm text-gray-500">Gerencie o catálogo da sua loja.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
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
                        <div className="text-sm text-gray-500">{product.condicao} • {product.memoria}</div>
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Cadastrar Produto</h3>
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Imagem do Produto (Transparente PNG ideal)</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-700 border-dashed rounded-xl">
                    <div className="space-y-1 text-center">
                      {imagePreview ? (
                        <div className="relative inline-block">
                          <img src={imagePreview} alt="Preview" className="h-32 object-contain" />
                          <button type="button" onClick={() => {setImageFile(null); setImagePreview('');}} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                      )}
                      <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center">
                        <label className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-vanta-blue hover:text-blue-500 focus-within:outline-none">
                          <span>Fazer Upload</span>
                          <input type="file" className="sr-only" accept="image/*" onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setImageFile(e.target.files[0]);
                              setImagePreview(URL.createObjectURL(e.target.files[0]));
                            }
                          }} />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Aparelho</label>
                    <input required type="text" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2.5 outline-none focus:border-vanta-blue" placeholder="Ex: iPhone 14 Pro Max" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Marca</label>
                    <select required value={formData.marca} onChange={e => setFormData({...formData, marca: e.target.value})} className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2.5 outline-none focus:border-vanta-blue">
                      <option value="">Selecione...</option>
                      <option value="Apple">Apple</option>
                      <option value="Samsung">Samsung</option>
                      <option value="Xiaomi">Xiaomi</option>
                      <option value="Motorola">Motorola</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
                    <select required value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2.5 outline-none focus:border-vanta-blue">
                      <option value="Celulares">Celulares</option>
                      <option value="Tablets">Tablets</option>
                      <option value="Notebooks">Notebooks</option>
                      <option value="Acessórios">Acessórios</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Condição</label>
                    <select required value={formData.condicao} onChange={e => setFormData({...formData, condicao: e.target.value})} className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2.5 outline-none focus:border-vanta-blue">
                      <option value="Novo">Novo</option>
                      <option value="Seminovo Premium">Seminovo Premium</option>
                      <option value="Usado Premium">Usado Premium</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Memória</label>
                    <input type="text" value={formData.memoria} onChange={e => setFormData({...formData, memoria: e.target.value})} className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2.5 outline-none focus:border-vanta-blue" placeholder="Ex: 256GB" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cor</label>
                    <input type="text" value={formData.cor} onChange={e => setFormData({...formData, cor: e.target.value})} className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2.5 outline-none focus:border-vanta-blue" placeholder="Ex: Preto Espacial" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preço Atual (R$)</label>
                    <input required type="number" step="0.01" value={formData.preco} onChange={e => setFormData({...formData, preco: e.target.value})} className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2.5 outline-none focus:border-vanta-blue" placeholder="Ex: 5999.00" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preço Antigo (Opcional - R$)</label>
                    <input type="number" step="0.01" value={formData.preco_antigo} onChange={e => setFormData({...formData, preco_antigo: e.target.value})} className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2.5 outline-none focus:border-vanta-blue" placeholder="Deixe vazio se não tiver" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Etiqueta (Badge)</label>
                    <select value={formData.badge} onChange={e => setFormData({...formData, badge: e.target.value})} className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2.5 outline-none focus:border-vanta-blue">
                      <option value="">Nenhuma</option>
                      <option value="Novo">Novo</option>
                      <option value="Oferta">Oferta</option>
                      <option value="Mais Vendido">Mais Vendido</option>
                    </select>
                  </div>
                </div>

              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Cancelar</button>
                <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-lg bg-vanta-blue text-white hover:bg-blue-600 disabled:opacity-50 flex items-center">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
