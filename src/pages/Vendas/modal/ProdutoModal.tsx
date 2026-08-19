import { useState, type FormEvent } from 'react';
import type { Product } from '../../../api/products/products.types';
import { ModalShell } from '../../../components/ModalShell';
import { useFeedback } from '../../../components/Feedback/FeedbackProvider';
import { formatMoney } from '../../../utils/format';

interface Props {
	product: Product;
	onClose: () => void;
	onConfirm: (quantity: number, unitPrice: number) => void;
}

export function ProdutoModal({ product, onClose, onConfirm }: Props) {
	const [price, setPrice] = useState(String(product.sellPrice));
	const [qty, setQty] = useState(1);
	const { erro } = useFeedback();

	const parsed = parseFloat(price);
	const valido = !isNaN(parsed) && parsed >= 0;

	function handleSubmit(e: FormEvent) {
		e.preventDefault();
		if (!valido) {
			erro('Preço inválido.');
			return;
		}
		onConfirm(qty, parsed);
		onClose();
	}

	return (
		<ModalShell
			title={
				<span className="d-flex align-items-center gap-3">
					{product.imageUrl
						? <img src={product.imageUrl} alt="" className="produto-modal-thumb" />
						: <span className="produto-modal-thumb produto-modal-thumb-placeholder">☕</span>}
					<span className="fw-bold">{product.name}</span>
				</span>
			}
			centered
			maxWidth="450px"
			onClose={onClose}
			onSubmit={handleSubmit}
			footer={
				<button type="submit" className="btn btn-primary w-100 py-3 fs-4 fw-bold rounded-3">
					Adicionar {formatMoney((parsed || 0) * qty)}
				</button>
			}
		>
			<div className="d-flex flex-column gap-4 py-2">
				<div className="text-center">
					<label className="form-label text-muted fs-5">Preço unitário (R$)</label>
					<input
						type="number"
						step="0.01"
						inputMode="decimal"
						className="form-control form-control-lg text-center fw-bold input-giant border-primary border-3 rounded-3"
						value={price}
						onChange={e => setPrice(e.target.value)}
						required
						autoFocus
					/>
				</div>

				<div className="text-center">
					<label className="form-label text-muted fs-5">Quantidade</label>
					<div className="d-flex align-items-center justify-content-center gap-4">
						<button
							type="button"
							className="btn btn-light rounded-circle btn-qty"
							aria-label="Diminuir"
							onClick={() => setQty(q => Math.max(1, q - 1))}
						>
							−
						</button>
						<span className="fs-1 fw-bold" style={{ minWidth: '80px' }}>{qty}</span>
						<button
							type="button"
							className="btn btn-light rounded-circle btn-qty"
							aria-label="Aumentar"
							onClick={() => setQty(q => q + 1)}
						>
							+
						</button>
					</div>
				</div>
			</div>
		</ModalShell>
	);
}
