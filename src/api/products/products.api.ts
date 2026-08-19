import type { Product, ProductRequest } from './products.types';
import { apiFetch } from '../client';

const ENDPOINT = '/products';

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

export function getProducts(): Promise<Product[]> {
	return apiFetch(ENDPOINT);
}

export function addProduct(product: ProductRequest): Promise<Product> {
	return apiFetch(ENDPOINT, {
		method: 'POST',
		body: toFormData(product),
	});
}

export function updateProduct(id: number, product: ProductRequest): Promise<Product> {
	return apiFetch(`${ENDPOINT}/${id}`, {
		method: 'PUT',
		body: toFormData(product),
	});
}

export function deleteProduct(id: number): Promise<void> {
	return apiFetch(`${ENDPOINT}/${id}`, { method: 'DELETE' });
}

export function removeImage(id: number): Promise<void> {
	return apiFetch(`${ENDPOINT}/${id}/image`, { method: 'DELETE' });
}
