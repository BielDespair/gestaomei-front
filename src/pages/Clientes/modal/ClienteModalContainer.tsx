import { useEffect, useState } from 'react';
import type { Client } from '../../../types/api/Client';
import { clientService } from '../../../services/clientService';
import { useFeedback } from '../../../components/Feedback/FeedbackProvider';
import { ModalShell } from '../../../components/ModalShell';
import ClienteModal, { ActiveTab, type ModalMode } from './ClienteModal';
import type { ClientFormData } from './useClientForm';

interface Props {
	/** null = novo cliente */
	clientId: number | null;
	tab: ActiveTab;
	mode: ModalMode;
	onClose: () => void;
	onChanged?: () => void;
}

export function ClienteModalContainer({ clientId, tab, mode, onClose, onChanged }: Props) {
	const [client, setClient] = useState<Client | null>(null);
	const [isLoading, setIsLoading] = useState(clientId !== null);
	const [loadError, setLoadError] = useState('');
	const { sucesso } = useFeedback();

	useEffect(() => {
		if (clientId === null) return;
		let cancelado = false;
		setIsLoading(true);
		clientService
			.getClient(clientId)
			.then(data => { if (!cancelado) setClient(data); })
			.catch(() => { if (!cancelado) setLoadError('Não foi possível carregar os dados do cliente.'); })
			.finally(() => { if (!cancelado) setIsLoading(false); });
		return () => { cancelado = true; };
	}, [clientId]);

	const handleSave = async (data: ClientFormData) => {
		if (clientId !== null) {
			await clientService.updateClient(clientId, data);
			sucesso('Cliente atualizado.');
		} else {
			await clientService.addClient(data);
			sucesso('Cliente cadastrado.');
		}
		onChanged?.();
	};

	/** Após um pagamento: rebusca o cliente e avisa a tela para atualizar o totalDebt. */
	const handleRefresh = async () => {
		if (clientId === null) return;
		try {
			setClient(await clientService.getClient(clientId));
			onChanged?.();
		} catch {
			setLoadError('Não foi possível atualizar os dados do cliente.');
		}
	};

	if (isLoading || loadError) {
		return (
			<ModalShell
				title="Cliente"
				size="xl"
				onClose={onClose}
				footer={<button type="button" className="btn btn-secondary" onClick={onClose}>Fechar</button>}
			>
				{loadError ? (
					<div className="alert alert-danger mb-0">{loadError}</div>
				) : (
					<div className="text-center text-muted py-5">
						<div className="spinner-border" role="status" aria-hidden="true" />
						<div className="mt-2">Carregando cliente…</div>
					</div>
				)}
			</ModalShell>
		);
	}

	return (
		<ClienteModal
			client={client}
			tab={tab}
			mode={mode}
			onClose={onClose}
			onSave={handleSave}
			onRefresh={handleRefresh}
		/>
	);
}
