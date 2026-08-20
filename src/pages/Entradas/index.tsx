import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { stockEntriesQuery, useDeleteStockEntry } from '../../api/stock/stock.queries';
import { productsQuery } from '../../api/products/products.queries';
import { LoadingState } from '../../components/LoadingState';
import { useFeedback } from '../../components/Feedback/FeedbackProvider';
import { formatMoney, formatDate } from '../../utils/format';
import type { StockEntryList } from '../../api/stock/stock.types';
import { StockEntryFormModal, type ModalMode } from './modal/StockEntryFormModal';
import '../../styles/shared-tables.css';

export function Entradas() {
	const { data: entries, isPending, isError } = useQuery(stockEntriesQuery());
	const { data: products } = useQuery(productsQuery());
	const deleteEntry = useDeleteStockEntry();
	const [deletingId, setDeletingId] = useState<number | null>(null);

	// null = fechado | { entryId: null } = nova | { entryId } = ver/editar
	const [modal, setModal] = useState<{ entryId: number | null; mode: ModalMode } | null>(null);

	const { sucesso, erro, confirmar } = useFeedback();

	// Mais recente primeiro; desempata pelo id, que é crescente.
	const ordenadas = useMemo(
		() => [...(entries ?? [])].sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate) || b.id - a.id),
		[entries]
	);

	async function handleDelete(entry: StockEntryList) {
		const ok = await confirmar({
			title: 'Excluir entrada',
			confirmLabel: 'Excluir entrada',
			danger: true,
			message: (
				<>
					<p>
						Apagar a entrada de {formatDate(entry.purchaseDate)} com{' '}
						<strong>{entry.itemCount} {entry.itemCount === 1 ? 'item' : 'itens'}</strong>?
					</p>
					<div className="alert alert-warning mb-0">
						Os lotes desta nota saem do estoque e o custo das vendas que os consumiram
						será recalculado.
					</div>
				</>
			),
		});
		if (!ok) return;

		setDeletingId(entry.id);
		try {
			await deleteEntry.mutateAsync(entry.id);
			sucesso('Entrada excluída.');
		} catch (err: any) {
			erro(err?.message || 'Não foi possível apagar essa entrada.');
		} finally {
			setDeletingId(null);
		}
	}

	return (
		<div>
			<div className="page-header">
				<h2 className="page-title">Histórico de entradas</h2>
				<button className="btn btn-primary" onClick={() => setModal({ entryId: null, mode: 'edit' })}>
					+ Registrar entrada
				</button>
			</div>

			{isError && (
				<div className="alert alert-danger">Não foi possível carregar o histórico de entradas.</div>
			)}

			{isPending ? <LoadingState label="Carregando histórico…" /> : entries?.length === 0 ? (
				<div className="table-responsive">
					<div className="text-center py-4 text-muted">Nenhuma entrada registrada.</div>
				</div>
			) : (
				<>
					<div className="table-responsive d-none d-lg-block">
						<table className="table table-striped table-hover">
							<thead>
								<tr>
									<th>Data</th>
									<th>Observações</th>
									<th>Itens</th>
									<th className="text-end">Qtd. total</th>
									<th className="text-end">Custo total</th>
									<th>Registrado por</th>
									<th className="text-end">Ações</th>
								</tr>
							</thead>
							<tbody>
								{ordenadas.map(entry => (
									<tr key={entry.id}>
										<td>
											<strong>{formatDate(entry.purchaseDate)}</strong>
											<div className="text-muted small">{entry.id}</div>
										</td>
										<td className="entradas-obs-cell">
											<small className="text-secondary">{entry.notes || '—'}</small>
										</td>
										<td>
											{entry.itemCount} {entry.itemCount === 1 ? 'produto' : 'produtos'}
										</td>
										<td className="text-end">{entry.totalQuantity} un</td>
										<td className="text-end text-danger fw-medium">
											{formatMoney(entry.totalCost)}
										</td>
										<td><small className="text-muted">{entry.userName}</small></td>
										<td>
											<div className="d-flex gap-1 justify-content-end">
												<button
													type="button"
													className="btn btn-sm btn-secondary"
													title="Ver entrada"
													onClick={() => setModal({ entryId: entry.id, mode: 'view' })}
												>
													<i className="bi bi-eye" aria-hidden="true" />
													<span className="visually-hidden">Ver entrada #{entry.id}</span>
												</button>

												<button
													type="button"
													className="btn btn-sm btn-warning"
													onClick={() => setModal({ entryId: entry.id, mode: 'edit' })}
												>
													Editar
												</button>
												<button
													type="button"
													className="btn btn-sm btn-outline-danger"
													disabled={deletingId === entry.id}
													onClick={() => handleDelete(entry)}
												>
													{deletingId === entry.id ? 'Apagando…' : 'Excluir'}
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					<div className="row row-cols-1 row-cols-md-2 g-3 d-lg-none">
						{ordenadas.map(entry => (
							<div className="col" key={entry.id}>
								<div className="list-card">
									<div className="list-card-header">
										<div>
											<div className="list-card-title">{formatDate(entry.purchaseDate)}</div>
											<small className="text-muted">#{entry.id}</small>
										</div>
										<span className="text-danger fw-medium text-nowrap">
											{formatMoney(entry.totalCost)}
										</span>
									</div>
									<div className="list-card-body">
										<div className="list-card-row">
											<span className="list-card-label">Itens</span>
											<span className="list-card-value">
												{entry.itemCount} {entry.itemCount === 1 ? 'produto' : 'produtos'}
												{' · '}{entry.totalQuantity} un
											</span>
										</div>
										<div className="list-card-row">
											<span className="list-card-label">Registrado por</span>
											<span className="list-card-value">{entry.userName}</span>
										</div>
										{entry.notes && (
											<div className="list-card-row">
												<span className="list-card-label">Obs.</span>
												<span className="list-card-value text-secondary">{entry.notes}</span>
											</div>
										)}
									</div>
									<div className="list-card-actions">
										<button
											type="button"
											className="btn btn-sm btn-secondary"
											onClick={() => setModal({ entryId: entry.id, mode: 'view' })}
										>
											<i className="bi bi-eye me-1" aria-hidden="true" />Ver
										</button>
										<button
											type="button"
											className="btn btn-sm btn-warning"
											onClick={() => setModal({ entryId: entry.id, mode: 'edit' })}
										>
											Editar
										</button>
										<button
											type="button"
											className="btn btn-sm btn-outline-danger"
											disabled={deletingId === entry.id}
											onClick={() => handleDelete(entry)}
										>
											{deletingId === entry.id ? 'Apagando…' : 'Excluir'}
										</button>
									</div>
								</div>
							</div>
						))}
					</div>
				</>
			)}

			{modal && (
				<StockEntryFormModal
					entryId={modal.entryId}
					mode={modal.mode}
					products={products ?? []}
					onClose={() => setModal(null)}
				/>
			)}
		</div>
	);
}
