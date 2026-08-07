import type { Product } from '../types/api/Product';
import { apiFetch } from './api';

interface ProductRequest extends Omit<Product, "id" | "stock" | "costPrice" | "imageUrl"> {
  imageFile?: File | null;
}

export const productService = {
  getProducts: (): Promise<Product[]> =>
    apiFetch('/products'),

  addProduct: (product: ProductRequest): Promise<Product> => {
    const formData = new FormData();

    formData.append("name", product.name);
    formData.append("description", product.description)
    formData.append("sku", product.sku);
    formData.append("sellPrice", product.sellPrice.toString());

    if (product.imageFile) {
      formData.append("image", product.imageFile);
    }

    return apiFetch('/products', {
      method: 'POST',
      body: formData,
    });
  },

  updateProduct: (id: number, product: ProductRequest): Promise<Product> => {
    const formData = new FormData();

    formData.append("name", product.name);
    formData.append("description", product.description)
    formData.append("sku", product.sku);
    formData.append("sellPrice", product.sellPrice.toString());

    if (product.imageFile) {
      formData.append("image", product.imageFile);
    }

    return apiFetch(`/products/${id}`, {
      method: 'PUT',
      body: formData,
    });
  },

  deleteProduct: (id: number): Promise<void> =>
    apiFetch(`/products/${id}`, {
      method: 'DELETE',
    }),
};