import './styles.css';
import React, { useEffect, useState } from 'react';
import { clientService, type Client } from '../../services/clientService';
import { cepService } from '../../services/cepService';


const initialFormState = {
  name: '', document: '', phone: '', email: '', pix: '',
  zipCode: '', address: '', number: '', neighborhood: '', city: '', state: '',
  notes: ''
};

export function Clientes() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(initialFormState);

  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  useEffect(() => { loadClients(); }, []);

  async function loadClients() {
    setIsLoading(true);
    try { setClients(await clientService.getClients()); }
    catch (error) { console.error(error); }
    finally { setIsLoading(false); }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value;
    if (cep.length >= 8) {
      setIsFetchingCep(true);
      const data = await cepService.fetchCep(cep);
      if (data) {
        setFormData(prev => ({
          ...prev,
          address: data.logradouro,
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf
        }));
      }
      setIsFetchingCep(false);
    }
  };

  const handleNewClick = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const handleEditClick = (client: Client) => {
    setEditingId(client.id);
    setFormData({
      name: client.name, document: client.document, phone: client.phone,
      email: client.email, pix: client.pix, zipCode: client.zipCode,
      address: client.address, number: client.number, neighborhood: client.neighborhood,
      city: client.city, state: client.state, notes: client.notes
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingId) {
        const updated = await clientService.updateClient(editingId, formData);
        setClients(prev => prev.map(c => c.id === editingId ? updated : c));
      } else {
        const novo = await clientService.addClient(formData);
        setClients(prev => [...prev, novo]);
      }
      setIsModalOpen(false);
    } finally { setIsSaving(false); }
  };

  const handleViewDebt = (client: Client) => {
    setSelectedClient(client);
    setIsDebtModalOpen(true);
  };

  const formatMoney = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Cadastro de Clientes</h2>
        <button className="btn btn-primary" onClick={handleNewClick}>+ Novo Cliente</button>
      </div>

      {isLoading ? <p>Carregando clientes...</p> : (
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>Nome / Contato</th>
                <th>CPF / CNPJ</th>
                <th>Bairro</th>
                <th>Observações</th>
                <th>Status / Dívida</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(client => (
                <tr key={client.id}>
                  <td>
                    <strong>{client.name}</strong>
                    <br />
                    <small style={{ color: '#6c757d' }}>{client.phone || 'Sem telefone'}</small>
                  </td>
                  <td>{client.document || '-'}</td>
                  <td>{client.neighborhood || '-'}</td>


                  <td style={{ maxWidth: '250px' }}>
                    <small style={{ color: '#495057', fontStyle: 'italic' }}>
                      {client.notes || '-'}
                    </small>
                  </td>

                  <td>
                    {client.totalDebt > 0 ? (
                      <span className="text-danger" style={{ fontWeight: 'bold' }}>
                        Devendo: {formatMoney(client.totalDebt)}
                      </span>
                    ) : (
                      <span className="badge badge-success">Em Dia</span>
                    )}
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      {client.totalDebt > 0 && (
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleViewDebt(client)}
                        >
                          Ver Débitos
                        </button>
                      )}
                      <button
                        className="btn btn-sm btn-outline-primary "
                        onClick={() => handleEditClick(client)}
                      >
                        Editar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- MODAL DE CADASTRO --- */}
      {isModalOpen && (
        <>
          <div className="modal fade show d-block" tabIndex={-1}>
            <div className="modal-dialog modal-xl">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{editingId ? 'Editar Cliente' : 'Novo Cliente'}</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setIsModalOpen(false)}
                  />
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>

                    <h6 style={{ color: '#0d6efd', marginBottom: '1rem' }}>Dados Básicos</h6>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                      <div style={{ flex: 2 }}>
                        <label className="form-label">Nome Completo *</label>
                        <input type="text" className="form-control" name="name" value={formData.name} onChange={handleInputChange} required />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="form-label">CPF / CNPJ</label>
                        <input type="text" className="form-control" name="document" value={formData.document} onChange={handleInputChange} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div style={{ flex: 1 }}>
                        <label className="form-label">Telefone / WhatsApp</label>
                        <input type="text" className="form-control" name="phone" value={formData.phone} onChange={handleInputChange} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="form-label">E-mail</label>
                        <input type="email" className="form-control" name="email" value={formData.email} onChange={handleInputChange} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="form-label">Chave PIX</label>
                        <input type="text" className="form-control" name="pix" value={formData.pix} onChange={handleInputChange} />
                      </div>
                    </div>

                    <hr style={{ borderColor: '#dee2e6', margin: '1.5rem 0' }} />

                    <h6 style={{ color: '#0d6efd', marginBottom: '1rem' }}>Endereço</h6>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                      <div style={{ width: '150px' }}>
                        <label className="form-label">CEP</label>
                        <input
                          type="text"
                          className="form-control"
                          name="zipCode"
                          value={formData.zipCode}
                          onChange={handleInputChange}
                          onBlur={handleCepBlur}
                          placeholder="Somente números"
                        />
                        {isFetchingCep && <small className="text-info">Buscando...</small>}
                      </div>
                      <div style={{ flex: 2 }}>
                        <label className="form-label">Endereço (Rua/Av)</label>
                        <input type="text" className="form-control" name="address" value={formData.address} onChange={handleInputChange} />
                      </div>
                      <div style={{ width: '100px' }}>
                        <label className="form-label">Número</label>
                        <input type="text" className="form-control" name="number" value={formData.number} onChange={handleInputChange} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div style={{ flex: 1 }}>
                        <label className="form-label">Bairro</label>
                        <input type="text" className="form-control" name="neighborhood" value={formData.neighborhood} onChange={handleInputChange} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="form-label">Cidade</label>
                        <input type="text" className="form-control" name="city" value={formData.city} onChange={handleInputChange} />
                      </div>
                      <div style={{ width: '80px' }}>
                        <label className="form-label">UF</label>
                        <input type="text" className="form-control" name="state" value={formData.state} onChange={handleInputChange} maxLength={2} />
                      </div>
                    </div>

                    <hr style={{ borderColor: '#dee2e6', margin: '1.5rem 0' }} />

                    <div className="mb-3">
                      <label className="form-label" style={{ color: '#0d6efd', fontWeight: 500 }}>Observações Internas (Como identificar o cliente)</label>
                      <textarea className="form-control" name="notes" value={formData.notes} onChange={handleInputChange} rows={2} placeholder="Ex: Primo do Carlos, dono da padaria da esquina..." />
                    </div>

                  </div>

                  <div className="modal-footer" style={{ borderTop: '1px solid #dee2e6', backgroundColor: '#f8f9fa' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                    <button type="submit" className="btn btn-primary" disabled={isSaving}>Salvar Cliente</button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show"></div>
        </>
      )}

      {/* --- MODAL DE DÍVIDAS --- */}
      {isDebtModalOpen && selectedClient && (
        <>
          <div className="modal fade show d-block" tabIndex={-1}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Débitos: {selectedClient.name}</h5>
                  <button type="button" className="btn-close" onClick={() => setIsDebtModalOpen(false)}>&times;</button>
                </div>
                <div className="modal-body">
                  <div className="table-responsive">
                    <table className="table table-striped">
                      <thead>
                        <tr>
                          <th>Data</th>
                          <th>Produto</th>
                          <th>Qtd</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedClient.debts.map(debt => (
                          <tr key={debt.id}>
                            <td>{debt.date}</td>
                            <td>{debt.productName}</td>
                            <td>{debt.quantity}</td>
                            <td>{formatMoney(debt.totalPrice)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={3} style={{ textAlign: 'right', fontWeight: 'bold' }}>Dívida Total:</td>
                          <td className="text-danger" style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                            {formatMoney(selectedClient.totalDebt)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setIsDebtModalOpen(false)}>Fechar</button>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show"></div>
        </>
      )}
    </div>
  );
}