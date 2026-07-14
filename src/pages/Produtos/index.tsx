import React, { useEffect, useState } from 'react';
import { productService, type Product } from '../../services/productService';
import './styles.css';

export function Produtos() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', sku: '', costPrice: '', sellPrice: '', stock: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { loadProducts(); }, []);

  async function loadProducts() {
    setIsLoading(true);
    try { setProducts(await productService.getProducts()); }
    catch (error) { console.error(error); }
    finally { setIsLoading(false); }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNewClick = () => {
    setEditingId(null);
    setFormData({ name: '', sku: '', costPrice: '', sellPrice: '', stock: '' });
    setIsModalOpen(true);
  };

  const handleEditClick = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      sku: product.sku,
      costPrice: product.costPrice.toString(),
      sellPrice: product.sellPrice.toString(),
      stock: product.stock.toString()
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        name: formData.name,
        sku: formData.sku,
        costPrice: parseFloat(formData.costPrice),
        sellPrice: parseFloat(formData.sellPrice),
        stock: parseInt(formData.stock, 10)
      };

      if (editingId) {
        const updated = await productService.updateProduct(editingId, payload);
        setProducts(prev => prev.map(p => p.id === editingId ? updated : p));
      } else {
        const novo = await productService.addProduct(payload);
        setProducts(prev => [...prev, novo]);
      }
      setIsModalOpen(false);
    } finally { setIsSaving(false); }
  };

  const formatMoney = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Catálogo de Produtos</h2>
        <button className="btn btn-primary" onClick={handleNewClick}>+ Novo Produto</button>
      </div>

      {isLoading ? <p>Carregando...</p> : (
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Nome</th>
                <th>Preço Venda</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id}>
                  <td><strong>{product.sku}</strong></td>
                  <td>{product.name}</td>
                  <td style={{ color: '#198754', fontWeight: '500' }}>{formatMoney(product.sellPrice)}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn btn-sm btn-warning" onClick={() => handleEditClick(product)}>Editar</button>
                      <button className="btn btn-sm btn-danger">Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <>
          <div className="modal fade show d-block" tabIndex={-1}>
            <div className="modal-dialog">
              <div className="modal-content">

                <div className="modal-header">
                  <h5 className="modal-title">
                    {editingId ? 'Editar Produto' : 'Novo Produto'}
                  </h5>

                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setIsModalOpen(false)}
                  />
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="modal-body">
                    {/* Campos do formulário idênticos ao anterior */}
                    <div className="mb-3">
                      <label className="form-label">Nome</label>
                      <input type="text" className="form-control" name="name" value={formData.name} onChange={handleInputChange} required />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">SKU</label>
                      <input type="text" className="form-control" name="sku" value={formData.sku} onChange={handleInputChange} required />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <div className="mb-3" style={{ flex: 1 }}>
                        <label className="form-label">Custo Base (R$)</label>
                        <input type="number" step="0.01" className="form-control" name="costPrice" value={formData.costPrice} onChange={handleInputChange} required />
                      </div>
                      <div className="mb-3" style={{ flex: 1 }}>
                        <label className="form-label">Preço Venda (R$)</label>
                        <input type="number" step="0.01" className="form-control" name="sellPrice" value={formData.sellPrice} onChange={handleInputChange} required />
                      </div>
                      <div className="mb-3" style={{ width: '100px' }}>
                        <label className="form-label">Estoque Inicial</label>
                        <input type="number" className="form-control" name="stock" value={formData.stock} onChange={handleInputChange} required />
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isSaving}
                    >
                      Salvar
                    </button>
                  </div>
                </form>

              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show"></div>
        </>
      )}
    </div>
  );
}