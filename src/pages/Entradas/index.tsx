import React, { useEffect, useState } from 'react';
import { entradaService, type Entrada } from '../../services/entradaService';
import { productService, type Product } from '../../services/productService';
import '../../styles/shared-tables.css';

export function Entradas() {
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntrada, setEditingEntrada] = useState<Entrada | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    productId: '',
    quantity: '',
    unitCost: '',
  });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const [entradasData, productsData] = await Promise.all([
        entradaService.getEntradas(),
        productService.getProducts(),
      ]);
      setEntradas(entradasData);
      setProducts(productsData);
    } catch (error) {
      console.error(error);
      setErrorMessage('Não foi possível carregar o histórico de entradas.');
    } finally {
      setIsLoading(false);
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNewClick = () => {
    setEditingEntrada(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      productId: '', quantity: '', unitCost: '',
    });
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleEditClick = (entrada: Entrada) => {
    if (!entrada.podeEditar) return;
    setEditingEntrada(entrada);
    setFormData({
      date: entrada.date,
      productId: entrada.productId.toString(),
      quantity: entrada.quantity.toString(),
      unitCost: entrada.unitCost.toString(),
    });
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (entrada: Entrada) => {
    if (!entrada.podeEditar) return;
    const confirmado = window.confirm(
      `Apagar a entrada de ${entrada.quantity}un de "${entrada.productName}"? Essa ação não pode ser desfeita.`
    );
    if (!confirmado) return;

    try {
      await entradaService.apagar(entrada.id);
      setEntradas(prev => prev.filter(e => e.id !== entrada.id));
    } catch (error: any) {
      setErrorMessage(error?.message || 'Não foi possível apagar essa entrada.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!editingEntrada && !formData.productId) {
      return alert('Selecione um produto.');
    }

    setIsSaving(true);
    try {
      if (editingEntrada) {
        const atualizada = await entradaService.atualizar(editingEntrada.id, {
          date: formData.date,
          quantity: parseInt(formData.quantity, 10),
          unitCost: parseFloat(formData.unitCost),
        });
        setEntradas(prev => prev.map(e => (e.id === atualizada.id ? atualizada : e)));
      } else {
        const novaEntrada = await entradaService.registrar({
          date: formData.date,
          productId: parseInt(formData.productId, 10),
          quantity: parseInt(formData.quantity, 10),
          unitCost: parseFloat(formData.unitCost),
        });
        setEntradas(prev => [novaEntrada, ...prev]);
      }
      setIsModalOpen(false);
    } catch (error: any) {
      setErrorMessage(error?.message || 'Falha ao salvar a entrada.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatMoney = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatDate = (dateString: string) => {
    const [y, m, d] = dateString.split('-');
    return `${d}/${m}/${y}`;
  };

  const currentTotal = (parseInt(formData.quantity) || 0) * (parseFloat(formData.unitCost) || 0);

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Histórico de Entradas</h2>
        <button className="btn btn-primary" onClick={handleNewClick}>+ Registrar Entrada</button>
      </div>

      {errorMessage && (
        <div className="alert alert-danger d-flex justify-content-between align-items-center">
          <span>{errorMessage}</span>
          <button type="button" className="btn-close" onClick={() => setErrorMessage('')}></button>
        </div>
      )}

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
                <th>Ações</th>
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
                  <td>
                    {entrada.podeEditar ? (
                      <div className="action-buttons">
                        <button className="btn btn-sm btn-warning" onClick={() => handleEditClick(entrada)}>Editar</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDeleteClick(entrada)}>Excluir</button>
                      </div>
                    ) : (
                      <span
                        className="badge"
                        style={{ backgroundColor: '#adb5bd', color: '#fff', cursor: 'help' }}
                        title="Já tem produto vendido desse lote — não dá mais pra editar ou apagar. Registre uma nova entrada para corrigir."
                      >
                        🔒 Já vendido
                      </span>
                    )}
                  </td>
                </tr>
              ))}

              {entradas.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Nenhuma entrada registrada.</td>
                </tr>
              )}
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
                    {editingEntrada ? 'Editar Entrada' : 'Registrar Nova Entrada'}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setIsModalOpen(false)} />
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Data da Compra</label>
                      <input type="date" className="form-control" name="date" value={formData.date} onChange={handleInputChange} required />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Produto</label>
                      {editingEntrada ? (
                        <input type="text" className="form-control" value={editingEntrada.productName} disabled />
                      ) : (
                        <select className="form-select" name="productId" value={formData.productId} onChange={handleInputChange} required>
                          <option value="">-- Selecione o Produto --</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      )}
                      {editingEntrada && (
                        <small className="text-muted d-block mt-1">
                          Não dá pra trocar o produto de uma entrada já registrada. Selecionou o produto errado? Apague esta entrada e registre uma nova.
                        </small>
                      )}
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

                    <div className="alert alert-info py-2" style={{ backgroundColor: '#cff4fc', borderColor: '#b6effb', color: '#055160', margin: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Valor Total desta Nota:</span>
                        <strong>{formatMoney(currentTotal)}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                    <button type="submit" className="btn btn-success" disabled={isSaving}>
                      {isSaving ? 'Salvando...' : (editingEntrada ? 'Salvar Alterações' : 'Confirmar Entrada')}
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
