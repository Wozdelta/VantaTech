import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface Perfil {
  id: string;
  nome_completo: string | null;
  cargo: string;
  criado_em: string;
  cep?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  perfil: Perfil | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshPerfil: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  perfil: null,
  loading: true,
  signOut: async () => {},
  refreshPerfil: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Busca a sessão atual quando o app carrega
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchPerfil(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Ouve mudanças de auth (login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchPerfil(session.user.id);
        } else {
          setPerfil(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchPerfil = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setPerfil(data);
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshPerfil = async () => {
    if (user) {
      await fetchPerfil(user.id);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, perfil, loading, signOut, refreshPerfil }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
