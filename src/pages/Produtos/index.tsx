import React, { useEffect, useRef, useState } from 'react';
import { productService, type Product } from '../../services/productService';
import '../../styles/shared-tables.css';

const initialFormState = { name: '', sku: '', costPrice: '', sellPrice: '', stock: '' };

export function Produtos() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState(initialFormState);

  // --- Foto do produto ---
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => { loadProducts(); }, []);

  // Libera a URL de preview da memória quando ela muda ou o componente desmonta
  useEffect(() => {
    return () => { if (imagePreview) URL.revokeObjectURL(imagePreview); };
  }, [imagePreview]);

  async function loadProducts() {
    setIsLoading(true);
    try {
      setProducts(await productService.getProducts());
    } catch (error) {
      setErrorMessage('Não foi possível carregar os produtos.');
    } finally {
      setIsLoading(false);
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetImageState = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleNewClick = () => {
    setEditingProduct(null);
    setFormData(initialFormState);
    setErrorMessage('');
    resetImageState();
    setIsModalOpen(true);
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      costPrice: product.costPrice.toString(),
      sellPrice: product.sellPrice.toString(),
      stock: product.stock.toString(),
    });
    setErrorMessage('');
    resetImageState();
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (product: Product) => {
    const confirmado = window.confirm(
      `Apagar o produto "${product.name}"? Só é possível se ele nunca teve entrada ou venda registrada.`
    );
    if (!confirmado) return;

    setDeletingId(product.id);
    setErrorMessage('');
    try {
      await productService.deleteProduct(product.id);
      setProducts(prev => prev.filter(p => p.id !== product.id));
    } catch (error: any) {
      setErrorMessage(error?.message || 'Não foi possível apagar esse produto.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveExistingImage = async () => {
    if (!editingProduct) return;
    const confirmado = window.confirm('Remover a foto atual deste produto?');
    if (!confirmado) return;

    setIsUploadingImage(true);
    try {
      const atualizado = await productService.removeImage(editingProduct.id);
      setEditingProduct(atualizado);
      setProducts(prev => prev.map(p => (p.id === atualizado.id ? atualizado : p)));
    } catch (error: any) {
      setErrorMessage(error?.message || 'Não foi possível remover a foto.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSaving(true);
    try {
      const payload = {
        name: formData.name,
        sku: formData.sku,
        costPrice: parseFloat(formData.costPrice),
        sellPrice: parseFloat(formData.sellPrice),
        stock: parseInt(formData.stock, 10),
      };

      let produtoSalvo: Product;
      if (editingProduct) {
        produtoSalvo = await productService.updateProduct(editingProduct.id, payload);
      } else {
        produtoSalvo = await productService.addProduct(payload);
      }

      // Se uma foto nova foi escolhida, envia agora que já temos o id do produto
      if (imageFile) {
        setIsUploadingImage(true);
        try {
          produtoSalvo = await productService.uploadImage(produtoSalvo.id, imageFile);
        } catch (imgError: any) {
          // O produto já foi salvo; só a foto falhou — avisa mas não perde os dados digitados
          setErrorMessage(
            `Produto salvo, mas a foto não pôde ser enviada: ${imgError?.message || 'erro desconhecido'}`
          );
        } finally {
          setIsUploadingImage(false);
        }
      }

      setProducts(prev => {
        const existe = prev.some(p => p.id === produtoSalvo.id);
        return existe
          ? prev.map(p => (p.id === produtoSalvo.id ? produtoSalvo : p))
          : [...prev, produtoSalvo];
      });

      setIsModalOpen(false);
    } catch (error: any) {
      setErrorMessage(error?.message || 'Falha ao salvar o produto.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatMoney = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const valorTotalEmEstoque = products.reduce((acc, p) => acc + p.stock * p.costPrice, 0);

  const linhaClasse = (p: Product) => {
    if (p.stock <= 0) return 'linha-sem-estoque';
    if (p.stock <= 10) return 'linha-estoque-baixo';
    return '';
  };

  // Prioriza o preview local (foto recém-escolhida) sobre a foto já salva
  const fotoParaExibirNoModal = imagePreview || (editingProduct ? productService.getImageUrl(editingProduct) : null);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Estoque / Produtos</h2>
          {!isLoading && products.length > 0 && (
            <div className="text-muted mt-1">
              Valor investido em estoque: <strong>{formatMoney(valorTotalEmEstoque)}</strong>
            </div>
          )}
        </div>
        <button className="btn btn-primary" onClick={handleNewClick}>+ Novo Produto</button>
      </div>

      {errorMessage && (
        <div className="alert alert-danger d-flex justify-content-between align-items-center">
          <span>{errorMessage}</span>
          <button type="button" className="btn-close" onClick={() => setErrorMessage('')}></button>
        </div>
      )}

      {isLoading ? <p>Carregando...</p> : (
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th style={{ width: '64px' }}>Foto</th>
                <th>SKU</th>
                <th>Nome</th>
                <th>Estoque</th>
                <th>Preço Venda</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => {
                const imgSrc = productService.getImageUrl(product);
                return (
                  <tr key={product.id} className={linhaClasse(product)}>
                    <td>
                      {imgSrc ? (
                        <img src={imgSrc} alt={product.name} className="produto-thumb" />
                      ) : (
                        <div className="produto-thumb produto-thumb-placeholder">☕</div>
                      )}
                    </td>
                    <td><strong>{product.sku}</strong></td>
                    <td>{product.name}</td>
                    <td>
                      {product.stock <= 0 ? (
                        <span className="badge bg-danger">Sem estoque</span>
                      ) : product.stock <= 10 ? (
                        <span className="badge bg-warning text-dark">{product.stock} un (baixo)</span>
                      ) : (
                        <span>{product.stock} un</span>
                      )}
                    </td>
                    <td style={{ color: '#198754', fontWeight: '500' }}>{formatMoney(product.sellPrice)}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn btn-sm btn-warning" onClick={() => handleEditClick(product)}>Editar</button>
                        <button
                          className="btn btn-sm btn-danger"
                          disabled={deletingId === product.id}
                          onClick={() => handleDeleteClick(product)}
                        >
                          {deletingId === product.id ? 'Apagando...' : 'Excluir'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {products.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Nenhum produto cadastrado.</td>
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
                    {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setIsModalOpen(false)} />
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="modal-body">

                    {/* --- FOTO DO PRODUTO --- */}
                    <div className="mb-4 text-center">
                      <div
                        className="produto-foto-preview mx-auto mb-2"
                        onClick={() => fileInputRef.current?.click()}
                        role="button"
                      >
                        {fotoParaExibirNoModal ? (
                          <img src={fotoParaExibirNoModal} alt="Prévia do produto" />
                        ) : (
                          <span className="text-muted">📷 Toque para adicionar uma foto</span>
                        )}
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        capture="environment"
                        className="d-none"
                        onChange={handleImageSelected}
                      />

                      <div className="d-flex justify-content-center gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {fotoParaExibirNoModal ? 'Trocar Foto' : 'Adicionar Foto'}
                        </button>
                        {editingProduct?.imageUrl && !imageFile && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            disabled={isUploadingImage}
                            onClick={handleRemoveExistingImage}
                          >
                            Remover Foto
                          </button>
                        )}
                      </div>
                    </div>

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
                      <div className="mb-3" style={{ width: '120px' }}>
                        <label className="form-label">Estoque {editingProduct ? '' : 'Inicial'}</label>
                        <input type="number" className="form-control" name="stock" value={formData.stock} onChange={handleInputChange} required />
                      </div>
                    </div>
                    {editingProduct && (
                      <small className="text-muted d-block">
                        Alterar o estoque aqui não gera lote de custo (PEPS). Para registrar uma compra nova, use a tela de Entradas.
                      </small>
                    )}
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={isSaving || isUploadingImage}>
                      {isSaving ? 'Salvando...' : isUploadingImage ? 'Enviando foto...' : 'Salvar'}
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
