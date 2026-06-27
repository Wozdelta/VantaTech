import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Perfil from './pages/Perfil';
import Pedidos from './pages/Pedidos';
import Fidelidade from './pages/Fidelidade';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="perfil" element={<Perfil />} />
        <Route path="pedidos" element={<Pedidos />} />
        <Route path="fidelidade" element={<Fidelidade />} />
        <Route path="admin" element={<AdminDashboard />} />
      </Route>
    </Routes>
  );
}
