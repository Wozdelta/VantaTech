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
  pontos?: number;
  pontos_acumulados?: number;
  termos_encomenda_aceitos?: boolean;
  termos_encomenda_ip?: string;
  termos_encomenda_data?: string;
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
    // Busca o usuário atual de forma segura validando com o servidor
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error || !user) {
        // Usuário foi deletado do sistema ou token inválido
        signOut();
        setLoading(false);
        return;
      }
      setUser(user);
      fetchPerfil(user.id);
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

  const fetchPerfil = async (userId: string, tentativas = 3) => {
    try {
      const { data, error } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116' && tentativas > 0) {
          // O perfil pode não ter sido criado pela trigger ainda. Tenta de novo em 1s.
          setTimeout(() => fetchPerfil(userId, tentativas - 1), 1000);
          return;
        }
        // Se der erro ao buscar o perfil e esgotar tentativas, deslogamos preventivamente
        console.warn('Falha crítica de sessão: Perfil não encontrado ou acesso negado. Encerrando sessão por segurança.');
        signOut();
        return;
      }
      setPerfil(data);
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      // Fallback: garante que o state limpa
      setPerfil(null);
    } finally {
      if (tentativas === 3) setLoading(false);
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
