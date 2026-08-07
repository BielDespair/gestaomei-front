import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useRef,
	useState,
	type ReactNode,
} from 'react';
import { ModalShell } from '../ModalShell';

type ToastKind = 'success' | 'danger' | 'warning' | 'info';

interface Toast {
	id: number;
	kind: ToastKind;
	message: ReactNode;
}

export interface ConfirmOptions {
	title?: string;
	message: ReactNode;
	confirmLabel?: string;
	cancelLabel?: string;
	/** Botão vermelho, para ações destrutivas. */
	danger?: boolean;
}

interface Ctx {
	sucesso: (message: ReactNode) => void;
	erro: (message: ReactNode) => void;
	aviso: (message: ReactNode) => void;
	confirmar: (opts: ConfirmOptions) => Promise<boolean>;
}

const FeedbackContext = createContext<Ctx | null>(null);

export function useFeedback() {
	const ctx = useContext(FeedbackContext);
	if (!ctx) throw new Error('useFeedback precisa estar dentro de <FeedbackProvider>');
	return ctx;
}

const DURACAO: Record<ToastKind, number> = {
	success: 4000,
	info: 4000,
	warning: 6000,
	danger: 8000,
};

const ICONE: Record<ToastKind, string> = {
	success: 'bi-check-circle',
	danger: 'bi-exclamation-octagon',
	warning: 'bi-exclamation-triangle',
	info: 'bi-info-circle',
};

export function FeedbackProvider({ children }: { children: ReactNode }) {
	const [toasts, setToasts] = useState<Toast[]>([]);
	const [confirmState, setConfirmState] = useState<ConfirmOptions | null>(null);
	const proximoId = useRef(1);
	const resolver = useRef<((ok: boolean) => void) | null>(null);

	const remover = useCallback((id: number) => {
		setToasts(prev => prev.filter(t => t.id !== id));
	}, []);

	const push = useCallback((kind: ToastKind, message: ReactNode) => {
		const id = proximoId.current++;
		setToasts(prev => [...prev, { id, kind, message }]);
		setTimeout(() => remover(id), DURACAO[kind]);
	}, [remover]);

	const confirmar = useCallback((opts: ConfirmOptions) => {
		setConfirmState(opts);
		return new Promise<boolean>(resolve => { resolver.current = resolve; });
	}, []);

	const responder = useCallback((ok: boolean) => {
		setConfirmState(null);
		resolver.current?.(ok);
		resolver.current = null;
	}, []);

	const value = useMemo<Ctx>(() => ({
		sucesso: m => push('success', m),
		erro: m => push('danger', m),
		aviso: m => push('warning', m),
		confirmar,
	}), [push, confirmar]);

	return (
		<FeedbackContext.Provider value={value}>
			{children}

			<div
				className="toast-container position-fixed bottom-0 end-0 p-3"
				style={{ zIndex: 1090 }}
				aria-live="polite"
				aria-atomic="true"
			>
				{toasts.map(t => (
					<div key={t.id} className={`toast show align-items-center text-bg-${t.kind} border-0 mb-2`}>
						<div className="d-flex">
							<div className="toast-body d-flex align-items-center gap-2">
								<i className={`bi ${ICONE[t.kind]}`} aria-hidden="true" />
								<span>{t.message}</span>
							</div>
							<button
								type="button"
								className="btn-close btn-close-white me-2 m-auto"
								aria-label="Fechar"
								onClick={() => remover(t.id)}
							/>
						</div>
					</div>
				))}
			</div>

			{confirmState && (
				<ModalShell
					title={confirmState.title ?? 'Confirmar'}
					size="lg"
					onClose={() => responder(false)}
					footer={
						<>
							<button type="button" className="btn btn-secondary" onClick={() => responder(false)}>
								{confirmState.cancelLabel ?? 'Cancelar'}
							</button>
							<button
								type="button"
								className={`btn ${confirmState.danger ? 'btn-danger' : 'btn-primary'}`}
								onClick={() => responder(true)}
							>
								{confirmState.confirmLabel ?? 'Confirmar'}
							</button>
						</>
					}
				>
					{confirmState.message}
				</ModalShell>
			)}
		</FeedbackContext.Provider>
	);
}
