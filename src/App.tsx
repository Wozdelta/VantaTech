import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Perfil from './pages/Perfil';
import Pedidos from './pages/Pedidos';
import Fidelidade from './pages/Fidelidade';
import AdminDashboard from './pages/AdminDashboard';
import ProductDetails from './pages/ProductDetails';
import Produtos from './pages/Produtos';
import Cupons from './pages/Cupons';
import Encomendar from './pages/Encomendar';
import Ajuda from './pages/Ajuda';
import { AlertProvider } from './contexts/AlertContext';
import { SettingsProvider } from './contexts/SettingsContext';

export default function App() {
  const location = useLocation();
  const { user } = useAuth();

  // 1. Captura o ID do link quando acessa o site deslogado
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const ref = searchParams.get('ref');
    if (ref && !user) {
      localStorage.setItem('afiliado_id', ref);
    }
  }, [location.search, user]);

  // 2. Vincula o ID salvo logo após o usuário logar/cadastrar (Google ou Email)
  useEffect(() => {
    if (user) {
      const afiliadoId = localStorage.getItem('afiliado_id');
      if (afiliadoId) {
        // Valida se o ID tem cara de UUID (36 caracteres)
        if (afiliadoId.length === 36 && afiliadoId !== user.id) {
          import('./lib/supabase').then(({ supabase }) => {
            // Atualiza apenas se o perfil ainda não tiver indicação
            supabase.from('perfis')
              .update({ indicado_por: afiliadoId })
              .eq('id', user.id)
              .is('indicado_por', null)
              .then(({ error }) => {
                if (error) {
                  console.warn('Falha ao vincular afiliado (link expirado ou usuário inexistente):', error.message);
                }
                localStorage.removeItem('afiliado_id');
              });
          });
        } else {
          localStorage.removeItem('afiliado_id');
        }
      }
    }
  }, [user]);

  return (
    <SettingsProvider>
      <AlertProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="produtos" element={<Produtos />} />
            <Route path="produto/:id" element={<ProductDetails />} />
            <Route path="perfil" element={<Perfil />} />
            <Route path="pedidos" element={<Pedidos />} />
            <Route path="cupons" element={<Cupons />} />
            <Route path="fidelidade" element={<Fidelidade />} />
            <Route path="encomendar" element={<Encomendar />} />
            <Route path="ajuda" element={<Ajuda />} />
          </Route>
        </Routes>
      </AlertProvider>
    </SettingsProvider>
  );
}
