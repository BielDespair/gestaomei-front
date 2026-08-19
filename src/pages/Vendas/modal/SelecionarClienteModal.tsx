import { useMemo, useState, type FormEvent } from 'react';
import type { ClientList } from '../../../api/clients/clients.types';
import { ModalShell } from '../../../components/ModalShell';
import { useFeedback } from '../../../components/Feedback/FeedbackProvider';
import { formatDocument, formatPhone, maskDocument, maskPhone, onlyDigits } from '../../../utils/format';

interface Props {
	clients: ClientList[];
	onClose: () => void;
	onSelect: (client: ClientList) => void;
	/** Avisa a tela para recarregar a lista após cadastro rápido. */
	onCreated?: () => void;
}

export function SelecionarClienteModal({ clients, onClose, onSelect, onCreated }: Props) {
	const [modo, setModo] = useState<'busca' | 'cadastro'>('busca');

	return modo === 'busca' ? (
		<Busca
			clients={clients}
			onClose={onClose}
			onSelect={onSelect}
			onCadastrar={() => setModo('cadastro')}
		/>
	) : (
		<CadastroRapido
			onClose={onClose}
			onVoltar={() => setModo('busca')}
			onSelect={onSelect}
			onCreated={onCreated}
		/>
	);
}

function Busca({
	clients, onClose, onSelect, onCadastrar,
}: {
	clients: ClientList[];
	onClose: () => void;
	onSelect: (c: ClientList) => void;
	onCadastrar: () => void;
}) {
	const [busca, setBusca] = useState('');

	const filtrados = useMemo(() => {
		const termo = busca.trim().toLowerCase();
		if (!termo) return clients;
		const digitos = onlyDigits(termo);
		return clients.filter(c =>
			c.name.toLowerCase().includes(termo) ||
			(digitos && c.document?.includes(digitos))
		);
	}, [clients, busca]);

	return (
		<ModalShell
			title="Buscar cliente"
			centered
			maxWidth="700px"
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
				value={busca}
				onChange={e => setBusca(e.target.value)}
				autoFocus
			/>

			{filtrados.length === 0 ? (
				<div className="text-center text-muted py-4">Nenhum cliente encontrado.</div>
			) : (
				<div className="list-group">
					{filtrados.map(client => (
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
	onClose, onVoltar, onSelect, onCreated,
}: {
	onClose: () => void;
	onVoltar: () => void;
	onSelect: (c: ClientList) => void;
	onCreated?: () => void;
}) {
	const [name, setName] = useState('');
	const [district, setDistrict] = useState('');
	const [description, setDescription] = useState('');
	const [phoneNumber, setPhoneNumber] = useState('');
	const [document, setDocument] = useState('');
	const [isSaving, setIsSaving] = useState(false);
	const { sucesso, erro } = useFeedback();

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setIsSaving(true);
		try {
			const novo = await clientService.addClient({
				name, district, description, phoneNumber, document,
				email: '', pix: '', cep: '', street: '', complement: '', number: '', city: '', state: '',
			});
			// Cliente recém-criado não tem dívida: dá para montar o ClientList aqui.
			onSelect({ ...novo, totalDebt: 0 });
			onCreated?.();
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
			maxWidth="700px"
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
					value={district}
					onChange={e => setDistrict(e.target.value)}
				/>
			</div>
			<div className="mb-4">
				<label className="form-label fs-5">Observação</label>
				<input
					className="form-control form-control-lg"
					placeholder="Filho do seu Zé, deixar na portaria…"
					value={description}
					onChange={e => setDescription(e.target.value)}
				/>
			</div>
			<div className="mb-4">
				<label className="form-label fs-5">Telefone</label>
				<input
					className="form-control form-control-lg"
					inputMode="numeric"
					value={maskPhone(phoneNumber)}
					onChange={e => setPhoneNumber(onlyDigits(e.target.value))}
				/>
			</div>
			<div className="mb-4">
				<label className="form-label fs-5">CPF / CNPJ</label>
				<input
					className="form-control form-control-lg"
					inputMode="numeric"
					value={maskDocument(document)}
					onChange={e => setDocument(onlyDigits(e.target.value))}
				/>
			</div>
		</ModalShell>
	);
}
