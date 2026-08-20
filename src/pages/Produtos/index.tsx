import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productsQuery, useDeleteProduct } from '../../api/products/products.queries';
import { LoadingState } from '../../components/LoadingState';
import { useFeedback } from '../../components/Feedback/FeedbackProvider';
import { formatMoney } from '../../utils/format';
import { getImageUrl } from '../../utils/images';
import type { Product } from '../../api/products/products.types';
import { ProdutoFormModal, type ModalMode } from './modal/ProdutoFormModal';
import '../../styles/shared-tables.css';

export function Produtos() {
	const { data: products, isPending, isError } = useQuery(productsQuery());
	const deleteProduct = useDeleteProduct();
	const [deletingId, setDeletingId] = useState<number | null>(null);

	// null = fechado | { product: null } = novo | { product } = ver/editar
	const [modal, setModal] = useState<{ product: Product | null; mode: ModalMode } | null>(null);

	const { sucesso, erro, confirmar } = useFeedback();

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
			await deleteProduct.mutateAsync(product.id);
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
				<button className="btn btn-primary" onClick={() => setModal({ product: null, mode: 'edit' })}>
					+ Novo produto
				</button>
			</div>

			{isError && (
				<div className="alert alert-danger">Não foi possível carregar os produtos.</div>
			)}

			{isPending ? <LoadingState label="Carregando produtos…" /> : products?.length === 0 ? (
				<div className="table-responsive">
					<div className="text-center py-4 text-muted">Nenhum produto cadastrado.</div>
				</div>
			) : (
				<>
					<div className="table-responsive d-none d-lg-block">
						<table className="table table-striped table-hover">
							<thead>
								<tr>
									<th className="produtos-th-foto">Foto</th>
									<th>SKU</th>
									<th>Nome</th>
									<th>Estoque</th>
									<th>Preço de venda</th>
									<th className="text-end">Ações</th>
								</tr>
							</thead>
							<tbody>
								{products?.map(product => (
									<tr key={product.id} className={linhaClasse(product)}>
										<td>
											{product.imageUrl
												? <img src={getImageUrl(product.imageUrl)!} alt={product.name} className="produto-thumb" />
												: <div className="produto-thumb produto-thumb-placeholder">☕</div>}
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
													className="btn btn-sm btn-secondary"
													title="Ver produto"
													onClick={() => setModal({ product, mode: 'view' })}
												>
													<i className="bi bi-eye" aria-hidden="true" />
													<span className="visually-hidden">Ver {product.name}</span>
												</button>

												<button
													type="button"
													className="btn btn-sm btn-warning"
													onClick={() => setModal({ product, mode: 'edit' })}
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
							</tbody>
						</table>
					</div>

					<div className="row row-cols-1 row-cols-md-2 g-3 d-lg-none">
						{products?.map(product => (
							<div className="col" key={product.id}>
								<div className="list-card">
									<div className="list-card-header">
										{product.imageUrl
											? <img src={getImageUrl(product.imageUrl)!} alt={product.name} className="produto-thumb" />
											: <div className="produto-thumb produto-thumb-placeholder">☕</div>}
										<div className="flex-grow-1">
											<div className="list-card-title">{product.name}</div>
											<small className="text-muted">{product.sku}</small>
										</div>
									</div>
									<div className="list-card-body">
										<div className="list-card-row">
											<span className="list-card-label">Estoque</span>
											<span className="list-card-value">
												{product.stockQuantity <= 0 ? (
													<span className="badge bg-danger">Sem estoque</span>
												) : product.stockQuantity <= 10 ? (
													<span className="badge bg-warning text-dark">
														{product.stockQuantity} un (baixo)
													</span>
												) : (
													`${product.stockQuantity} un`
												)}
											</span>
										</div>
										<div className="list-card-row">
											<span className="list-card-label">Preço de venda</span>
											<span className="list-card-value text-success fw-medium">
												{formatMoney(product.sellPrice)}
											</span>
										</div>
									</div>
									<div className="list-card-actions">
										<button
											type="button"
											className="btn btn-sm btn-secondary"
											onClick={() => setModal({ product, mode: 'view' })}
										>
											<i className="bi bi-eye me-1" aria-hidden="true" />Ver
										</button>
										<button
											type="button"
											className="btn btn-sm btn-warning"
											onClick={() => setModal({ product, mode: 'edit' })}
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
								</div>
							</div>
						))}
					</div>
				</>
			)}

			{modal && (
				<ProdutoFormModal
					product={modal.product}
					mode={modal.mode}
					onClose={() => setModal(null)}
				/>
			)}
		</div>
	);
}
