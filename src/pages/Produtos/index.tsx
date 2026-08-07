import { useEffect, useState } from 'react';
import { productService } from '../../services/productService';
import { useFeedback } from '../../components/Feedback/FeedbackProvider';
import { formatMoney } from '../../utils/format';
import type { Product } from '../../types/api/Product';
import { ProdutoFormModal } from './modal/ProdutoFormModal';
import '../../styles/shared-tables.css';

export function Produtos() {
	const [products, setProducts] = useState<Product[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [deletingId, setDeletingId] = useState<number | null>(null);

	// null = fechado | { product: null } = novo | { product } = editando
	const [modal, setModal] = useState<{ product: Product | null } | null>(null);

	const { sucesso, erro, confirmar } = useFeedback();

	useEffect(() => { loadProducts(); }, []);

	async function loadProducts() {
		setIsLoading(true);
		try {
			setProducts(await productService.getProducts());
		} catch {
			erro('Não foi possível carregar os produtos.');
		} finally {
			setIsLoading(false);
		}
	}

	/** Insere ou substitui na lista sem refetch. */
	function upsert(salvo: Product) {
		setProducts(prev =>
			prev.some(p => p.id === salvo.id)
				? prev.map(p => (p.id === salvo.id ? salvo : p))
				: [...prev, salvo]
		);
	}

	async function handleDelete(product: Product) {
		const ok = await confirmar({
			title: 'Excluir produto',
			confirmLabel: 'Excluir produto',
			danger: true,
			message: (
				<>
					<p>Apagar <strong>{product.name}</strong>?</p>
					<div className="alert alert-warning mb-0">
						Só é possível se ele nunca teve entrada ou venda registrada.
					</div>
				</>
			),
		});
		if (!ok) return;

		setDeletingId(product.id);
		try {
			await productService.deleteProduct(product.id);
			setProducts(prev => prev.filter(p => p.id !== product.id));
			sucesso('Produto excluído.');
		} catch (err: any) {
			erro(err?.message || 'Não foi possível apagar esse produto.');
		} finally {
			setDeletingId(null);
		}
	}

	const linhaClasse = (p: Product) => {
		if (p.stockQuantity <= 0) return 'linha-sem-estoque';
		if (p.stockQuantity <= 10) return 'linha-estoque-baixo';
		return '';
	};

	return (
		<div>
			<div className="page-header">
				<h2 className="page-title">Produtos</h2>
				<button className="btn btn-primary" onClick={() => setModal({ product: null })}>
					+ Novo produto
				</button>
			</div>

			{isLoading ? <p>Carregando…</p> : (
				<div className="table-responsive">
					<table className="table table-striped table-hover">
						<thead>
							<tr>
								<th style={{ width: '64px' }}>Foto</th>
								<th>SKU</th>
								<th>Nome</th>
								<th>Estoque</th>
								<th>Preço de venda</th>
								<th className="text-end">Ações</th>
							</tr>
						</thead>
						<tbody>
							{products.map(product => (
								<tr key={product.id} className={linhaClasse(product)}>
									<td>
										<img
											src={product.imageUrl || "/favicon.svg"}
											alt={product.name}
											className="produto-thumb"
											onError={(e) => {
												e.currentTarget.src = "/favicon.svg";
											}}
										/>
									</td>
									<td><strong>{product.sku}</strong></td>
									<td>{product.name}</td>
									<td>
										{product.stockQuantity <= 0 ? (
											<span className="badge bg-danger">Sem estoque</span>
										) : product.stockQuantity <= 10 ? (
											<span className="badge bg-warning text-dark">
												{product.stockQuantity} un (baixo)
											</span>
										) : (
											<span>{product.stockQuantity} un</span>
										)}
									</td>
									<td className="text-success fw-medium">{formatMoney(product.sellPrice)}</td>
									<td>
										<div className="d-flex gap-1 justify-content-end">
											<button
												type="button"
												className="btn btn-sm btn-warning"
												onClick={() => setModal({ product })}
											>
												Editar
											</button>
											<button
												type="button"
												className="btn btn-sm btn-outline-danger"
												disabled={deletingId === product.id}
												onClick={() => handleDelete(product)}
											>
												{deletingId === product.id ? 'Apagando…' : 'Excluir'}
											</button>
										</div>
									</td>
								</tr>
							))}

							{products.length === 0 && (
								<tr>
									<td colSpan={6} className="text-center py-4">Nenhum produto cadastrado.</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			)}

			{modal && (
				<ProdutoFormModal
					product={modal.product}
					onClose={() => setModal(null)}
					onSaved={upsert}
				/>
			)}
		</div>
	);
}
