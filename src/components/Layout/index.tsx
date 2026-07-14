import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './styles.css';

export function Layout() {
  const { signOut, user } = useAuth();

  return (
    <>
      <header className="topbar shadow-sm">
        <div className="container">
          <div className="topbar-header">
            <h1 className="brand">Controle de Estoque</h1>

            <div className="user-area">
              <span className="text-muted">
                Olá, <strong>{user?.name}</strong>
              </span>

              <button
                className="btn btn-outline-danger btn-sm"
                onClick={signOut}
              >
                Sair
              </button>
            </div>
          </div>

          <ul className="nav nav-pills navigation">
            <li className="nav-item">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'active' : ''}`
                }
              >
                Dashboard
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink
                to="/vendas"
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'active' : ''}`
                }
              >
                Vendas
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink
                to="/clientes"
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'active' : ''}`
                }
              >
                Clientes
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink
                to="/estoque"
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'active' : ''}`
                }
              >
                Estoque
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink
                to="/entradas"
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'active' : ''}`
                }
              >
                Entradas
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink
                to="/produtos"
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'active' : ''}`
                }
              >
                Produtos
              </NavLink>
            </li>
          </ul>
        </div>
      </header>

      <main className="container py-4">
        <Outlet />
      </main>
    </>
  );
}