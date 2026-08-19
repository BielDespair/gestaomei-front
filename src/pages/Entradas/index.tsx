import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { stockEntriesQuery, useDeleteStockEntry } from '../../api/stock/stock.queries';
import { productsQuery } from '../../api/products/products.queries';
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

			{isPending ? <p>Carregando histórico…</p> : (
				<div className="table-responsive">
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
									<td style={{ maxWidth: '260px' }}>
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

							{entries?.length === 0 && (
								<tr>
									<td colSpan={7} className="text-center py-4">Nenhuma entrada registrada.</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
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
