import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

type AcessoLevel = 'todos' | 'admin';

type Settings = {
  acesso_loja: AcessoLevel;
  acesso_pedidos: AcessoLevel;
  acesso_cupons: AcessoLevel;
  acesso_fidelidade: AcessoLevel;
  acesso_perfil: AcessoLevel;
  acesso_encomendas: AcessoLevel;
  acesso_ajuda: AcessoLevel;
  acesso_chatbot: AcessoLevel;
};

type SettingsContextType = {
  settings: Settings;
  loadingSettings: boolean;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
};

const defaultSettings: Settings = {
  acesso_loja: 'todos',
  acesso_pedidos: 'todos',
  acesso_cupons: 'todos',
  acesso_fidelidade: 'todos',
  acesso_perfil: 'todos',
  acesso_encomendas: 'todos',
  acesso_ajuda: 'todos',
  acesso_chatbot: 'todos',
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  loadingSettings: true,
  updateSettings: async () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    fetchSettings();
    
    const channel = supabase
      .channel('public:configuracoes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'configuracoes' },
        (payload) => {
          if (payload.new) {
            setSettings(payload.new as Settings);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchSettings() {
    try {
      const { data, error } = await supabase
        .from('configuracoes')
        .select('*')
        .eq('id', 1)
        .single();

      if (error) {
        // Se a tabela não existir ou não tiver a linha 1, engole o erro e usa o padrão
        console.warn('Usando configurações padrão (banco não configurado ou erro)', error.message);
      } else if (data) {
        setSettings(data);
      }
    } catch (err) {
      console.warn('Erro ao buscar configurações', err);
    } finally {
      setLoadingSettings(false);
    }
  }

  async function updateSettings(newSettings: Partial<Settings>) {
    try {
      // Upsert para garantir que se a linha 1 não existir, ela seja criada
      const { error } = await supabase
        .from('configuracoes')
        .upsert({ id: 1, ...settings, ...newSettings });

      if (error) throw error;
      setSettings(prev => ({ ...prev, ...newSettings }));
    } catch (err) {
      console.error('Erro ao atualizar configurações', err);
      throw err;
    }
  }

  return (
    <SettingsContext.Provider value={{ settings, loadingSettings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
