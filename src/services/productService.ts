import { apiFetch, API_BASE_URL } from './api';

export interface Product {
  id: number;
  name: string;
  sku: string;
  costPrice: number; // Preço de custo (Custo Médio)
  sellPrice: number; // Preço final de venda
  stock: number;
  imageUrl: string | null; // caminho relativo devolvido pela API (ex: /uploads/products/3-a1b2.jpg)
}

type ProductInput = Omit<Product, 'id' | 'imageUrl'>;

export const productService = {
  getProducts: (): Promise<Product[]> => apiFetch('/products'),

  addProduct: (productData: ProductInput): Promise<Product> =>
    apiFetch('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    }),

  updateProduct: (id: number, productData: ProductInput): Promise<Product> =>
    apiFetch(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    }),

  deleteProduct: (id: number): Promise<void> =>
    apiFetch(`/products/${id}`, { method: 'DELETE' }),

  // Envia a foto do produto (arquivo escolhido da galeria ou tirado na hora)
  uploadImage: (id: number, file: File): Promise<Product> => {
    const formData = new FormData();
    formData.append('file', file);
    return apiFetch(`/products/${id}/imagem`, { method: 'POST', body: formData });
  },

  removeImage: (id: number): Promise<Product> =>
    apiFetch(`/products/${id}/imagem`, { method: 'DELETE' }),

  // A API guarda só o caminho relativo (/uploads/...) — aqui monta a URL
  // completa apontando pro servidor da API, pra usar em <img src="...">.
  getImageUrl: (product: Pick<Product, 'imageUrl'>): string | null =>
    product.imageUrl ? `${API_BASE_URL}${product.imageUrl}` : null,
};
