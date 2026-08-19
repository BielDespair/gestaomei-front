import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts, addProduct, updateProduct, deleteProduct, removeImage } from './products.api';
import type { ProductRequest } from './products.types';

export const productKeys = {
	all: ['products'] as const,
	lists: () => [...productKeys.all, 'list'] as const,
};

export const productsQuery = () =>
	queryOptions({
		queryKey: productKeys.lists(),
		queryFn: getProducts,
	});

export function useAddProduct() {
	const qc = useQueryClient();

	return useMutation({
		mutationFn: (data: ProductRequest) => addProduct(data),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: productKeys.lists() });
		},
	});
}

export function useUpdateProduct() {
	const qc = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: number; data: ProductRequest }) => updateProduct(id, data),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: productKeys.lists() });
		},
	});
}

export function useDeleteProduct() {
	const qc = useQueryClient();

	return useMutation({
		mutationFn: (id: number) => deleteProduct(id),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: productKeys.lists() });
		},
	});
}

export function useRemoveProductImage() {
	const qc = useQueryClient();

	return useMutation({
		mutationFn: (id: number) => removeImage(id),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: productKeys.lists() });
		},
	});
}
