import { useEffect, useRef, useState } from 'react';
import { productService } from '../../services/productService';
import { clientService } from '../../services/clientService';
import { vendaService } from '../../services/vendaService';
import { useFeedback } from '../../components/Feedback/FeedbackProvider';
import { formatMoney } from '../../utils/format';
import type { Product } from '../../types/api/Product';
import type { VendaItem } from '../../services/vendaService';
import type { ClientList } from '../../types/api/Client';
import { HistoricoVendas } from './Historico';
import { ProdutoModal } from './modal/ProdutoModal';
import { SelecionarClienteModal } from './modal/SelecionarClienteModal';
import { VendaConcluidaModal } from './modal/VendaConcluidaModal';
import './styles.css';

type Modo = 'nova' | 'historico';
type FormaPagamento = 'PIX' | 'DINHEIRO' | 'CARTAO';

interface ItemVenda extends VendaItem {
	itemId: string;
}

export function Vendas() {
	const [modo, setModo] = useState<Modo>('nova');

	const [products, setProducts] = useState<Product[]>([]);
	const [clients, setClients] = useState<ClientList[]>([]);

	const [itensVenda, setItensVenda] = useState<ItemVenda[]>([]);
	const proximoItemId = useRef(1);
	const [selectedClient, setSelectedClient] = useState<ClientList | null>(null);

	const [isPaid, setIsPaid] = useState(true);
	const [isDelivered, setIsDelivered] = useState(true);
	const [paymentMethod, setPaymentMethod] = useState<FormaPagamento>('PIX');
	const [isSaving, setIsSaving] = useState(false);

	// Modais
	const [addingProduct, setAddingProduct] = useState<Product | null>(null);
	const [isClientModalOpen, setIsClientModalOpen] = useState(false);
	const [showSuccess, setShowSuccess] = useState(false);

	const { erro } = useFeedback();

	const totalVenda = itensVenda.reduce((acc, i) => acc + i.totalPrice, 0);
	const unidades = itensVenda.reduce((acc, i) => acc + i.quantity, 0);

	/** Mesmo produto com o mesmo preço vira uma linha só. */
	function adicionarItem(product: Product, quantity: number, unitPrice: number) {
		setItensVenda(prev => {
			const existente = prev.find(i => i.productId === product.id && i.unitPrice === unitPrice);

			if (existente) {
				return prev.map(i =>
					i.itemId === existente.itemId
						? { ...i, quantity: i.quantity + quantity, totalPrice: (i.quantity + quantity) * unitPrice }
						: i
				);
			}

			return [...prev, {
				itemId: String(proximoItemId.current++),
				productId: product.id,
				productName: product.name,
				quantity,
				unitPrice,
				totalPrice: unitPrice * quantity,
			}];
		});
	}

	function removerItem(itemId: string) {
		setItensVenda(prev => prev.filter(i => i.itemId !== itemId));
	}

	useEffect(() => { loadData(); }, []);

	async function loadData() {
		const [prod, cli] = await Promise.allSettled([
			productService.getProducts(),
			clientService.getClients(),
		]);
		if (prod.status === 'fulfilled') setProducts(prod.value);
		if (cli.status === 'fulfilled') setClients(cli.value ?? []);
	}

	async function handleFinalize() {
		if (itensVenda.length === 0) return erro('Adicione pelo menos um produto.');
		if (!isPaid && !selectedClient) return erro('Para lançar como fiado, selecione o cliente.');
		if (!isDelivered && !selectedClient) return erro('Para agendar entrega, selecione o cliente.');

		setIsSaving(true);
		try {
			await vendaService.registrarVenda({
				date: new Date().toISOString().split('T')[0],
				clientId: selectedClient?.id ?? null,
				clientName: selectedClient?.name ?? 'Consumidor Final',
				items: itensVenda,
				totalValue: totalVenda,
				isPaid,
				paymentMethod: isPaid ? paymentMethod : '',
				deliveryStatus: isDelivered ? 'ENTREGUE' : 'PENDENTE',
			});

			setItensVenda([]);
			setSelectedClient(null);
			setIsPaid(true);
			setIsDelivered(true);
			setPaymentMethod('PIX');
			await loadData();
			setShowSuccess(true);
		} catch (err: any) {
			erro(err?.message || 'Não foi possível finalizar a venda.');
		} finally {
			setIsSaving(false);
		}
	}

	return (
		<div className="container-fluid px-3 px-lg-4 py-3 py-lg-4 vendas-tablet">
			<h2 className="mb-3 fw-bold">Vendas</h2>

			<div className="d-flex gap-2 mb-4">
				<button
					type="button"
					className={`btn btn-lg ${modo === 'nova' ? 'btn-primary' : 'btn-outline-secondary'}`}
					onClick={() => setModo('nova')}
				>
					Nova venda
				</button>
				<button
					type="button"
					className={`btn btn-lg ${modo === 'historico' ? 'btn-primary' : 'btn-outline-secondary'}`}
					onClick={() => setModo('historico')}
				>
					Histórico
				</button>
			</div>

			{modo === 'historico' && <HistoricoVendas />}

			{modo === 'nova' && (
				<div className="row g-3 g-lg-4">
					<div className="col-lg-7 col-xl-8">
						<div className="card venda-passo shadow-sm">
							<div className="card-body p-3">
								<button
									type="button"
									className={`btn w-100 d-flex justify-content-between align-items-center p-3 fs-5 ${
										selectedClient
											? 'btn-outline-primary bg-primary-subtle border-primary fw-bold'
											: 'btn-outline-secondary border-dashed'
									}`}
									onClick={() => setIsClientModalOpen(true)}
								>
									<span>{selectedClient?.name ?? 'Toque para vincular um cliente (opcional)'}</span>
									{selectedClient && (
										<span
											className="fs-3 px-3"
											role="button"
											aria-label="Remover cliente"
											onClick={e => { e.stopPropagation(); setSelectedClient(null); }}
										>
											&times;
										</span>
									)}
								</button>
							</div>
						</div>

						<div className="card venda-passo shadow-sm">
							<div className="card-header bg-white fw-semibold">Toque no produto para vender</div>
							<div className="card-body">
								{products.length === 0 ? (
									<div className="text-center text-muted py-4">Nenhum produto cadastrado.</div>
								) : (
									<div className="row row-cols-2 row-cols-lg-3 g-3">
										{products.map(product => {
											const semEstoque = product.stockQuantity <= 0;
											return (
												<div className="col" key={product.id}>
													<div
														className={`card h-100 produto-card ${semEstoque ? 'opacity-65' : ''}`}
														onClick={() => setAddingProduct(product)}
														role="button"
													>
														<div className="produto-card-imagem">
															{product.imageUrl
																? <img src={product.imageUrl} alt={product.name} />
																: <span className="produto-card-imagem-placeholder">☕</span>}
														</div>
														<div className="card-body d-flex flex-column justify-content-between p-3">
															<div>
																<div className="card-title fs-5 fw-bold mb-1">{product.name}</div>
																<div className="text-muted mb-3">
																	{semEstoque
																		? <span className="text-danger">Venda sob encomenda</span>
																		: `Estoque: ${product.stockQuantity} un`}
																</div>
															</div>
															<div className="d-flex justify-content-between align-items-center">
																<span className="fs-4 fw-bold text-success">
																	{formatMoney(product.sellPrice)}
																</span>
																{semEstoque && (
																	<span className="badge bg-warning text-dark p-2">Sem estoque</span>
																)}
															</div>
														</div>
													</div>
												</div>
											);
										})}
									</div>
								)}
							</div>
						</div>
					</div>

					<div className="col-lg-5 col-xl-4">
						<div className="sticky-lg-top vendas-sidebar">
							<div className="card venda-passo shadow-sm">
								<div className="card-header bg-white fw-semibold d-flex justify-content-between">
									<span>Itens da venda</span>
									{unidades > 0 && (
										<span className="badge bg-primary rounded-pill fs-6">
											{unidades} un
										</span>
									)}
								</div>

								<div className="cart-scroll">
									{itensVenda.length === 0 ? (
										<div className="p-4 text-center text-muted fs-6">
											Nenhum produto adicionado ainda.
										</div>
									) : (
										<ul className="list-group list-group-flush">
											{itensVenda.map(item => (
												<li
													key={item.itemId}
													className="list-group-item d-flex justify-content-between align-items-center p-3"
												>
													<div>
														<div className="fs-6 fw-bold">{item.productName}</div>
														<div className="text-muted small">
															{item.quantity} un × {formatMoney(item.unitPrice)}
														</div>
													</div>
													<div className="d-flex align-items-center gap-2">
														<span className="fs-5 fw-bold">{formatMoney(item.totalPrice)}</span>
														<button
															type="button"
															className="btn btn-outline-danger rounded-3"
															aria-label={`Remover ${item.productName}`}
															onClick={() => removerItem(item.itemId)}
														>
															&times;
														</button>
													</div>
												</li>
											))}
										</ul>
									)}
								</div>

								<div className="card-footer bg-primary-subtle p-3">
									<div className="d-flex justify-content-between align-items-center">
										<h5 className="mb-0">Total</h5>
										<h3 className="mb-0 text-primary fw-bold">{formatMoney(totalVenda)}</h3>
									</div>
								</div>
							</div>

							<div className="card venda-passo shadow-sm">
								<div className="card-body p-3">
									<div className="row g-2 mb-3">
										<div className="col-6">
											<label className="form-check d-flex align-items-center gap-2 p-2 h-100 border rounded-3 bg-light m-0">
												<input
													className="form-check-input toggle-check m-0 flex-shrink-0"
													type="checkbox"
													checked={isPaid}
													onChange={e => setIsPaid(e.target.checked)}
												/>
												<span className={`small fw-bold ${isPaid ? 'text-success' : 'text-danger'}`}>
													{isPaid ? 'Recebido' : 'Fiado'}
												</span>
											</label>
										</div>

										<div className="col-6">
											<label className="form-check d-flex align-items-center gap-2 p-2 h-100 border rounded-3 bg-light m-0">
												<input
													className="form-check-input toggle-check m-0 flex-shrink-0"
													type="checkbox"
													checked={isDelivered}
													onChange={e => setIsDelivered(e.target.checked)}
												/>
												<span className={`small fw-bold ${isDelivered ? 'text-primary' : 'text-warning'}`}>
													{isDelivered ? 'Levou' : 'Entregar'}
												</span>
											</label>
										</div>
									</div>

									{isPaid && (
										<select
											className="form-select form-select-lg mb-3"
											value={paymentMethod}
											onChange={e => setPaymentMethod(e.target.value as FormaPagamento)}
										>
											<option value="PIX">PIX</option>
											<option value="DINHEIRO">Dinheiro</option>
											<option value="CARTAO">Cartão</option>
										</select>
									)}

									<button
										type="button"
										className={`btn w-100 py-3 fs-3 fw-bold rounded-3 ${isPaid ? 'btn-success' : 'btn-danger'}`}
										onClick={handleFinalize}
										disabled={itensVenda.length === 0 || isSaving}
									>
										{isSaving ? 'Aguarde…' : isPaid ? 'Finalizar venda' : 'Lançar dívida'}
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			{addingProduct && (
				<ProdutoModal
					product={addingProduct}
					onClose={() => setAddingProduct(null)}
					onConfirm={(qty, price) => adicionarItem(addingProduct, qty, price)}
				/>
			)}

			{isClientModalOpen && (
				<SelecionarClienteModal
					clients={clients}
					onClose={() => setIsClientModalOpen(false)}
					onSelect={client => { setSelectedClient(client); setIsClientModalOpen(false); }}
					onCreated={loadData}
				/>
			)}

			{showSuccess && <VendaConcluidaModal onClose={() => setShowSuccess(false)} />}
		</div>
	);
}
