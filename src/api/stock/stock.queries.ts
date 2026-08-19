import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEntries, getEntry, createEntry, updateEntry, deleteEntry } from './stock.api';
import type { StockEntryRequest } from './stock.types';

export const stockEntryKeys = {
	all: ['stockEntries'] as const,
	lists: () => [...stockEntryKeys.all, 'list'] as const,
	detail: (id: number) => [...stockEntryKeys.all, 'detail', id] as const,
};

export const stockEntriesQuery = () =>
	queryOptions({
		queryKey: stockEntryKeys.lists(),
		queryFn: getEntries,
	});

export const stockEntryQuery = (id: number) =>
	queryOptions({
		queryKey: stockEntryKeys.detail(id),
		queryFn: () => getEntry(id),
		enabled: Number.isFinite(id),
	});

export function useCreateStockEntry() {
	const qc = useQueryClient();

	return useMutation({
		mutationFn: (data: StockEntryRequest) => createEntry(data),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: stockEntryKeys.lists() });
		},
	});
}

export function useUpdateStockEntry() {
	const qc = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: number; data: StockEntryRequest }) => updateEntry(id, data),
		onSuccess: (updated, { id }) => {
			qc.setQueryData(stockEntryKeys.detail(id), updated);
			qc.invalidateQueries({ queryKey: stockEntryKeys.lists() });
		},
	});
}

export function useDeleteStockEntry() {
	const qc = useQueryClient();

	return useMutation({
		mutationFn: (id: number) => deleteEntry(id),
		onSuccess: (_data, id) => {
			qc.removeQueries({ queryKey: stockEntryKeys.detail(id) });
			qc.invalidateQueries({ queryKey: stockEntryKeys.lists() });
		},
	});
}
