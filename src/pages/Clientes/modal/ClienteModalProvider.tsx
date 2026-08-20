import { useFeedback } from '../../../components/Feedback/FeedbackProvider';
import { formatMoney } from '../../../utils/format';
import { ClienteModalContainer } from './ClienteModalContainer';
import { useDeleteClient } from '../../../api/clients/clients.queries';

import type { ClientList } from '../../../api/clients/clients.types';
import { ActiveTab, type ModalMode } from './ClienteModal';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';


type ClienteResumo = Pick<ClientList, 'id' | 'name' | 'totalDebt'>;

export interface AbrirOptions {
	tab?: ActiveTab;
	mode?: ModalMode;
}

interface Ctx {
	abrirCliente: (clientId: number, opts?: AbrirOptions) => void;
	novoCliente: () => void;
	excluirCliente: (client: ClienteResumo) => Promise<void>;
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
	const deleteClient = useDeleteClient();

	const abrirCliente = useCallback((clientId: number, opts: AbrirOptions = {}) => {
		setState({
			clientId,
			tab: opts.tab ?? ActiveTab.Details,
			mode: opts.mode ?? 'view',
		});
	}, []);

	const novoCliente = useCallback(() => {
		setState({ clientId: null, tab: ActiveTab.Details, mode: 'edit'});
	}, []);

	const excluirCliente = useCallback(async (client: ClienteResumo) => {
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
			await deleteClient.mutateAsync(client.id);
			sucesso('Cliente excluído.');
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
					onClose={() => setState(null)}/>
			)}
		</ClienteModalContext.Provider>
	);
}
