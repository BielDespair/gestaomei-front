import '../../styles/shared-tables.css';
import '../../assets/bootstrap-icons/bootstrap-icons.css'
import { useEffect, useState } from 'react';
import type { ClientList } from '../../types/api/Client';
import { clientService } from '../../services/clientService';
import { formatMoney, formatPhone, formatDocument } from '../../utils/format';
import { useClienteModal } from './modal/ClienteModalProvider';

export function Clientes() {
	const [clients, setClients] = useState<ClientList[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [errorMessage, setErrorMessage] = useState('');

	const { abrirCliente, novoCliente, excluirCliente } = useClienteModal();

	useEffect(() => { loadClients(); }, []);

	async function loadClients() {
		setIsLoading(true);
		try {
			const data = await clientService.getClients();
			if (!Array.isArray(data)) throw new Error('Resposta inválida da API');
			setClients(data);
		} catch {
			setErrorMessage('Não foi possível carregar os clientes.');
		} finally {
			setIsLoading(false);
		}
	}

	// Toda abertura recarrega a lista se algo mudou.
	const opts = { onChanged: loadClients };

	return (
		<div className="clientes-page">
			<div className="page-header">
				<h2 className="page-title">Cadastro de clientes</h2>
				<button className="btn btn-primary" onClick={() => novoCliente(opts)}>
					+ Novo cliente
				</button>
			</div>

			{errorMessage && (
				<div className="alert alert-danger d-flex justify-content-between align-items-center">
					<span>{errorMessage}</span>
					<button type="button" className="btn-close" onClick={() => setErrorMessage('')} />
				</div>
			)}

			{isLoading ? <p>Carregando clientes…</p> : (
				<div className="table-responsive">
					<table className="table table-striped table-hover">
						<thead>
							<tr>
								<th>Nome / contato</th>
								<th>CPF / CNPJ</th>
								<th>Bairro</th>
								<th>Observações</th>
								<th>Status</th>
								<th className="text-end">Ações</th>
							</tr>
						</thead>
						<tbody>
							{clients.map(client => (
								<tr key={client.id}>
									<td>
										<strong>{client.name}</strong>
										<br />
										<small className="text-muted">
											{client.phoneNumber ? formatPhone(client.phoneNumber) : 'Sem telefone'}
										</small>
									</td>
									<td>{formatDocument(client.document)}</td>
									<td>{client.district || '-'}</td>
									<td style={{ maxWidth: '250px' }}>
										<small className="fst-italic text-secondary">{client.description || '-'}</small>
									</td>
									<td>
										{client.totalDebt > 0 ? (
											<span className="text-danger fw-bold">
												Devendo {formatMoney(client.totalDebt)}
											</span>
										) : (
											<span className="badge bg-success">Em dia</span>
										)}
									</td>
									<td>
										<div className="d-flex gap-1 justify-content-end">
											<button
												type="button"
												className="btn btn-sm btn-secondary"
												title="Ver cliente"
												onClick={() => abrirCliente(client.id, opts)}
											>
												<i className="bi bi-eye" aria-hidden="true" />
												<span className="visually-hidden">Ver {client.name}</span>
											</button>

											<button
												type="button"
												className="btn btn-sm btn-warning"
												onClick={() => abrirCliente(client.id, { ...opts, mode: 'edit' })}
											>
												Editar
											</button>

											<button
												type="button"
												className="btn btn-sm btn-outline-danger"
												onClick={() => excluirCliente(client, opts)}
											>
												Excluir
											</button>
										</div>
									</td>
								</tr>
							))}

							{clients.length === 0 && (
								<tr>
									<td colSpan={6} className="text-center py-4">
										Nenhum cliente cadastrado ainda.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
