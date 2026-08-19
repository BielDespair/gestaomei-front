import type { Client, ClientList, RegisterPayment, ClientInput } from "./clients.types"
import { apiFetch } from '../client';
import type { Payment } from "../../types/payment";


const ENDPOINT = "/clients";

export function getClients(): Promise<ClientList[]> {
	console.log("Get clients chamado");
	return apiFetch<ClientList[]>(ENDPOINT);
}

export function getClient(id: number): Promise<Client> {

	return apiFetch<Client>(`${ENDPOINT}/${id}`);
}

export function addClient(clientData: ClientInput): Promise<Client> {
	return apiFetch(ENDPOINT, {
		method: 'POST',
		body: JSON.stringify(clientData),
	});
}

export function updateClient(id: number, clientData: ClientInput): Promise<Client> {
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

export function deleteClient(id: number): Promise<Client> {
	return apiFetch(`${ENDPOINT}/${id}`, { method: 'DELETE' });
}