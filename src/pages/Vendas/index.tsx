import React, { useEffect, useState } from 'react';
import { productService, type Product } from '../../services/productService';
import { clientService, type Client } from '../../services/clientService';
import { vendaService, type VendaItem } from '../../services/vendaService';
import { HistoricoVendas } from './Historico';
import './styles.css';

interface CartItem extends VendaItem {
  cartId: string;
}

export function Vendas() {
  const [modo, setModo] = useState<'nova' | 'historico'>('nova');

  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  // Estados da Venda
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Checkboxes de Controle (Pagamento e Entrega)
  const [isPaid, setIsPaid] = useState(true);
  const [isDelivered, setIsDelivered] = useState(true);

  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'DINHEIRO' | 'CARTAO'>('PIX');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Modais
  const [addingProduct, setAddingProduct] = useState<Product | null>(null);
  const [customPrice, setCustomPrice] = useState<string>('');
  const [customQty, setCustomQty] = useState<number>(1);

  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [isQuickCreate, setIsQuickCreate] = useState(false);
  const [quickClientName, setQuickClientName] = useState('');
  const [quickClientPhone, setQuickClientPhone] = useState('');
  const [quickClientDocument, setQuickClientDocument] = useState('');
  const [quickClientNeighborhood, setQuickClientNeighborhood] = useState('');
  const [quickClientNotes, setQuickClientNotes] = useState('');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [prodData, cliData] = await Promise.all([
      productService.getProducts(),
      clientService.getClients()
    ]);
    setProducts(prodData);
    setClients(cliData);
  }

  const filteredClients = clients.filter(c => {
    const term = clientSearch.toLowerCase();
    return c.name.toLowerCase().includes(term) || (c.document && c.document.toLowerCase().includes(term));
  });

  // --- FUNÇÕES DE CARRINHO E PRODUTO ---
  const openAddModal = (product: Product) => {
    setAddingProduct(product);
    setCustomPrice(product.sellPrice.toString());
    setCustomQty(1);
  };

  const confirmAddToCart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingProduct) return;

    const price = parseFloat(customPrice);
    if (isNaN(price) || price < 0) return alert('Preço inválido.');

    setCart(prev => {
      const existing = prev.find(item => item.productId === addingProduct.id && item.unitPrice === price);
      if (existing) {
        return prev.map(item => item.cartId === existing.cartId
          ? { ...item, quantity: item.quantity + customQty, totalPrice: (item.quantity + customQty) * price }
          : item
        );
      }
      return [...prev, { cartId: Date.now().toString(), productId: addingProduct.id, productName: addingProduct.name, quantity: customQty, unitPrice: price, totalPrice: price * customQty }];
    });
    setAddingProduct(null);
  };

  const removeFromCart = (cartId: string) => setCart(prev => prev.filter(item => item.cartId !== cartId));
  const cartTotal = cart.reduce((acc, item) => acc + item.totalPrice, 0);
  const cartUnits = cart.reduce((acc, item) => acc + item.quantity, 0);

  // --- FUNÇÕES DE CLIENTE ---
  const openClientModal = () => { setClientSearch(''); setIsQuickCreate(false); setIsClientModalOpen(true); };
  const selectClient = (client: Client) => { setSelectedClient(client); setIsClientModalOpen(false); };

  const handleQuickCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const novoCliente = await clientService.addClient({
        name: quickClientName, phone: quickClientPhone, document: quickClientDocument,
        neighborhood: quickClientNeighborhood, notes: quickClientNotes,
        email: '', pix: '', zipCode: '', address: '', number: '', city: '', state: ''
      });
      setClients(prev => [...prev, novoCliente]);
      setSelectedClient(novoCliente);
      setIsClientModalOpen(false);

      setQuickClientName(''); setQuickClientPhone(''); setQuickClientDocument('');
      setQuickClientNeighborhood(''); setQuickClientNotes('');
    } finally { setIsSaving(false); }
  };

  // --- FINALIZAR ---
  const handleFinalize = async () => {
    if (cart.length === 0) return alert('Adicione pelo menos um produto.');
    if (!isPaid && !selectedClient) return alert('Para marcar como FIADO, selecione o cliente.');
    if (!isDelivered && !selectedClient) return alert('Para agendar uma ENTREGA FUTURA, você deve selecionar o cliente.');

    setIsSaving(true);
    try {
      await vendaService.registrarVenda({
        date: new Date().toISOString().split('T')[0],
        clientId: selectedClient ? selectedClient.id : null,
        clientName: selectedClient ? selectedClient.name : 'Consumidor Final',
        items: cart,
        totalValue: cartTotal,
        isPaid: isPaid,
        paymentMethod: isPaid ? paymentMethod : '',
        deliveryStatus: isDelivered ? 'ENTREGUE' : 'PENDENTE'
      });

      setCart([]); setSelectedClient(null);
      setIsPaid(true); setIsDelivered(true);
      setPaymentMethod('PIX');
      loadData();
      setShowSuccess(true);

    } catch (error) {
      alert('Erro ao finalizar.');
    } finally { setIsSaving(false); }
  };

  const formatMoney = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="container-fluid px-3 px-lg-4 py-3 py-lg-4 vendas-tablet">
      <h2 className="mb-3 fw-bold">Vendas</h2>

      {/* --- ALTERNADOR NOVA VENDA / HISTÓRICO --- */}
      <div className="d-flex gap-2 mb-4">
        <button
          type="button"
          className={`btn btn-lg ${modo === 'nova' ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => setModo('nova')}
        >
          🛒 Nova Venda
        </button>
        <button
          type="button"
          className={`btn btn-lg ${modo === 'historico' ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => setModo('historico')}
        >
          📜 Histórico
        </button>
      </div>

      {modo === 'historico' && <HistoricoVendas />}

      {modo === 'nova' && (
        <>
          <div className="row g-3 g-lg-4">
            {/* ================= COLUNA PRINCIPAL: CLIENTE + PRODUTOS ================= */}
            <div className="col-lg-7 col-xl-8">

              {/* --- CLIENTE --- */}
              <div className="card venda-passo shadow-sm">
                <div className="card-body p-3">
                  <button
                    type="button"
                    className={`btn w-100 d-flex justify-content-between align-items-center p-3 fs-5 ${
                      selectedClient
                        ? 'btn-outline-primary bg-primary-subtle border-primary fw-bold'
                        : 'btn-outline-secondary border-dashed'
                    }`}
                    onClick={openClientModal}
                  >
                    <span>{selectedClient ? `👤 ${selectedClient.name}` : '👤 Toque para vincular um cliente (opcional)'}</span>
                    {selectedClient && (
                      <span
                        className="fs-3 px-3"
                        role="button"
                        onClick={(e) => { e.stopPropagation(); setSelectedClient(null); }}
                      >
                        &times;
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* --- PRODUTOS --- */}
              <div className="card venda-passo shadow-sm">
                <div className="card-header bg-white fw-semibold">Toque no produto para vender</div>
                <div className="card-body">
                  {products.length === 0 ? (
                    <div className="text-center text-muted py-4">Nenhum produto cadastrado no sistema.</div>
                  ) : (
                    <div className="row row-cols-2 row-cols-lg-3 row-cols-xl-3 g-3">
                      {products.map(product => {
                        const semEstoque = product.stock <= 0;
                        const imgSrc = productService.getImageUrl(product);
                        return (
                          <div className="col" key={product.id}>
                            <div
                              className={`card h-100 produto-card ${semEstoque ? 'opacity-65' : ''}`}
                              onClick={() => openAddModal(product)}
                              role="button"
                            >
                              <div className="produto-card-imagem">
                                {imgSrc ? (
                                  <img src={imgSrc} alt={product.name} />
                                ) : (
                                  <span className="produto-card-imagem-placeholder">☕</span>
                                )}
                              </div>
                              <div className="card-body d-flex flex-column justify-content-between p-3">
                                <div>
                                  <div className="card-title fs-5 fw-bold mb-1">{product.name}</div>
                                  <div className="text-muted mb-3">
                                    {semEstoque
                                      ? <span className="text-danger">Venda sob encomenda</span>
                                      : `Estoque: ${product.stock} un`}
                                  </div>
                                </div>
                                <div className="d-flex justify-content-between align-items-center">
                                  <span className="fs-4 fw-bold text-success">{formatMoney(product.sellPrice)}</span>
                                  {semEstoque && <span className="badge bg-warning text-dark p-2">Sem Estoque</span>}
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

            {/* ================= COLUNA LATERAL FIXA: CARRINHO + FINALIZAÇÃO ================= */}
            <div className="col-lg-5 col-xl-4">
              <div className="sticky-lg-top vendas-sidebar">

                {/* --- CARRINHO --- */}
                <div className="card venda-passo shadow-sm">
                  <div className="card-header bg-white fw-semibold d-flex justify-content-between">
                    <span>Carrinho</span>
                    {cartUnits > 0 && <span className="badge bg-primary rounded-pill fs-6">{cartUnits} un</span>}
                  </div>

                  <div className="cart-scroll">
                    {cart.length === 0 ? (
                      <div className="p-4 text-center text-muted fs-6">Nenhum produto adicionado ainda.</div>
                    ) : (
                      <ul className="list-group list-group-flush">
                        {cart.map(item => (
                          <li key={item.cartId} className="list-group-item d-flex justify-content-between align-items-center p-3">
                            <div>
                              <div className="fs-6 fw-bold">{item.productName}</div>
                              <div className="text-muted small">{item.quantity} un x {formatMoney(item.unitPrice)}</div>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                              <span className="fs-5 fw-bold">{formatMoney(item.totalPrice)}</span>
                              <button
                                type="button"
                                className="btn btn-outline-danger rounded-3"
                                onClick={() => removeFromCart(item.cartId)}
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
                      <h5 className="mb-0">Total:</h5>
                      <h3 className="mb-0 text-primary fw-bold">{formatMoney(cartTotal)}</h3>
                    </div>
                  </div>
                </div>

                {/* --- FINALIZAÇÃO --- */}
                <div className="card venda-passo shadow-sm">
                  <div className="card-body p-3">

                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <label className="form-check d-flex align-items-center gap-2 p-2 h-100 border rounded-3 bg-light m-0">
                          <input
                            className="form-check-input toggle-check m-0 flex-shrink-0"
                            type="checkbox"
                            checked={isPaid}
                            onChange={(e) => setIsPaid(e.target.checked)}
                          />
                          <span className={`small fw-bold ${isPaid ? 'text-success' : 'text-danger'}`}>
                            {isPaid ? '✔ Recebido' : '✖ Fiado'}
                          </span>
                        </label>
                      </div>

                      <div className="col-6">
                        <label className="form-check d-flex align-items-center gap-2 p-2 h-100 border rounded-3 bg-light m-0">
                          <input
                            className="form-check-input toggle-check m-0 flex-shrink-0"
                            type="checkbox"
                            checked={isDelivered}
                            onChange={(e) => setIsDelivered(e.target.checked)}
                          />
                          <span className={`small fw-bold ${isDelivered ? 'text-primary' : 'text-warning'}`}>
                            {isDelivered ? '🛍️ Levou' : '🚚 Entregar'}
                          </span>
                        </label>
                      </div>
                    </div>

                    {isPaid && (
                      <div className="mb-3">
                        <select
                          className="form-select form-select-lg"
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value as any)}
                        >
                          <option value="PIX">PIX</option>
                          <option value="DINHEIRO">Dinheiro</option>
                          <option value="CARTAO">Cartão</option>
                        </select>
                      </div>
                    )}

                    <button
                      type="button"
                      className={`btn w-100 py-3 fs-3 fw-bold rounded-3 ${!isPaid ? 'btn-danger' : 'btn-success'}`}
                      onClick={handleFinalize}
                      disabled={cart.length === 0 || isSaving}
                    >
                      {isSaving ? 'Aguarde...' : (!isPaid ? 'Lançar Dívida' : 'Finalizar Venda')}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* ================= MODAIS ================= */}

          {showSuccess && (
            <>
              <div className="modal fade show d-block" tabIndex={-1} style={{ zIndex: 1060 }}>
                <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '400px' }}>
                  <div className="modal-content text-center rounded-4 border-0 p-4">
                    <div className="fs-1 mb-3">✅</div>
                    <h3 className="mb-3 fw-bold text-success">Venda Finalizada!</h3>
                    <p className="text-muted mb-4 fs-5">
                      Tudo certo! As quantidades foram atualizadas no estoque.
                    </p>
                    <button
                      type="button"
                      className="btn btn-success w-100 py-3 fs-4 fw-bold rounded-3"
                      onClick={() => setShowSuccess(false)}
                    >
                      Nova Venda
                    </button>
                  </div>
                </div>
              </div>
              <div className="modal-backdrop fade show" style={{ zIndex: 1055 }}></div>
            </>
          )}

          {/* MODAL 1: PREÇO E QUANTIDADE */}
          {addingProduct && (
            <>
              <div className="modal fade show d-block" tabIndex={-1}>
                <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '450px' }}>
                  <div className="modal-content rounded-4">
                    <div className="modal-header p-4">
                      <div className="d-flex align-items-center gap-3">
                        {productService.getImageUrl(addingProduct) ? (
                          <img
                            src={productService.getImageUrl(addingProduct)!}
                            alt={addingProduct.name}
                            className="produto-modal-thumb"
                          />
                        ) : (
                          <span className="produto-modal-thumb produto-modal-thumb-placeholder">☕</span>
                        )}
                        <h4 className="modal-title fw-bold mb-0">{addingProduct.name}</h4>
                      </div>
                      <button type="button" className="btn-close fs-5" onClick={() => setAddingProduct(null)}></button>
                    </div>
                    <form onSubmit={confirmAddToCart}>
                      <div className="modal-body p-4 d-flex flex-column gap-4">
                        <div className="text-center">
                          <label className="form-label text-muted fs-5">Preço Unitário (R$)</label>
                          <input
                            type="number"
                            step="0.01"
                            inputMode="decimal"
                            className="form-control form-control-lg text-center fw-bold input-giant border-primary border-3 rounded-3"
                            value={customPrice}
                            onChange={(e) => setCustomPrice(e.target.value)}
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
                              onClick={() => setCustomQty(prev => Math.max(1, prev - 1))}
                            >
                              -
                            </button>
                            <span className="fs-1 fw-bold" style={{ minWidth: '80px' }}>{customQty}</span>
                            <button
                              type="button"
                              className="btn btn-light rounded-circle btn-qty"
                              onClick={() => setCustomQty(prev => prev + 1)}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="modal-footer p-4 border-top-0">
                        <button type="submit" className="btn btn-primary w-100 py-3 fs-4 fw-bold rounded-3">
                          Adicionar {formatMoney((parseFloat(customPrice) || 0) * customQty)}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
              <div className="modal-backdrop fade show"></div>
            </>
          )}

          {/* MODAL 2: BUSCA / CADASTRO DE CLIENTE */}
          {isClientModalOpen && (
            <>
              <div className="modal fade show d-block" tabIndex={-1}>
                <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '700px' }}>
                  <div className="modal-content rounded-4">
                    <div className="modal-header p-4">
                      <h4 className="modal-title fw-bold">{isQuickCreate ? 'Cadastro Rápido' : 'Buscar Cliente'}</h4>
                      <button type="button" className="btn-close fs-5" onClick={() => setIsClientModalOpen(false)}></button>
                    </div>

                    {isQuickCreate ? (
                      <form onSubmit={handleQuickCreateClient}>
                        <div className="modal-body p-4" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                          <div className="mb-4">
                            <label className="form-label fs-5">Nome Completo *</label>
                            <input
                              type="text"
                              className="form-control form-control-lg"
                              value={quickClientName}
                              onChange={(e) => setQuickClientName(e.target.value)}
                              required
                            />
                          </div>
                          <div className="mb-4">
                            <label className="form-label fs-5">Bairro</label>
                            <input
                              type="text"
                              className="form-control form-control-lg"
                              value={quickClientNeighborhood}
                              onChange={(e) => setQuickClientNeighborhood(e.target.value)}
                            />
                          </div>
                          <div className="mb-4">
                            <label className="form-label fs-5">Observação (Opcional)</label>
                            <input
                              type="text"
                              className="form-control form-control-lg"
                              placeholder="Ex: Filho do seu Zé, deixar na portaria..."
                              value={quickClientNotes}
                              onChange={(e) => setQuickClientNotes(e.target.value)}
                            />
                          </div>
                          <div className="mb-4">
                            <label className="form-label fs-5">Telefone (Opcional)</label>
                            <input
                              type="text"
                              className="form-control form-control-lg"
                              value={quickClientPhone}
                              onChange={(e) => setQuickClientPhone(e.target.value)}
                            />
                          </div>
                          <div className="mb-4">
                            <label className="form-label fs-5">CPF / CNPJ (Opcional)</label>
                            <input
                              type="text"
                              className="form-control form-control-lg"
                              value={quickClientDocument}
                              onChange={(e) => setQuickClientDocument(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="modal-footer p-4">
                          <button type="button" className="btn btn-secondary py-3 px-4 fs-5" onClick={() => setIsQuickCreate(false)}>
                            Voltar
                          </button>
                          <button type="submit" className="btn btn-primary py-3 px-4 fs-5" disabled={isSaving}>
                            Salvar Cliente
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="modal-body p-4">
                        <input
                          type="text"
                          className="form-control form-control-lg mb-4 rounded-3"
                          placeholder="🔍 Nome ou documento..."
                          value={clientSearch}
                          onChange={(e) => setClientSearch(e.target.value)}
                          autoFocus
                        />
                        <div className="list-group" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                          {filteredClients.map(client => (
                            <button
                              type="button"
                              key={client.id}
                              className="list-group-item list-group-item-action p-3"
                              onClick={() => selectClient(client)}
                            >
                              <div className="d-flex justify-content-between align-items-center gap-3">
                                <span className="fs-5 fw-bold text-truncate">{client.name}</span>
                                {client.neighborhood && (
                                  <span className="text-nowrap text-muted small">{client.neighborhood}</span>
                                )}
                              </div>
                              <div className="text-muted mt-2">
                                {client.document ? `Doc: ${client.document} | ` : ''}
                                {client.phone || 'S/ Tel'}
                              </div>
                              {client.notes && (
                                <div className="text-primary mt-2 fst-italic">
                                  {client.notes}
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {!isQuickCreate && (
                      <div className="modal-footer p-4">
                        <button
                          type="button"
                          className="btn btn-outline-primary w-100 py-3 fs-5 fw-bold"
                          onClick={() => setIsQuickCreate(true)}
                        >
                          + Cadastrar Novo Cliente
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-backdrop fade show"></div>
            </>
          )}
        </>
      )}
    </div>
  );
}
