import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ClientList } from '../../../api/clients/clients.types';
import { clientsQuery, useAddClient } from '../../../api/clients/clients.queries';
import { useDebounce } from '../../../hooks/useDebounce';
import { LoadingState } from '../../../components/LoadingState';
import { ModalShell } from '../../../components/ModalShell';
import { useFeedback } from '../../../components/Feedback/FeedbackProvider';
import { formatDocument, formatPhone, maskDocument, maskPhone, onlyDigits } from '../../../utils/format';

interface Props {
	onClose: () => void;
	onSelect: (client: ClientList) => void;
}

export function SelecionarClienteModal({ onClose, onSelect }: Props) {
	const [modo, setModo] = useState<'busca' | 'cadastro'>('busca');

	return modo === 'busca' ? (
		<Busca
			onClose={onClose}
			onSelect={onSelect}
			onCadastrar={() => setModo('cadastro')}
		/>
	) : (
		<CadastroRapido
			onClose={onClose}
			onVoltar={() => setModo('busca')}
			onSelect={onSelect}
		/>
	);
}

function Busca({
	onClose, onSelect, onCadastrar,
}: {
	onClose: () => void;
	onSelect: (c: ClientList) => void;
	onCadastrar: () => void;
}) {
	const [busca, setBusca] = useState('');
	const termo = useDebounce(busca);

	// Sem número de página aqui: é uma busca rápida pra vincular à venda, não uma listagem completa.
	const { data, isPending, isError } = useQuery(
		clientsQuery({ search: termo || undefined, pageSize: 30 })
	);
	const clientes = data?.items ?? [];

	return (
		<ModalShell
			title="Buscar cliente"
			centered
			maxWidth="min(1100px, 92vw)"
			bodyMaxHeight="80vh"
			onClose={onClose}
			footer={
				<button
					type="button"
					className="btn btn-outline-primary w-100 py-3 fs-5 fw-bold"
					onClick={onCadastrar}
				>
					+ Cadastrar novo cliente
				</button>
			}
		>
			<input
				type="text"
				className="form-control form-control-lg mb-4 rounded-3"
				placeholder="Nome ou documento…"
				autoComplete="off"
				value={busca}
				onChange={e => setBusca(e.target.value)}
				autoFocus
			/>

			{isError ? (
				<div className="alert alert-danger">Não foi possível buscar os clientes.</div>
			) : isPending ? (
				<LoadingState />
			) : clientes.length === 0 ? (
				<div className="text-center text-muted py-4">Nenhum cliente encontrado.</div>
			) : (
				<div className="list-group">
					{clientes.map(client => (
						<button
							type="button"
							key={client.id}
							className="list-group-item list-group-item-action p-3"
							onClick={() => onSelect(client)}
						>
							<div className="d-flex justify-content-between align-items-center gap-3">
								<span className="fs-5 fw-bold text-truncate">{client.name}</span>
								{client.district && (
									<span className="text-nowrap text-muted small">{client.district}</span>
								)}
							</div>
							<div className="text-muted mt-2">
								{client.document ? `${formatDocument(client.document)} · ` : ''}
								{client.phoneNumber ? formatPhone(client.phoneNumber) : 'Sem telefone'}
							</div>
							{client.description && (
								<div className="text-primary mt-2 fst-italic">{client.description}</div>
							)}
							{client.totalDebt > 0 && (
								<span className="badge bg-danger mt-2">Cliente com débito em aberto</span>
							)}
						</button>
					))}
				</div>
			)}
		</ModalShell>
	);
}

function CadastroRapido({
	onClose, onVoltar, onSelect,
}: {
	onClose: () => void;
	onVoltar: () => void;
	onSelect: (c: ClientList) => void;
}) {
	const [name, setName] = useState('');
	const [district, setDistrict] = useState('');
	const [description, setDescription] = useState('');
	const [phoneNumber, setPhoneNumber] = useState('');
	const [document, setDocument] = useState('');
	const [isSaving, setIsSaving] = useState(false);
	const { sucesso, erro } = useFeedback();
	const addClient = useAddClient();

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setIsSaving(true);
		try {
			const id = await addClient.mutateAsync({
				name, district, description, phoneNumber, document,
				email: '', pix: '', cep: '', street: '', complement: '', number: '', city: '', state: '',
			});
			// POST só devolve o id; cliente recém-criado não tem dívida, então dá pra montar o ClientList aqui mesmo.
			onSelect({ id, name, district, description, phoneNumber, document, totalDebt: 0 });
			sucesso('Cliente cadastrado.');
			onClose();
		} catch (err: any) {
			erro(err?.message || 'Não foi possível cadastrar o cliente.');
		} finally {
			setIsSaving(false);
		}
	}

	return (
		<ModalShell
			title="Cadastro rápido"
			centered
			maxWidth="min(1100px, 92vw)"
			bodyMaxHeight="80vh"
			onClose={onClose}
			onSubmit={handleSubmit}
			footer={
				<>
					<button type="button" className="btn btn-secondary py-3 px-4 fs-5" onClick={onVoltar}>
						Voltar
					</button>
					<button type="submit" className="btn btn-primary py-3 px-4 fs-5" disabled={isSaving || !name.trim()}>
						{isSaving ? 'Salvando…' : 'Salvar cliente'}
					</button>
				</>
			}
		>
			<div className="mb-4">
				<label className="form-label fs-5">Nome completo *</label>
				<input
					className="form-control form-control-lg"
					autoComplete="off"
					value={name}
					onChange={e => setName(e.target.value)}
					required
					autoFocus
				/>
			</div>
			<div className="mb-4">
				<label className="form-label fs-5">Bairro</label>
				<input
					className="form-control form-control-lg"
					autoComplete="off"
					value={district}
					onChange={e => setDistrict(e.target.value)}
				/>
			</div>
			<div className="mb-4">
				<label className="form-label fs-5">Observação</label>
				<input
					className="form-control form-control-lg"
					placeholder="Filho do seu Zé, deixar na portaria…"
					autoComplete="off"
					value={description}
					onChange={e => setDescription(e.target.value)}
				/>
			</div>
			<div className="mb-4">
				<label className="form-label fs-5">Telefone</label>
				<input
					className="form-control form-control-lg"
					inputMode="numeric"
					autoComplete="off"
					value={maskPhone(phoneNumber)}
					onChange={e => setPhoneNumber(onlyDigits(e.target.value))}
				/>
			</div>
			<div className="mb-4">
				<label className="form-label fs-5">CPF / CNPJ</label>
				<input
					className="form-control form-control-lg"
					inputMode="numeric"
					autoComplete="off"
					value={maskDocument(document)}
					onChange={e => setDocument(onlyDigits(e.target.value))}
				/>
			</div>
		</ModalShell>
	);
}
