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
import { AlertProvider } from './contexts/AlertContext';

export default function App() {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const ref = searchParams.get('ref');
    // Só salva o afiliado se o usuário for novo (não estiver logado)
    if (ref && !user) {
      localStorage.setItem('afiliado_id', ref);
    }
  }, [location.search, user]);

  return (
    <AlertProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="produtos" element={<Produtos />} />
          <Route path="produto/:id" element={<ProductDetails />} />
          <Route path="perfil" element={<Perfil />} />
          <Route path="pedidos" element={<Pedidos />} />
          <Route path="fidelidade" element={<Fidelidade />} />
          <Route path="admin" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </AlertProvider>
  );
}
