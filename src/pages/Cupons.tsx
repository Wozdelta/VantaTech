import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Tag, Search, Copy, CheckCircle, Info, Clock, DollarSign, Box } from 'lucide-react';
import { useAlert } from '../contexts/AlertContext';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

export default function Cupons() {
  const [cupons, setCupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const { settings } = useSettings();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { showAlert } = useAlert();
  const { user, perfil } = useAuth();
  const [niveis, setNiveis] = useState<any[]>([]);

  const showCupons = settings?.acesso_cupons === 'todos' || perfil?.cargo === 'Admin';

  useEffect(() => {
    fetchCupons();
  }, [user]);

  async function fetchCupons() {
    try {
      const [cuponsRes, niveisRes] = await Promise.all([
        supabase.from('cupons').select('*').eq('ativo', true).order('criado_em', { ascending: false }),
        supabase.from('niveis_fidelidade').select('*')
      ]);

      if (cuponsRes.error) throw cuponsRes.error;
      
      const fetchedNiveis = niveisRes.data || [];
      setNiveis(fetchedNiveis);

      const now = new Date();
      const umHoraAtras = new Date(now.getTime() - 60 * 60 * 1000);
      const userPontos = perfil?.pontos_acumulados || 0;
      
      const cuponsProcessados = (cuponsRes.data || []).map(c => {
        let isExpired = false;
        let isWayPastExpired = false;
        
        if (c.data_expiracao) {
          let expDateStr = c.data_expiracao;
          if (!expDateStr.endsWith('Z') && !expDateStr.includes('+') && !expDateStr.includes('-')) {
            expDateStr += 'Z';
          }
          const expDate = new Date(expDateStr);
          isExpired = expDate < now;
          isWayPastExpired = expDate < umHoraAtras;
        }
        const isEsgotado = c.quantidade_disponivel !== null && c.quantidade_disponivel <= 0;
        
        return { 
          ...c, 
          isExpired: isExpired || isEsgotado, 
          isWayPastExpired, 
          isEsgotado,
          isOnlyExpired: isExpired && !isEsgotado
        };
      });

      // Tentar deletar cupons muito expirados silenciosamente
      const cuponsParaDeletar = cuponsProcessados.filter(c => c.isWayPastExpired).map(c => c.id);
      if (cuponsParaDeletar.length > 0) {
        supabase.from('cupons').delete().in('id', cuponsParaDeletar).then(() => {}).catch(() => {});
      }

      const validCupons = cuponsProcessados.filter(c => {
        // Ignorar se passou de 1 hora da expiração
        if (c.isWayPastExpired) {
          return false;
        }
        
        // Ignorar se é de outro usuário
        if (c.user_id && (!user || user.id !== c.user_id)) {
          return false;
        }

        // Ignorar se não atinge o nível do clube exigido
        if (c.nivel_id) {
          const nivelReq = fetchedNiveis.find(n => n.id === c.nivel_id);
          if (nivelReq && userPontos < nivelReq.pontos_minimos) {
            return false;
          }
        }

        return true;
      });

      setCupons(validCupons);
    } catch (error) {
      console.error('Erro ao buscar cupons:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatDiscount = (cupom: any) => {
    if (cupom.tipo_desconto === 'porcentagem') {
      return `${cupom.valor_desconto}% OFF`;
    }
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cupom.valor_desconto) + ' OFF';
  };

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const copyToClipboard = (codigo: string, id: string) => {
    navigator.clipboard.writeText(codigo);
    setCopiedId(id);
    showAlert({ title: 'Sucesso', message: 'Código do cupom copiado!', type: 'success' });
    setTimeout(() => setCopiedId(null), 3000);
  };

  const filteredCupons = cupons.filter(c => c.codigo.toLowerCase().includes(searchTerm.toLowerCase()));

  if (!showCupons) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 text-vanta-blue rounded-full flex items-center justify-center mb-6">
          <Tag className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-4 text-center">
          Meus Cupons em Breve!
        </h1>
        <p className="text-gray-500 text-center max-w-md">
          Estamos preparando um novo sistema de cupons e descontos exclusivos para você. Fique de olho!
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Tag className="w-8 h-8 text-vanta-blue" />
            Meus Cupons
          </h1>
          <p className="text-gray-500 mt-2 text-sm md:text-base">
            Aqui você encontra todos os cupons ativos para usar nas suas compras!
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="relative max-w-md mb-8">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar por código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-vanta-blue/20 focus:border-vanta-blue transition-all"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : filteredCupons.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
            <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Nenhum cupom disponível no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredCupons.map((cupom) => (
              <div key={cupom.id} className={`group relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col md:flex-row transition-all ${cupom.isExpired ? 'opacity-60 grayscale' : ''}`}>
                {/* Linha tracejada (Estilo Ingresso) */}
                <div className={`w-full md:w-24 h-12 md:h-auto flex flex-row md:flex-col justify-center items-center relative overflow-hidden shrink-0 ${cupom.isExpired ? 'bg-gray-400' : 'bg-vanta-blue'}`}>
                  <div className="hidden md:block absolute -top-3 -right-3 w-6 h-6 bg-white dark:bg-gray-900 rounded-full"></div>
                  <div className="hidden md:block absolute -bottom-3 -right-3 w-6 h-6 bg-white dark:bg-gray-900 rounded-full"></div>
                  <Tag className="w-6 h-6 md:w-8 md:h-8 text-white/80 md:-rotate-90 transform" />
                </div>
                
                <div className="p-5 flex-1 flex flex-col justify-between border-t md:border-t-0 md:border-l border-dashed border-gray-300 dark:border-gray-600">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                      {cupom.isEsgotado ? 'ESGOTADO' : cupom.isOnlyExpired ? 'EXPIRADO' : formatDiscount(cupom)}
                      {cupom.user_id && !cupom.isExpired && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-full text-[10px] font-bold uppercase tracking-wider">Exclusivo</span>}
                    </h3>
                    <p className={`text-sm font-medium mb-3 ${cupom.isExpired ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      Código: <span className={`font-bold text-base px-2 py-0.5 rounded-md ${cupom.isExpired ? 'text-gray-500 bg-gray-100 dark:bg-gray-800' : 'text-vanta-blue bg-blue-50 dark:bg-blue-900/20'}`}>{cupom.codigo}</span>
                    </p>
                    
                    <div className="space-y-1.5 mb-2">
                      {cupom.data_expiracao && (
                        <p className="text-xs text-red-500 font-medium flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          Válido até {new Date(cupom.data_expiracao).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                      )}
                      {cupom.nivel_id && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5" />
                          Clube: Nível {niveis.find(n => n.id === cupom.nivel_id)?.nome || 'Especial'}
                        </p>
                      )}
                      {cupom.categoria_nome && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 font-medium flex items-center gap-1.5">
                          <Box className="w-3.5 h-3.5" />
                          Apenas {cupom.categoria_nome}
                        </p>
                      )}
                      {(cupom.valor_minimo || cupom.valor_maximo) && (
                        <p className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5" />
                          Compras de {cupom.valor_minimo ? formatMoney(cupom.valor_minimo) : 'R$ 0,00'} 
                          {cupom.valor_maximo ? ` até ${formatMoney(cupom.valor_maximo)}` : ' em diante'}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => !cupom.isExpired && copyToClipboard(cupom.codigo, cupom.id)}
                    disabled={cupom.isExpired}
                    className={`mt-4 w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                      cupom.isExpired 
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                        : copiedId === cupom.id
                          ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    {cupom.isEsgotado ? (
                      <>
                        <Clock className="w-4 h-4" />
                        Esgotado
                      </>
                    ) : cupom.isOnlyExpired ? (
                      <>
                        <Clock className="w-4 h-4" />
                        Expirado
                      </>
                    ) : copiedId === cupom.id ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copiar Código
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
