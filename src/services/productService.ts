import { apiFetch } from './api';

export interface Product {
  id: number;
  name: string;
  sku: string;
  costPrice: number; // Preço de custo (Custo Médio)
  sellPrice: number; // Preço final de venda
  stock: number;
}

type ProductInput = Omit<Product, 'id'>;

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

  // Novo: a API já suporta exclusão (o botão "Excluir" em Produtos ainda não
  // está ligado a nada — é só chamar productService.deleteProduct(id) nele).
  deleteProduct: (id: number): Promise<void> =>
    apiFetch(`/products/${id}`, { method: 'DELETE' }),

  // NOTA: registerEntry saiu daqui — o cálculo de custo médio agora acontece
  // no backend, dentro de POST /entradas (veja entradaService.registrar).
};
