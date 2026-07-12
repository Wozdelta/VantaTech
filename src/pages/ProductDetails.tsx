import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCart } from '@/contexts/CartContext';
import { useAlert } from '../contexts/AlertContext';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import BlockScreen from '../components/common/BlockScreen';
import { Loader2, ArrowLeft, ShieldCheck, Truck, ShoppingCart, Battery } from 'lucide-react';
import DOMPurify from 'dompurify';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { showAlert } = useAlert();
  
  const [product, setProduct] = useState<any>(null);
  const { settings } = useSettings();
  const { perfil } = useAuth();
  const showLoja = settings.acesso_loja === 'todos' || perfil?.cargo === 'Admin';
  const [loading, setLoading] = useState(true);
  const [soldVariants, setSoldVariants] = useState<{cor: string, storage: string, status: string}[]>([]);
  const [isProductCompletelySold, setIsProductCompletelySold] = useState(false);
  
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedStorage, setSelectedStorage] = useState('');
  const [mainImage, setMainImage] = useState('');
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Legacy variants in case they use old system
  const [variants, setVariants] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      fetchProductAndVariants();
    }
  }, [id]);

  useEffect(() => {
    if (!product) return;
    
    let images: string[] = [];
    if (product.galeria && product.galeria.length > 0) {
      images = product.galeria.map((g: any) => g.url);
    } else {
      images = [product.imagem_url];
    }
    
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      setMainImage(current => {
        const currentIndex = images.indexOf(current);
        if (currentIndex === -1 || currentIndex === images.length - 1) {
          return images[0];
        }
        return images[currentIndex + 1];
      });
    }, 8000); // Troca a cada 8 segundos

    return () => clearInterval(interval);
  }, [product, mainImage]);

  async function fetchProductAndVariants() {
    setLoading(true);
    try {
      // Busca o produto clicado
      const { data: mainProduct, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      
      let fullySold = false;
      if (!mainProduct.ativo) {
        fullySold = true;
      }
      
      setProduct(mainProduct);
      
      // Busca variantes do mesmo nome (caso seja o sistema legado)
      const { data: allVariants } = await supabase
        .from('produtos')
        .select('*')
        .eq('nome', mainProduct.nome)
        .eq('ativo', true);

      if (allVariants) {
        setVariants(allVariants);
      }

      // Buscar cores/itens que já foram vendidos ou estão pendentes
      const { data: itemsSold } = await supabase
        .from('itens_pedido')
        .select(`
          produto_nome,
          pedidos!inner(status)
        `)
        .eq('produto_id', id)
        .in('pedidos.status', ['Enviado', 'Entregue']);

      if (itemsSold) {
        const sold: {cor: string, storage: string, status: string}[] = [];
        
        itemsSold.forEach(item => {
          const corMatch = item.produto_nome.match(/Cor:\s*([^-]+)/i);
          const storageMatch = item.produto_nome.match(/Cor:\s*[^-]+\s*-\s*(.+)$/i);
          
          if (corMatch && corMatch[1]) {
            const cor = corMatch[1].trim().toLowerCase();
            const storage = storageMatch && storageMatch[1] ? storageMatch[1].trim().toLowerCase() : '';
            sold.push({ cor, storage, status: item.pedidos.status });
          } else {
            // Produto vendido inteiro
            sold.push({ cor: 'INTEIRO', storage: '', status: item.pedidos.status });
            if (item.pedidos.status === 'Enviado') {
              fullySold = true;
            }
          }
        });
        
        setSoldVariants(sold);
        setIsProductCompletelySold(fullySold);

        // Mágica: Remove do produto os itens "Entregues" para que sumam completamente da página
        if (mainProduct.galeria) {
          mainProduct.galeria = mainProduct.galeria.filter((g: any) => {
            const isInteiroEntregue = sold.some(sv => sv.status === 'Entregue' && sv.cor === 'INTEIRO');
            if (isInteiroEntregue) return false;

            let colors = g.cor ? g.cor.split(',').map((c:string)=>c.trim()) : [''];
            let storages = g.memoria ? g.memoria.split(',').map((m:string)=>m.trim()) : [''];

            if (g.memoria) {
              const remainingStorages = storages.filter(st => {
                return !colors.some(c => 
                  sold.some(sv => sv.status === 'Entregue' && sv.cor === c.toLowerCase() && sv.storage === st.toLowerCase())
                );
              });
              g.memoria = remainingStorages.join(',');
              if (remainingStorages.length === 0) return false; // Remove da galeria pois todos os armazenamentos foram entregues
            } else if (g.cor) {
              const remainingColors = colors.filter(c => {
                return !sold.some(sv => sv.status === 'Entregue' && sv.cor === c.toLowerCase());
              });
              g.cor = remainingColors.join(',');
              if (remainingColors.length === 0) return false; // Remove da galeria pois todas as cores foram entregues
            }
            
            return true;
          });
          
          // Se esvaziou a galeria por causa de entregas, limpamos o legado também
          const hasColors = mainProduct.galeria.some((g: any) => g.cor);
          if (!hasColors && sold.some(sv => sv.status === 'Entregue')) {
            mainProduct.cor = '';
            mainProduct.memoria = '';
            fullySold = true; // Força como esgotado se não tem mais nada
          }
        }
      }
      
      setIsProductCompletelySold(fullySold);

      // Parseia as opções do produto (apenas para compatibilidade com sistema legado se precisar,
      // mas não pré-seleciona nada, obrigando o cliente a escolher)
      setSelectedColor('');
      setSelectedStorage('');
      
      // Define imagem principal inicial
      setMainImage(mainProduct.imagem_url);
      
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
    } finally {
      setLoading(false);
    }
  }

  // Efeito para trocar a imagem principal quando a cor mudar
  useEffect(() => {
    if (!product) return;

    // Se o produto tiver galeria
    if (product.galeria && product.galeria.length > 0) {
      let matchingImage = product.galeria.find((img: any) => {
        const matchCor = img.cor?.toLowerCase().split(',').map((c:string)=>c.trim()).includes(selectedColor.toLowerCase().trim());
        const matchMem = selectedStorage && img.memoria && img.memoria.toLowerCase().split(',').map((m:string)=>m.trim()).includes(selectedStorage.toLowerCase().trim());
        return matchCor && matchMem;
      });
      if (!matchingImage) {
        matchingImage = product.galeria.find((img: any) => 
          img.cor?.toLowerCase().split(',').map((c:string)=>c.trim()).includes(selectedColor.toLowerCase().trim())
        );
      }
      
      if (matchingImage) {
        setMainImage(matchingImage.url);
      }
    } 
    // Se não tiver galeria, tenta achar no sistema antigo de variantes (outra linha na tabela)
    else if (variants.length > 0) {
      const matchingVariant = variants.find(v => 
        v.cor?.toLowerCase().trim() === selectedColor.toLowerCase().trim() &&
        (v.memoria?.toLowerCase().trim() === selectedStorage.toLowerCase().trim() || !selectedStorage)
      );
      if (matchingVariant) {
        setMainImage(matchingVariant.imagem_url);
      }
    }
  }, [selectedColor, product, variants, selectedStorage]);

  // Montagem das opções disponíveis (suporta novo sistema com vírgulas ou antigo com variantes)
  let availableColors: string[] = [];
  let availableStorages: string[] = [];

  if (product) {
    if (product.cor && product.cor.includes(',')) {
      availableColors = product.cor.split(',').map((c: string) => c.trim()).filter(Boolean);
    } else {
      availableColors = Array.from(new Set(variants.map(v => v.cor?.trim()))).filter(Boolean) as string[];
    }

    if (product.memoria && product.memoria.includes(',')) {
      availableStorages = product.memoria.split(',').map((m: string) => m.trim()).filter(Boolean);
    } else {
      availableStorages = Array.from(new Set(variants.map(v => v.memoria?.trim()))).filter(Boolean) as string[];
    }

    // Sobrescreve e cruza as informações se existirem na galeria
    if (product.galeria && product.galeria.length > 0) {
      let allColors: string[] = [];
      product.galeria.forEach((g: any) => {
        if (g.cor) g.cor.split(',').forEach((c: string) => allColors.push(c.trim()));
      });
      allColors = Array.from(new Set(allColors.filter(Boolean)));
      if (allColors.length > 0) availableColors = allColors;

      if (selectedColor) {
        const matchingImages = product.galeria.filter((g: any) => 
          g.cor?.toLowerCase().split(',').map((c:string)=>c.trim()).includes(selectedColor.toLowerCase().trim())
        );
        let storages: string[] = [];
        matchingImages.forEach((g: any) => {
          if (g.memoria) g.memoria.split(',').forEach((m: string) => storages.push(m.trim()));
        });
        storages = Array.from(new Set(storages.filter(Boolean)));
        if (storages.length > 0) availableStorages = storages;
      } else {
        let allStorages: string[] = [];
        product.galeria.forEach((g: any) => {
          if (g.memoria) g.memoria.split(',').forEach((m: string) => allStorages.push(m.trim()));
        });
        allStorages = Array.from(new Set(allStorages.filter(Boolean)));
        if (allStorages.length > 0) availableStorages = allStorages;
      }
    }
  }

  let exactImage: any = null;
  if (product?.galeria && product.galeria.length > 0 && selectedColor) {
    exactImage = product.galeria.find((g: any) => {
      const matchCor = g.cor?.toLowerCase().split(',').map((c:string)=>c.trim()).includes(selectedColor.toLowerCase().trim());
      const matchMem = !selectedStorage || !g.memoria || g.memoria.toLowerCase().split(',').map((m:string)=>m.trim()).includes(selectedStorage.toLowerCase().trim());
      return matchCor && matchMem;
    });
  }

  let displayPreco = product?.preco;
  let displayPrecoAntigo = product?.preco_antigo;
  
  if (exactImage && exactImage.preco) {
    displayPreco = Number(exactImage.preco);
    displayPrecoAntigo = exactImage.preco_antigo ? Number(exactImage.preco_antigo) : null;
  }

  const checkColorSold = (cor: string) => {
    if (product?.galeria && product.galeria.length > 0) {
      const imagesOfColor = product.galeria.filter((g: any) => g.cor?.toLowerCase().split(',').map((c:string)=>c.trim()).includes(cor.toLowerCase()));
      if (imagesOfColor.length === 0) return false;
      return imagesOfColor.every((g: any) => {
        const storages = g.memoria ? g.memoria.split(',').map((m:string)=>m.trim().toLowerCase()) : [''];
        return storages.every((st: string) => 
          soldVariants.some(sv => sv.cor === cor.toLowerCase() && sv.storage === st)
        );
      });
    }
    return soldVariants.some(sv => sv.cor === cor.toLowerCase());
  };

  const checkStorageSold = (mem: string) => {
    if (selectedColor) {
      return soldVariants.some(sv => sv.cor === selectedColor.toLowerCase() && sv.storage === mem.toLowerCase());
    }
    if (product?.galeria && product.galeria.length > 0) {
      const imagesOfStorage = product.galeria.filter((g: any) => g.memoria?.toLowerCase().split(',').map((m:string)=>m.trim()).includes(mem.toLowerCase()));
      if (imagesOfStorage.length === 0) return false;
      return imagesOfStorage.every((g: any) => {
        const colors = g.cor ? g.cor.split(',').map((c:string)=>c.trim().toLowerCase()) : [''];
        return colors.every((c: string) => 
          soldVariants.some(sv => sv.cor === c && sv.storage === mem.toLowerCase())
        );
      });
    }
    return false;
  };

  const handleAddToCart = () => {
    if (availableColors.length > 0 && !selectedColor) {
      showAlert({ title: 'Atenção', message: 'Por favor, selecione uma cor antes de adicionar ao carrinho.', type: 'warning' });
      return;
    }
    if (availableStorages.length > 0 && !selectedStorage) {
      showAlert({ title: 'Atenção', message: 'Por favor, selecione a capacidade (memória) antes de adicionar ao carrinho.', type: 'warning' });
      return;
    }

    addToCart({
      productId: product.id,
      name: product.nome,
      price: displayPreco || product.preco,
      image: exactImage?.url || mainImage,
      color: selectedColor || undefined,
      storage: selectedStorage || undefined,
      category: product.categoria,
      quantity: 1,
      isItem: !(product.cor || product.memoria || (product.galeria && product.galeria.length > 0 && product.galeria.some((g:any)=>g.cor)) || availableStorages.length > 0),
      maxQuantity: typeof product.estoque === 'number' ? product.estoque : undefined
    });
  };

  if (!showLoja) {
    return (
      <BlockScreen 
        title="Página em Manutenção" 
        message="A visualização de produtos está fechada temporariamente para atualizações. Volte em breve!" 
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-12 h-12 animate-spin text-vanta-blue" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Produto não encontrado</h2>
        <button onClick={() => navigate('/produtos')} className="text-vanta-blue hover:underline">Voltar para a loja</button>
      </div>
    );
  }

  // Pega todas as imagens (galeria + principal se não estiver na galeria)
  let allImages: string[] = [];
  if (product.galeria && product.galeria.length > 0) {
    allImages = product.galeria.map((g: any) => g.url);
  } else {
    allImages = [product.imagem_url];
  }

  const onPointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const currentX = e.clientX;
    const diff = currentX - startX;
    
    // Calcula resistência (rubber band) nas bordas
    const currentIndex = allImages.indexOf(mainImage);
    const isFirst = currentIndex === 0;
    const isLast = currentIndex === allImages.length - 1;
    
    let offset = diff;
    if ((isFirst && diff > 0) || (isLast && diff < 0)) {
      offset = diff * 0.3;
    }
    
    setDragOffset(offset);
  };

  const onPointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const containerWidth = containerRef.current?.offsetWidth || 300;
    const threshold = containerWidth * 0.25; // 25% para mudar
    const currentIndex = allImages.indexOf(mainImage);
    
    if (dragOffset > threshold && currentIndex > 0) {
      setMainImage(allImages[currentIndex - 1]);
    } else if (dragOffset < -threshold && currentIndex < allImages.length - 1) {
      setMainImage(allImages[currentIndex + 1]);
    }
    
    setDragOffset(0);
  };

  const onPointerLeave = () => {
    if (isDragging) {
      onPointerUp();
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 pt-6 lg:pt-8 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 dark:text-gray-400 hover:text-vanta-blue transition-colors mb-8 group">
          <ArrowLeft className="w-5 h-5 mr-2 transition-transform group-hover:-translate-x-1" />
          Voltar
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-24">
          
          {/* Lado Esquerdo - Imagem Gigante e Galeria */}
          <div className="flex flex-col gap-4 relative lg:sticky lg:top-32 h-fit">
            <div 
              ref={containerRef}
              className="relative h-[40vh] md:h-[50vh] lg:h-[65vh] w-full bg-gray-50 dark:bg-gray-900 rounded-[32px] lg:rounded-[40px] overflow-hidden touch-pan-y select-none cursor-grab active:cursor-grabbing"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerLeave}
              onPointerCancel={onPointerLeave}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-vanta-blue/10 dark:bg-vanta-blue/5 rounded-full blur-[80px] lg:blur-[100px] pointer-events-none"></div>
              
              <div 
                className="flex h-full w-full will-change-transform"
                style={{
                  transform: `translateX(calc(-${Math.max(0, allImages.indexOf(mainImage)) * 100}% + ${dragOffset}px))`,
                  transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)'
                }}
              >
                {allImages.map((url, i) => (
                  <div key={i} className="flex-shrink-0 w-full h-full flex items-center justify-center pointer-events-none">
                    <img 
                      src={url || '/Phone.png'} 
                      alt={`${product.nome} - Imagem ${i + 1}`} 
                      className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal pointer-events-none drop-shadow-sm"
                      draggable="false"
                    />
                  </div>
                ))}
              </div>

              {product.badge && (
                <div className="absolute top-8 left-8 z-20 bg-vanta-orange text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg">
                  {product.badge}
                </div>
              )}
            </div>

            {/* Mini Galeria */}
            {allImages.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {allImages.map((url: string, index: number) => (
                  <button 
                    key={index}
                    onClick={() => setMainImage(url)}
                    className={`flex-shrink-0 w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-2xl border-2 transition-all overflow-hidden ${mainImage === url ? 'border-vanta-blue' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-700'}`}
                  >
                    <img src={url} className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal rounded-xl" alt={`Miniatura ${index+1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Lado Direito - Informações */}
          <div className="flex flex-col justify-center">
            
            <span className="text-vanta-blue font-bold tracking-widest uppercase text-xs lg:text-sm mb-2 lg:mb-3 mt-4 lg:mt-0">
              {product.marca}
            </span>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight leading-tight">
              {product.nome}
            </h1>

            <div className="flex flex-wrap items-center gap-3 mb-8">
               <span className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm font-semibold">
                 {product.condicao?.replace(/premium/i, '').trim() || product.condicao}
               </span>
               <span className="bg-blue-50 dark:bg-blue-900/30 text-vanta-blue px-3 py-1 rounded-full text-sm font-semibold">
                 Em Estoque
               </span>
               {exactImage?.mostrar_bateria && exactImage?.bateria && (
                 <span className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 shadow-sm transition-all hover:scale-105">
                   <Battery className="w-4 h-4" /> 
                   <span>Saúde da Bateria: <span className="text-emerald-700 dark:text-emerald-300 font-black">{exactImage.bateria}%</span></span>
                 </span>
               )}
            </div>

            <div className="mb-8 lg:mb-10">
              <div className="flex items-baseline gap-4">
                <span className="text-4xl lg:text-5xl font-black text-gray-900 dark:text-white">
                  R$ {displayPreco?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              {displayPrecoAntigo && (
                <span className="text-base lg:text-lg text-gray-400 line-through mt-2 block">
                  R$ {displayPrecoAntigo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              )}
              <p className="text-sm text-gray-500 mt-2">Em até 12x com juros no cartão de crédito.</p>
            </div>

            {/* Seletor de Cores */}
            {availableColors.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">
                  Cor: <span className="text-gray-500 font-normal capitalize">{selectedColor}</span>
                </h3>
                <div className="flex flex-wrap gap-4">
                  {availableColors.map(cor => {
                    const isColorSold = checkColorSold(cor);
                    const galleryItem = product?.galeria?.find((g: any) => g.cor?.toLowerCase() === cor.toLowerCase());
                    const isImage = galleryItem?.cor_tipo === 'image';
                    const bgStyle = isImage && galleryItem?.cor_valor ? 
                      { backgroundImage: `url(${galleryItem.cor_valor})`, backgroundSize: 'cover', backgroundPosition: 'center' } : 
                      { backgroundColor: galleryItem?.cor_valor || '#ccc' };

                    return (
                      <button
                        key={cor}
                        onClick={() => {
                          if (!isColorSold) {
                            if (selectedColor === cor) {
                              setSelectedColor('');
                              setSelectedStorage('');
                            } else {
                              setSelectedColor(cor);
                              if (product.galeria && product.galeria.length > 0) {
                                const matchingImages = product.galeria.filter((g: any) => 
                                  g.cor?.toLowerCase().split(',').map((c:string)=>c.trim()).includes(cor.toLowerCase())
                                );
                                let storages: string[] = [];
                                matchingImages.forEach((g: any) => {
                                  if (g.memoria) g.memoria.split(',').forEach((m: string) => storages.push(m.trim()));
                                });
                                storages = Array.from(new Set(storages.filter(Boolean)));
                                if (storages.length === 1) {
                                  setSelectedStorage(storages[0]);
                                } else if (selectedStorage && !storages.some(s => s.toLowerCase() === selectedStorage.toLowerCase())) {
                                  setSelectedStorage('');
                                }
                              }
                            }
                          }
                        }}
                        disabled={isColorSold}
                        className={`relative w-12 h-12 rounded-full overflow-hidden flex items-center justify-center transition-all shadow-sm ${
                          isColorSold ? 'opacity-30 cursor-not-allowed grayscale' :
                          selectedColor.toLowerCase() === cor.toLowerCase() ? 'ring-2 ring-offset-4 ring-vanta-blue dark:ring-offset-gray-950 scale-110' : 'ring-1 ring-gray-200 dark:ring-gray-700 hover:scale-105'
                        }`}
                        style={bgStyle}
                        title={isColorSold ? `${cor} (Indisponível)` : cor}
                        aria-label={`Cor ${cor}`}
                      >
                        {isColorSold && (
                          <div className="absolute w-[150%] h-[2px] bg-red-600 rotate-45" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Seletor de Armazenamento */}
            {availableStorages.length > 0 && (
              <div className="mb-10">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">
                  Armazenamento
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {availableStorages.map(mem => (
                    <button
                      key={mem}
                      onClick={() => {
                        if (selectedStorage === mem) {
                          setSelectedStorage('');
                          setSelectedColor('');
                        } else {
                          setSelectedStorage(mem);
                          if (product.galeria && product.galeria.length > 0) {
                            const matchingImages = product.galeria.filter((g: any) => 
                              g.memoria?.toLowerCase().split(',').map((m:string)=>m.trim()).includes(mem.toLowerCase())
                            );
                            let colors: string[] = [];
                            matchingImages.forEach((g: any) => {
                              if (g.cor) g.cor.split(',').forEach((c: string) => colors.push(c.trim()));
                            });
                            colors = Array.from(new Set(colors.filter(Boolean)));
                            if (colors.length === 1) {
                              setSelectedColor(colors[0]);
                            } else if (selectedColor && !colors.some(c => c.toLowerCase() === selectedColor.toLowerCase())) {
                              setSelectedColor('');
                            }
                          }
                        }
                      }}
                      disabled={checkStorageSold(mem)}
                      className={`relative py-4 rounded-2xl border-2 transition-all font-bold text-sm overflow-hidden ${
                        checkStorageSold(mem) 
                          ? 'opacity-30 cursor-not-allowed border-gray-200 dark:border-gray-800 text-gray-400 bg-gray-50 dark:bg-gray-900/50 grayscale' 
                          : selectedStorage.toLowerCase() === mem.toLowerCase() 
                            ? 'border-vanta-blue bg-blue-50 dark:bg-blue-900/20 text-vanta-blue' 
                            : 'border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-700'
                      }`}
                      title={checkStorageSold(mem) ? `${mem} (Indisponível)` : mem}
                    >
                      {checkStorageSold(mem) && (
                        <div className="absolute w-[150%] h-[2px] bg-red-600 rotate-[20deg] left-[-25%] top-1/2" />
                      )}
                      {mem}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Descrição */}
            {product.descricao && (
              <div className="mb-10">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Sobre o Aparelho</h3>
                <div className={`relative transition-all duration-300 ${!showFullDescription ? 'max-h-24 overflow-hidden' : ''}`}>
                  <div 
                    className="text-gray-600 dark:text-gray-400 leading-relaxed [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_b]:font-black [&_i]:italic [&_u]:underline whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.descricao) }}
                  />
                  {!showFullDescription && product.descricao.length > 200 && (
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-gray-950 to-transparent pointer-events-none"></div>
                  )}
                </div>
                {product.descricao.length > 200 && (
                  <button 
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="mt-2 text-vanta-blue font-bold hover:underline text-sm"
                  >
                    {showFullDescription ? 'Ler menos' : 'Ver mais'}
                  </button>
                )}
              </div>
            )}

            {/* Botão de Compra */}
            <div className="mt-auto">
              <button 
                onClick={handleAddToCart}
                disabled={isProductCompletelySold || (selectedColor && checkColorSold(selectedColor)) || (selectedStorage && checkStorageSold(selectedStorage))}
                className="w-full bg-vanta-blue hover:bg-blue-600 text-white py-5 rounded-2xl font-extrabold text-xl shadow-[0_15px_30px_rgba(29,142,255,0.3)] hover:shadow-[0_20px_40px_rgba(29,142,255,0.4)] transition-all hover:-translate-y-1 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:shadow-none"
              >
                <ShoppingCart className="w-6 h-6" />
                {isProductCompletelySold || (selectedColor && checkColorSold(selectedColor)) || (selectedStorage && checkStorageSold(selectedStorage))
                  ? 'Indisponível / Pendente' 
                  : 'Adicionar ao Carrinho'}
              </button>

              {/* Badges de Confiança */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                  <ShieldCheck className="w-6 h-6 text-green-500" />
                  <span className="text-sm font-medium">Garantia VantaTech</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                  <Truck className="w-6 h-6 text-vanta-blue" />
                  <span className="text-sm font-medium">Envio Expresso</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
