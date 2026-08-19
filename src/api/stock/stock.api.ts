import type {
	StockEntry,
	StockEntryList,
	StockEntryRequest,
} from './stock.types';
import { apiFetch } from '../client';

const ENDPOINT = '/stock/entries';

export function getEntries(): Promise<StockEntryList[]> {
	return apiFetch(ENDPOINT);
}

export function getEntry(id: number): Promise<StockEntry> {
	return apiFetch(`${ENDPOINT}/${id}`);
}

export function createEntry(data: StockEntryRequest): Promise<StockEntry> {
	return apiFetch(ENDPOINT, {
		method: 'POST',
		body: JSON.stringify(data),
	});
}

export function updateEntry(id: number, data: StockEntryRequest): Promise<StockEntry> {
	return apiFetch(`${ENDPOINT}/${id}`, {
		method: 'PUT',
		body: JSON.stringify(data),
	});
}

export function deleteEntry(id: number): Promise<void> {
	return apiFetch(`${ENDPOINT}/${id}`, { method: 'DELETE' });
}
