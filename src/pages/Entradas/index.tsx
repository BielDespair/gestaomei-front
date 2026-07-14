import React, { useEffect, useState } from 'react';
import { entradaService, type Entrada } from '../../services/entradaService';
import { productService, type Product } from '../../services/productService';
import '../Produtos/styles.css';

export function Entradas() {
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    productId: '',
    quantity: '',
    unitCost: '' // Trocamos totalCost por unitCost aqui
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const [entradasData, productsData] = await Promise.all([
        entradaService.getEntradas(),
        productService.getProducts()
      ]);
      setEntradas(entradasData);
      setProducts(productsData);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNewClick = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      productId: '',
      quantity: '',
      unitCost: ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId) return alert("Selecione um produto.");

    setIsSaving(true);
    try {
      const novaEntrada = await entradaService.registrar({
        date: formData.date,
        productId: parseInt(formData.productId, 10),
        quantity: parseInt(formData.quantity, 10),
        unitCost: parseFloat(formData.unitCost)
      });

      setEntradas(prev => [novaEntrada, ...prev]);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erro ao registrar entrada", error);
      alert("Falha ao registrar entrada.");
    } finally {
      setIsSaving(false);
    }
  };

  const formatMoney = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatDate = (dateString: string) => {
    const [y, m, d] = dateString.split('-');
    return `${d}/${m}/${y}`;
  };

  // Calcula o total em tempo real para exibir no formulário
  const currentTotal = (parseInt(formData.quantity) || 0) * (parseFloat(formData.unitCost) || 0);

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Histórico de Entradas</h2>
        <button className="btn btn-primary" onClick={handleNewClick}>+ Registrar Entrada</button>
      </div>

      {isLoading ? <p>Carregando histórico...</p> : (
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>Data</th>
                <th>Produto</th>
                <th>Qtd.</th>
                <th>Custo Unitário</th>
                <th>Custo Total</th>
              </tr>
            </thead>
            <tbody>
              {[...entradas].reverse().map(entrada => (
                <tr key={entrada.id}>
                  <td><strong>{formatDate(entrada.date)}</strong></td>
                  <td>{entrada.productName}</td>
                  <td>{entrada.quantity} un</td>
                  <td style={{ color: '#6c757d' }}>{formatMoney(entrada.unitCost)}</td>
                  <td style={{ color: '#dc3545', fontWeight: '500' }}>{formatMoney(entrada.totalCost)}</td>
                </tr>
              ))}

              {entradas.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>Nenhuma entrada registrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* --- MODAL DE REGISTRAR ENTRADA --- */}
      {isModalOpen && (
        <>
          <div className="modal fade show d-block" tabIndex={-1}>
            <div className="modal-dialog">
              <div className="modal-content">

                <div className="modal-header">
                  <h5 className="modal-title">Registrar Nova Entrada</h5>

                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setIsModalOpen(false)}
                  />
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Data da Compra</label>
                      <input type="date" className="form-control" name="date" value={formData.date} onChange={handleInputChange} required />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Produto</label>
                      <select
                        className="form-select"
                        name="productId"
                        value={formData.productId}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">-- Selecione o Produto --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <div className="mb-3" style={{ flex: 1 }}>
                        <label className="form-label">Quantidade Comprada</label>
                        <input type="number" min="1" className="form-control" name="quantity" value={formData.quantity} onChange={handleInputChange} required />
                      </div>

                      <div className="mb-3" style={{ flex: 1 }}>
                        <label className="form-label">Custo Unitário (R$)</label>
                        <input type="number" step="0.01" min="0.01" className="form-control" name="unitCost" value={formData.unitCost} onChange={handleInputChange} required />
                      </div>
                    </div>

                    {/* Exibição dinâmica do total calculado */}
                    <div className="alert alert-info py-2" style={{ backgroundColor: '#cff4fc', borderColor: '#b6effb', color: '#055160', margin: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Valor Total desta Nota:</span>
                        <strong>{formatMoney(currentTotal)}</strong>
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
                      className="btn btn-success"
                      disabled={isSaving}
                    >
                      {isSaving ? 'Registrando...' : 'Confirmar Entrada'}
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