
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PrivateRoute } from './routes/PrivateRoute';
import { Login } from './pages/Login';
import { Layout } from './components/Layout';
import { Produtos } from './pages/Produtos';
import { Clientes } from './pages/Clientes';
import { Entradas } from './pages/Entradas';
import { Vendas } from './pages/Vendas';

// Componentes provisórios (Mocks) para testar as abas
const VisaoGeral = () => <h2>Visão Geral do Sistema</h2>;
const Estoque = () => <h2>Controle de Estoque</h2>;


function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rota Pública */}
          <Route path="/login" element={<Login />} />

          {/* Rotas Protegidas (Exigem Login) */}
          <Route element={<PrivateRoute />}>
            {/* O Layout contém a Navbar. Tudo aqui dentro cai no <Outlet /> do Layout */}
            <Route element={<Layout />}>
              <Route path="/" element={<VisaoGeral />} />
              <Route path="/vendas" element={<Vendas />} />
              <Route path="/entradas" element={<Entradas />} />
              <Route path="/estoque" element={<Estoque />} />
              <Route path="/produtos" element={<Produtos />} />
              <Route path="/clientes" element={<Clientes />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;