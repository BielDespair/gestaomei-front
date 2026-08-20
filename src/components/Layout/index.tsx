import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { RouteErrorBoundary } from '../RouteErrorBoundary';
import { ClienteModalProvider } from '../../pages/Clientes/modal/ClienteModalProvider';
import { CoffeeMark } from '../CoffeeMark';
import './styles.css';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/vendas', label: 'Vendas', end: false },
  { to: '/clientes', label: 'Clientes', end: false },
  { to: '/entradas', label: 'Entradas', end: false },
  { to: '/produtos', label: 'Produtos', end: false },
];

export function Layout() {
  const { signOut, user } = useAuth();
  const [isNavOpen, setIsNavOpen] = useState(false);

  return (
    <>
      <nav className="navbar navbar-expand-xl navbar-dark navbar-marca shadow-sm sticky-top">
        <div className="container">
          <span className="navbar-brand fw-bold mb-0 d-flex align-items-center gap-2">
            <CoffeeMark size={26} />
            Controle de Estoque
          </span>

          <button
            className="navbar-toggler"
            type="button"
            onClick={() => setIsNavOpen(prev => !prev)}
            aria-controls="mainNav"
            aria-expanded={isNavOpen}
            aria-label="Abrir menu"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className={`collapse navbar-collapse ${isNavOpen ? 'show' : ''}`} id="mainNav">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0 gap-lg-1 mt-3 mt-lg-0">
              {NAV_ITEMS.map(item => (
                <li className="nav-item" key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={() => setIsNavOpen(false)}
                    className={({ isActive }) =>
                      `nav-link px-3 rounded-pill ${isActive ? 'active fw-semibold' : ''}`
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>

            <div className="d-flex align-items-center gap-3 border-top border-lg-0 pt-3 pt-lg-0 mt-2 mt-lg-0">
              <span className="text-nowrap" style={{ color: 'var(--cafe-latte)' }}>
                Olá, <strong>{user?.name}</strong>
              </span>
              <button className="btn btn-sair btn-sm" onClick={signOut}>
                <i className="bi bi-box-arrow-right me-1" aria-hidden="true" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>

      <ClienteModalProvider>
        <main className="container py-4">
          <RouteErrorBoundary>
            <Outlet />
          </RouteErrorBoundary>
        </main>
      </ClienteModalProvider>
    </>
  );
}
