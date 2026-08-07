import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { ClientList } from '../../../types/api/Client';
import { clientService } from '../../../services/clientService';
import { useFeedback } from '../../../components/Feedback/FeedbackProvider';
import { formatMoney } from '../../../utils/format';
import { ActiveTab, type ModalMode } from './ClienteModal';
import { ClienteModalContainer } from './ClienteModalContainer';

type ClienteResumo = Pick<ClientList, 'id' | 'name' | 'totalDebt'>;

export interface AbrirOptions {
	tab?: ActiveTab;
	mode?: ModalMode;
	/** Chamado após salvar ou excluir — use para recarregar a lista da tela. */
	onChanged?: () => void;
}

interface Ctx {
	abrirCliente: (clientId: number, opts?: AbrirOptions) => void;
	novoCliente: (opts?: AbrirOptions) => void;
	excluirCliente: (client: ClienteResumo, opts?: AbrirOptions) => Promise<void>;
}

const ClienteModalContext = createContext<Ctx | null>(null);

export function useClienteModal() {
	const ctx = useContext(ClienteModalContext);
	if (!ctx) throw new Error('useClienteModal precisa estar dentro de <ClienteModalProvider>');
	return ctx;
}

interface State {
	clientId: number | null;
	tab: ActiveTab;
	mode: ModalMode;
	onChanged?: () => void;
}

export function ClienteModalProvider({ children }: { children: ReactNode }) {
	const [state, setState] = useState<State | null>(null);
	const { confirmar, sucesso, erro } = useFeedback();

	const abrirCliente = useCallback((clientId: number, opts: AbrirOptions = {}) => {
		setState({
			clientId,
			tab: opts.tab ?? ActiveTab.Details,
			mode: opts.mode ?? 'view',
			onChanged: opts.onChanged,
		});
	}, []);

	const novoCliente = useCallback((opts: AbrirOptions = {}) => {
		setState({ clientId: null, tab: ActiveTab.Details, mode: 'edit', onChanged: opts.onChanged });
	}, []);

	const excluirCliente = useCallback(async (client: ClienteResumo, opts: AbrirOptions = {}) => {
		const ok = await confirmar({
			title: 'Excluir cliente',
			confirmLabel: 'Excluir cliente',
			danger: true,
			message: (
				<>
					<p>
						Excluir <strong>{client.name}</strong>? Essa ação não pode ser desfeita.
					</p>
					{client.totalDebt > 0 && (
						<div className="alert alert-warning mb-0">
							Este cliente tem {formatMoney(client.totalDebt)} em aberto. O histórico de débitos
							será perdido junto com o cadastro.
						</div>
					)}
				</>
			),
		});
		if (!ok) return;

		try {
			await clientService.deleteClient(client.id);
			sucesso('Cliente excluído.');
			opts.onChanged?.();
		} catch (err: any) {
			erro(err?.message || 'Não foi possível excluir o cliente.');
		}
	}, [confirmar, sucesso, erro]);

	const value = useMemo(
		() => ({ abrirCliente, novoCliente, excluirCliente }),
		[abrirCliente, novoCliente, excluirCliente]
	);

	return (
		<ClienteModalContext.Provider value={value}>
			{children}
			{state && (
				<ClienteModalContainer
					clientId={state.clientId}
					tab={state.tab}
					mode={state.mode}
					onClose={() => setState(null)}
					onChanged={state.onChanged}
				/>
			)}
		</ClienteModalContext.Provider>
	);
}
