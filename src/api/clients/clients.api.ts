import type { Client, ClientList, RegisterPayment, ClientInput, ClientsFilter } from "./clients.types"
import { apiFetch } from '../client';
import type { Payment } from "../../types/Payment";
import type { Paginated } from "../../types/Pagination";


const ENDPOINT = "/clients";

export function getClients(filter?: ClientsFilter): Promise<Paginated<ClientList>> {
	const params = new URLSearchParams();
	if (filter?.search) params.set('search', filter.search);
	if (filter?.page) params.set('page', String(filter.page));
	if (filter?.pageSize) params.set('pageSize', String(filter.pageSize));
	if (filter?.sortBy) params.set('sortBy', filter.sortBy);
	if (filter?.sortDirection) params.set('sortDirection', filter.sortDirection);
	const query = params.toString();
	return apiFetch(`${ENDPOINT}${query ? `?${query}` : ''}`);
}

export function getClient(id: number): Promise<Client> {

	return apiFetch<Client>(`${ENDPOINT}/${id}`);
}

// POST devolve só o id do cliente (Results.Created(..., client.Id) no backend), não o objeto inteiro.
export function addClient(clientData: ClientInput): Promise<number> {
	return apiFetch(ENDPOINT, {
		method: 'POST',
		body: JSON.stringify(clientData),
	});
}

export function updateClient(id: number, clientData: ClientInput): Promise<void> {
	return apiFetch(`${ENDPOINT}/${id}`, {
		method: 'PUT',
		body: JSON.stringify(clientData),
	});
}

export function registerPayment(clientId: number, payload: RegisterPayment): Promise<Payment> {
	return apiFetch<Payment>(`${ENDPOINT}/${clientId}/payments`, {
		method: 'POST',
		body: JSON.stringify(payload),
	});
}

export function deleteClient(id: number): Promise<void> {
	return apiFetch(`${ENDPOINT}/${id}`, { method: 'DELETE' });
}