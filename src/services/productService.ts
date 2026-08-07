import type { Product } from '../types/api/Product';
import { apiFetch } from './api';

const ENDPOINT = '/products';

export interface ProductRequest extends Omit<Product, 'id' | 'stock' | 'costPrice' | 'imageUrl' | 'stockQuantity'> {
	imageFile?: File | null;
}

function toFormData(product: ProductRequest): FormData {
	const formData = new FormData();

	formData.append('name', product.name);
	formData.append('description', product.description ?? '');
	formData.append('sku', product.sku);
	formData.append('sellPrice', String(product.sellPrice));

	if (product.imageFile) {
		formData.append('image', product.imageFile);
	}

	return formData;
}

export const productService = {
	getProducts: (): Promise<Product[]> =>
		apiFetch(ENDPOINT),

	addProduct: (product: ProductRequest): Promise<Product> =>
		apiFetch(ENDPOINT, {
			method: 'POST',
			body: toFormData(product),
		}),

	updateProduct: (id: number, product: ProductRequest): Promise<Product> =>
		apiFetch(`${ENDPOINT}/${id}`, {
			method: 'PUT',
			body: toFormData(product),
		}),

	deleteProduct: (id: number): Promise<void> =>
		apiFetch(`${ENDPOINT}/${id}`, { method: 'DELETE' }),

	removeImage: (id: number): Promise<Product> =>
		apiFetch(`${ENDPOINT}/${id}/image`, { method: 'DELETE' }),
};