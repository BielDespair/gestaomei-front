import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoadingState } from '../components/LoadingState';

export function PrivateRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  // Enquanto o AuthContext ainda está validando um token salvo (ao abrir o
  // app ou dar F5), isAuthenticated começa como `false` por padrão. Sem essa
  // checagem, todo mundo é jogado pro /login por uma fração de segundo — e,
  // como o <Navigate> já disparou, o usuário fica preso lá mesmo depois da
  // validação terminar e confirmar que ele estava logado.
  if (isLoading) {
    return <LoadingState />;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}