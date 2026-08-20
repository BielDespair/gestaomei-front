import '../../styles/shared-tables.css';
import '../../assets/bootstrap-icons/bootstrap-icons.css'

import { useState } from 'react';
import { formatMoney, formatPhone, formatDocument } from '../../utils/format';
import { useClienteModal } from './modal/ClienteModalProvider';
import { useQuery } from '@tanstack/react-query';
import { clientsQuery } from '../../api/clients/clients.queries';
import type { ClientSortBy } from '../../api/clients/clients.types';
import { useDebounce } from '../../hooks/useDebounce';
import { LoadingState } from '../../components/LoadingState';
import { DEFAULT_PAGE_SIZE } from '../../constants/pagination';

const SORT_COLUMNS: { value: ClientSortBy; label: string }[] = [
	{ value: 'name', label: 'Nome / contato' },
	{ value: 'document', label: 'CPF / CNPJ' },
	{ value: 'district', label: 'Bairro' },
];

export function Clientes() {
	const [searchInput, setSearchInput] = useState('');
	const [page, setPage] = useState(1);
	const [sortBy, setSortBy] = useState<ClientSortBy>('name');
	const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

	const search = useDebounce(searchInput);

	const { data, isPending, isError } = useQuery(
		clientsQuery({ search: search || undefined, page, pageSize: DEFAULT_PAGE_SIZE, sortBy, sortDirection })
	);

	const clients = data?.items ?? [];
	const totalItems = data?.totalItems ?? 0;
	const totalPages = Math.max(1, Math.ceil(totalItems / DEFAULT_PAGE_SIZE));

	const { abrirCliente, novoCliente, excluirCliente } = useClienteModal();

	function handleSearchChange(value: string) {
		setSearchInput(value);
		setPage(1);
	}

	function handleSort(column: ClientSortBy) {
		if (sortBy === column) {
			setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
		} else {
			setSortBy(column);
			setSortDirection('asc');
		}
		setPage(1);
	}

	function SortIcon({ column }: { column: ClientSortBy }) {
		if (sortBy !== column) return <i className="bi bi-arrow-down-up text-muted ms-1 small" aria-hidden="true" />;
		return (
			<i
				className={`bi ${sortDirection === 'asc' ? 'bi-caret-up-fill' : 'bi-caret-down-fill'} ms-1 small`}
				aria-hidden="true"
			/>
		);
	}

	return (
		<div className="clientes-page">
			<div className="page-header">
				<h2 className="page-title">Cadastro de clientes</h2>
				<button className="btn btn-primary" onClick={() => novoCliente()}>
					+ Novo cliente
				</button>
			</div>

			<div className="input-group mb-3 clientes-search">
				<span className="input-group-text"><i className="bi bi-search" aria-hidden="true" /></span>
				<input
					type="text"
					className="form-control"
					placeholder="Buscar por nome, documento ou bairro…"
					autoComplete="off"
					value={searchInput}
					onChange={e => handleSearchChange(e.target.value)}
				/>
			</div>

			{isError && (<div className="alert alert-danger"> Não foi possível carregar os clientes. </div>)}

			{isPending ? <LoadingState label="Carregando clientes…" /> : (
				<>
					{clients.length === 0 ? (
						<div className="table-responsive">
							<div className="text-center py-4 text-muted">
								{search ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado ainda.'}
							</div>
						</div>
					) : (
						<>
							<div className="table-responsive d-none d-lg-block">
								<table className="table table-striped table-hover">
									<thead>
										<tr>
											{SORT_COLUMNS.map(col => (
												<th
													key={col.value}
													role="button"
													className="user-select-none"
													onClick={() => handleSort(col.value)}
												>
													{col.label}
													<SortIcon column={col.value} />
												</th>
											))}
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
												<td className="clientes-obs-cell">
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
									</tbody>
								</table>
							</div>

							<div className="row row-cols-1 row-cols-md-2 g-3 d-lg-none">
								{clients.map(client => (
									<div className="col" key={client.id}>
										<div className="list-card">
											<div className="list-card-header">
												<div>
													<div className="list-card-title">{client.name}</div>
													<small className="text-muted">
														{client.phoneNumber ? formatPhone(client.phoneNumber) : 'Sem telefone'}
													</small>
												</div>
												{client.totalDebt > 0 ? (
													<span className="text-danger fw-bold text-nowrap">
														Devendo {formatMoney(client.totalDebt)}
													</span>
												) : (
													<span className="badge bg-success">Em dia</span>
												)}
											</div>
											<div className="list-card-body">
												<div className="list-card-row">
													<span className="list-card-label">CPF / CNPJ</span>
													<span className="list-card-value">{formatDocument(client.document)}</span>
												</div>
												<div className="list-card-row">
													<span className="list-card-label">Bairro</span>
													<span className="list-card-value">{client.district || '-'}</span>
												</div>
												{client.description && (
													<div className="list-card-row">
														<span className="list-card-label">Obs.</span>
														<span className="list-card-value fst-italic text-secondary">
															{client.description}
														</span>
													</div>
												)}
											</div>
											<div className="list-card-actions">
												<button
													type="button"
													className="btn btn-sm btn-secondary"
													onClick={() => abrirCliente(client.id)}
												>
													<i className="bi bi-eye me-1" aria-hidden="true" />Ver
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
										</div>
									</div>
								))}
							</div>
						</>
					)}

					{totalItems > 0 && (
						<div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-3">
							<small className="text-muted">
								{totalItems} {totalItems === 1 ? 'cliente' : 'clientes'}
							</small>
							<div className="d-flex align-items-center gap-2">
								<button
									type="button"
									className="btn btn-sm btn-outline-secondary rounded-circle d-inline-flex align-items-center justify-content-center p-0 pager-btn"
									disabled={page <= 1}
									aria-label="Página anterior"
									onClick={() => setPage(p => Math.max(1, p - 1))}
								>
									<i className="bi bi-chevron-left" aria-hidden="true" />
								</button>
								<small className="text-muted text-nowrap">Página {page} de {totalPages}</small>
								<button
									type="button"
									className="btn btn-sm btn-outline-secondary rounded-circle d-inline-flex align-items-center justify-content-center p-0 pager-btn"
									disabled={page >= totalPages}
									aria-label="Próxima página"
									onClick={() => setPage(p => Math.min(totalPages, p + 1))}
								>
									<i className="bi bi-chevron-right" aria-hidden="true" />
								</button>
							</div>
						</div>
					)}
				</>
			)}
		</div>
	);
}
