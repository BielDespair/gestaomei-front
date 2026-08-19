import { useFeedback } from '../../../components/Feedback/FeedbackProvider';
import { ModalShell } from '../../../components/ModalShell';
import ClienteModal, { ActiveTab, type ModalMode } from './ClienteModal';
import type { ClientFormData } from './useClientForm';
import { clientQuery, useAddClient, useUpdateClient } from '../../../api/clients/clients.queries';
import { useQuery } from '@tanstack/react-query';

interface Props {
	/** null = novo cliente */
	clientId: number | null;
	tab: ActiveTab;
	mode: ModalMode;
	onClose: () => void;
}

export function ClienteModalContainer({ clientId, tab, mode, onClose }: Props) {
	const { sucesso } = useFeedback();
	const addClient = useAddClient();
	const updateClient = useUpdateClient();
	const { data: client, isPending, isError } = useQuery({
		...clientQuery(clientId!),
		enabled: clientId !== null,
	});


	const handleSave = async (data: ClientFormData) => {
		if (clientId !== null) {
			await updateClient.mutateAsync({ id: clientId, data });
			sucesso('Cliente atualizado.');
		} else {
			await addClient.mutateAsync(data);
			sucesso('Cliente cadastrado.');
		}
	};

	const isLoading = clientId !== null && isPending;


	if (isLoading || isError) {
		return (
			<ModalShell
				title="Cliente"
				size="xl"
				onClose={onClose}
				footer={<button type="button" className="btn btn-secondary" onClick={onClose}>Fechar</button>}
			>
				{isError ? (
					<div className="alert alert-danger mb-0">Não foi possível carregar os dados do cliente.</div>
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
			client={client ?? null}
			tab={tab}
			mode={mode}
			onClose={onClose}
			onSave={handleSave}
		/>
	);
}
