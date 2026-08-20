import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { StockEntryItemRequest } from '../../../api/stock/stock.types';
import type { Product } from '../../../api/products/products.types';
import { stockEntryQuery, useCreateStockEntry, useUpdateStockEntry } from '../../../api/stock/stock.queries';
import { ModalShell } from '../../../components/ModalShell';
import { LoadingState } from '../../../components/LoadingState';
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
					<LoadingState label="Carregando entrada…" />
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
						autoComplete="off"
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
						autoComplete="off"
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

			<div className="table-responsive d-none d-lg-block">
				<table className="table table-sm align-middle mb-2 entrada-itens-table">
					<thead>
						<tr className="text-secondary">
							<th className="fw-normal small entrada-th-produto">Produto</th>
							<th className="fw-normal small entrada-th-qtd">Qtd</th>
							<th className="fw-normal small entrada-th-custo">Custo unit.</th>
							<th className="fw-normal small text-end entrada-th-subtotal">Subtotal</th>
							{isEditing && <th className="entrada-th-acao" />}
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
												autoComplete="off"
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
													autoComplete="off"
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
												className="btn btn-danger rounded-circle btn-remove btn-sm"
												aria-label="Remover item"
												onClick={() => removeRow(row.key)}
											>
												<i className="bi bi-x-lg" aria-hidden="true" />
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

			<div className="d-flex flex-column gap-2 mb-2 d-lg-none">
				{rows.map(row => (
					<div className="list-card" key={row.key}>
						{isEditing ? (
							<>
								<div className="mb-2">
									<label className="form-label small text-muted mb-1">Produto</label>
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
								</div>
								<div className="row g-2">
									<div className="col-6">
										<label className="form-label small text-muted mb-1">Qtd</label>
										<input
											type="number"
											step="0.001"
											min="0"
											inputMode="decimal"
											autoComplete="off"
											className="form-control"
											value={row.quantity}
											onChange={e => updateRow(row.key, 'quantity', e.target.value)}
										/>
									</div>
									<div className="col-6">
										<label className="form-label small text-muted mb-1">Custo unit.</label>
										<div className="position-relative">
											<span className="input-rs-prefix" aria-hidden="true">R$</span>
											<input
												type="number"
												step="0.01"
												min="0"
												inputMode="decimal"
												autoComplete="off"
												className="form-control input-com-prefixo-rs"
												value={row.unitCost}
												onChange={e => updateRow(row.key, 'unitCost', e.target.value)}
											/>
										</div>
									</div>
								</div>
								<div className="entrada-item-card-footer">
									<span className="fw-medium me-auto">
										{row.productId ? formatMoney(subtotal(row)) : <span className="text-muted fw-normal">—</span>}
									</span>
									<button
										type="button"
										className="btn btn-danger rounded-circle btn-remove btn-sm"
										aria-label="Remover item"
										onClick={() => removeRow(row.key)}
									>
										<i className="bi bi-x-lg" aria-hidden="true" />
									</button>
								</div>
							</>
						) : (
							<>
								<div className="list-card-title mb-1">
									{products.find(p => String(p.id) === row.productId)?.name ?? '—'}
								</div>
								<div className="list-card-row">
									<span className="list-card-label">
										{row.quantity} un × {formatMoney(parseFloat(row.unitCost) || 0)}
									</span>
									<span className="list-card-value fw-medium">{formatMoney(subtotal(row))}</span>
								</div>
							</>
						)}
					</div>
				))}
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
