import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
	children: ReactNode;
	/** Substitui a tela padrão de erro, se quiser algo específico. */
	fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
	error: Error | null;
}

/**
 * Captura erros lançados durante o render dos filhos e mostra uma tela de erro
 * no lugar de derrubar a aplicação inteira.
 *
 * Precisa ser componente de classe: não existe equivalente em hook.
 *
 * NÃO captura: erros dentro de funções async, event handlers, ou setTimeout.
 * Esses continuam por conta dos try/catch de quem chama.
 */
export class ErrorBoundary extends Component<Props, State> {
	state: State = { error: null };

	static getDerivedStateFromError(error: Error): State {
		return { error };
	}

	componentDidCatch(error: Error, info: ErrorInfo) {
		// Trocar por um serviço de log quando houver um.
		console.error('Erro não tratado no render:', error, info.componentStack);
	}

	reset = () => this.setState({ error: null });

	render() {
		const { error } = this.state;
		const { children, fallback } = this.props;

		if (!error) return children;
		if (fallback) return fallback(error, this.reset);

		return (
			<div className="container py-5 text-center">
				<i
					className="bi bi-x-circle text-danger"
					style={{ fontSize: '3rem' }}
					aria-hidden="true"
				/>
				<h4 className="mt-3 mb-4">Ops! Algo deu errado</h4>
			</div>
		);
	}
}
