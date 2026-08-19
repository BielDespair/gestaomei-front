import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { StockEntryItemRequest } from '../../../api/stock/stock.types';
import type { Product } from '../../../api/products/products.types';
import { stockEntryQuery, useCreateStockEntry, useUpdateStockEntry } from '../../../api/stock/stock.queries';
import { ModalShell } from '../../../components/ModalShell';
import { useFeedback } from '../../../components/Feedback/FeedbackProvider';
import { formatMoney } from '../../../utils/format';

/** Linha do formulário: campos em texto, com uma chave estável para o React. */
interface ItemRow {
	key: string;
	id?: number;
	productId: string;
	quantity: string;
	unitCost: string;
}

export type ModalMode = 'view' | 'edit';

interface Props {
	/** null = nova entrada */
	entryId: number | null;
	mode?: ModalMode;
	products: Product[];
	onClose: () => void;
}

const today = () => new Date().toISOString().split('T')[0];

export function StockEntryFormModal({ entryId, mode = 'edit', products, onClose }: Props) {
	const [purchaseDate, setPurchaseDate] = useState(today());
	const [notes, setNotes] = useState('');
	const [rows, setRows] = useState<ItemRow[]>([]);
	const [isEditing, setIsEditing] = useState(mode === 'edit' || entryId === null);
	const [isSaving, setIsSaving] = useState(false);

	const nextKey = useRef(1);
	const { sucesso, erro } = useFeedback();
	const createEntry = useCreateStockEntry();
	const updateEntry = useUpdateStockEntry();

	const { data: entryDetail, isPending: isLoadingEntry, isError: isEntryError } = useQuery({
		...stockEntryQuery(entryId ?? -1),
		enabled: entryId !== null,
	});

	const newRow = (): ItemRow => ({
		key: String(nextKey.current++),
		productId: '',
		quantity: '',
		unitCost: '',
	});

	useEffect(() => {
		if (entryId === null) {
			setRows([newRow()]);
			return;
		}

		if (!entryDetail) return;

		setPurchaseDate(entryDetail.purchaseDate);
		setNotes(entryDetail.notes ?? '');
		setRows(entryDetail.items.map(item => ({
			key: String(nextKey.current++),
			id: item.id,
			productId: String(item.productId),
			quantity: String(item.quantity),
			unitCost: String(item.unitCost),
		})));
	}, [entryId, entryDetail]);

	function updateRow(key: string, field: keyof ItemRow, value: string) {
		setRows(prev => prev.map(r => (r.key === key ? { ...r, [field]: value } : r)));
	}

	function removeRow(key: string) {
		setRows(prev => (prev.length === 1 ? [newRow()] : prev.filter(r => r.key !== key)));
	}

	const subtotal = (row: ItemRow) =>
		(parseFloat(row.quantity) || 0) * (parseFloat(row.unitCost) || 0);

	const preenchidas = rows.filter(r => r.productId !== '');
	const total = preenchidas.reduce((acc, r) => acc + subtotal(r), 0);
	const unidades = preenchidas.reduce((acc, r) => acc + (parseFloat(r.quantity) || 0), 0);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();

		if (preenchidas.length === 0) {
			erro('Adicione pelo menos um item à entrada.');
			return;
		}

		const invalida = preenchidas.find(
			r => !(parseFloat(r.quantity) > 0) || !(parseFloat(r.unitCost) > 0)
		);
		if (invalida) {
			erro('Todo item precisa de quantidade e custo maiores que zero.');
			return;
		}

		const duplicado = preenchidas
			.map(r => r.productId)
			.find((id, i, arr) => arr.indexOf(id) !== i);
		if (duplicado) {
			const nome = products.find(p => String(p.id) === duplicado)?.name ?? 'produto';
			erro(`${nome} aparece em duas linhas. Junte na mesma linha.`);
			return;
		}

		const items: StockEntryItemRequest[] = preenchidas.map(r => ({
			...(r.id ? { id: r.id } : {}),
			productId: parseInt(r.productId, 10),
			quantity: parseFloat(r.quantity),
			unitCost: parseFloat(r.unitCost),
		}));

		setIsSaving(true);
		try {
			const payload = { purchaseDate, notes: notes || null, items };
			if (entryId !== null) {
				await updateEntry.mutateAsync({ id: entryId, data: payload });
				sucesso('Entrada atualizada.');
			} else {
				await createEntry.mutateAsync(payload);
				sucesso('Entrada registrada.');
			}
			onClose();
		} catch (err: any) {
			erro(err?.message || 'Não foi possível salvar a entrada.');
		} finally {
			setIsSaving(false);
		}
	}

	const isLoading = entryId !== null && (isLoadingEntry || !entryDetail);

	if (isLoading || isEntryError) {
		return (
			<ModalShell title="Entrada" size="xl" onClose={onClose}>
				{isEntryError ? (
					<div className="alert alert-danger mb-0">Não foi possível carregar a entrada.</div>
				) : (
					<div className="text-center text-muted py-5">
						<div className="spinner-border" role="status" aria-hidden="true" />
						<div className="mt-2">Carregando entrada…</div>
					</div>
				)}
			</ModalShell>
		);
	}

	return (
		<ModalShell
			title={entryId !== null ? `Entrada #${entryId}` : 'Nova entrada'}
			size="xl"
			onClose={onClose}
			onSubmit={handleSubmit}
			footer={isEditing ? (
				<>
					<button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
					<button type="submit" className="btn btn-primary" disabled={isSaving}>
						{isSaving ? 'Salvando…' : 'Salvar entrada'}
					</button>
				</>
			) : (
				<>
					<button type="button" className="btn btn-secondary" onClick={onClose}>Fechar</button>
					<button type="button" className="btn btn-primary" onClick={() => setIsEditing(true)}>
						<i className="bi bi-pencil me-1" aria-hidden="true" /> Editar
					</button>
				</>
			)}
		>
			<h6 className="text-primary mb-3">Dados da nota</h6>
			<div className="row g-3 mb-4">
				<div className="col-md-4">
					<label className="form-label">Data da compra</label>
					<input
						type="date"
						className="form-control"
						value={purchaseDate}
						max={today()}
						readOnly={!isEditing}
						onChange={e => setPurchaseDate(e.target.value)}
						required
					/>
				</div>
				<div className="col-md-8">
					<label className="form-label">Observações</label>
					<input
						className="form-control"
						placeholder={isEditing ? 'Nota 8842 — Torrefação Serra Azul' : '—'}
						value={notes}
						readOnly={!isEditing}
						onChange={e => setNotes(e.target.value)}
					/>
				</div>
			</div>

			<hr className="my-4" />

			<div className="d-flex justify-content-between align-items-center mb-3">
				<h6 className="text-primary mb-0">Itens</h6>
				{preenchidas.length > 0 && (
					<span className="badge bg-primary-subtle text-primary-emphasis rounded-pill">
						{preenchidas.length} {preenchidas.length === 1 ? 'produto' : 'produtos'}
					</span>
				)}
			</div>

			<div className="table-responsive">
				<table className="table table-sm align-middle mb-2">
					<thead>
						<tr className="text-secondary">
							<th className="fw-normal small">Produto</th>
							<th className="fw-normal small" style={{ width: '110px' }}>Qtd</th>
							<th className="fw-normal small" style={{ width: '140px' }}>Custo unit.</th>
							<th className="fw-normal small text-end" style={{ width: '130px' }}>Subtotal</th>
							{isEditing && <th style={{ width: '48px' }} />}
						</tr>
					</thead>
					<tbody>
						{rows.map(row => (
							<tr key={row.key}>
								{isEditing ? (
									<>
										<td>
											<select
												className="form-select"
												value={row.productId}
												onChange={e => updateRow(row.key, 'productId', e.target.value)}
											>
												<option value="">Selecione o produto</option>
												{products.map(p => (
													<option key={p.id} value={p.id}>{p.name}</option>
												))}
											</select>
										</td>
										<td>
											<input
												type="number"
												step="0.001"
												min="0"
												inputMode="decimal"
												className="form-control"
												value={row.quantity}
												onChange={e => updateRow(row.key, 'quantity', e.target.value)}
											/>
										</td>
										<td>
											<div className="input-group">
												<span className="input-group-text">R$</span>
												<input
													type="number"
													step="0.01"
													min="0"
													inputMode="decimal"
													className="form-control"
													value={row.unitCost}
													onChange={e => updateRow(row.key, 'unitCost', e.target.value)}
												/>
											</div>
										</td>
										<td className="text-end fw-medium">
											{row.productId ? formatMoney(subtotal(row)) : <span className="text-muted fw-normal">—</span>}
										</td>
										<td>
											<button
												type="button"
												className="btn btn-sm btn-outline-danger"
												aria-label="Remover item"
												onClick={() => removeRow(row.key)}
											>
												&times;
											</button>
										</td>
									</>
								) : (
									<>
										<td>{products.find(p => String(p.id) === row.productId)?.name ?? '—'}</td>
										<td>{row.quantity} un</td>
										<td className="text-muted">{formatMoney(parseFloat(row.unitCost) || 0)}</td>
										<td className="text-end fw-medium">{formatMoney(subtotal(row))}</td>
									</>
								)}
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{isEditing && (
				<button
					type="button"
					className="btn btn-sm btn-outline-primary mb-4"
					onClick={() => setRows(prev => [...prev, newRow()])}
				>
					+ Adicionar item
				</button>
			)}

			<div className="d-flex justify-content-between align-items-end gap-3 border rounded p-3 bg-light">
				<div>
					<small className="text-muted d-block">Total da nota</small>
					<span className="fs-3 fw-bold text-primary">{formatMoney(total)}</span>
				</div>
				<small className="text-muted text-end">
					{unidades} {unidades === 1 ? 'unidade' : 'unidades'}
				</small>
			</div>
		</ModalShell>
	);
}
