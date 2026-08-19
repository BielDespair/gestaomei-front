import { useLocation } from 'react-router-dom';
import { ErrorBoundary } from './ErrorBoundary';
import type { ReactNode } from 'react';

/**
 * ErrorBoundary que se recupera sozinho ao trocar de rota.
 *
 * A key remontando o boundary é o que destrava a navegação: sem isso, uma vez
 * em estado de erro ele continua mostrando a tela de erro mesmo depois de o
 * usuário clicar em outro item do menu.
 */
export function RouteErrorBoundary({ children }: { children: ReactNode }) {
	const location = useLocation();
	return <ErrorBoundary key={location.pathname}>{children}</ErrorBoundary>;
}
