import '../../styles/shared-tables.css';
import '../../assets/bootstrap-icons/bootstrap-icons.css'

import { formatMoney, formatPhone, formatDocument } from '../../utils/format';
import { useClienteModal } from './modal/ClienteModalProvider';
import { useQuery } from '@tanstack/react-query';
import { clientsQuery } from '../../api/clients/clients.queries';

export function Clientes() {

	const { data: clients, isPending, isError } = useQuery(clientsQuery());

	const { abrirCliente, novoCliente, excluirCliente } = useClienteModal();

	return (
		<div className="clientes-page">
			<div className="page-header">
				<h2 className="page-title">Cadastro de clientes</h2>
				<button className="btn btn-primary" onClick={() => novoCliente()}>
					+ Novo cliente
				</button>
			</div>

			{isError && (<div className="alert alert-danger"> Não foi possível carregar os clientes. </div>)}

			{isPending  ? <p>Carregando clientes…</p> : (
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
							{clients?.map(client => (
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
												onClick={() => abrirCliente(client.id)}
											>
												<i className="bi bi-eye" aria-hidden="true" />
												<span className="visually-hidden">Ver {client.name}</span>
											</button>

											<button
												type="button"
												className="btn btn-sm btn-warning"
												onClick={() => abrirCliente(client.id, { mode: 'edit' })}
											>
												Editar
											</button>

											<button
												type="button"
												className="btn btn-sm btn-outline-danger"
												onClick={() => excluirCliente(client)}
											>
												Excluir
											</button>
										</div>
									</td>
								</tr>
							))}

							{clients?.length === 0 && (
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
