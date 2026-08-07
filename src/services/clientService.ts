import type { Client, ClientList, RegisterPayment } from '../types/api/Client';
import type { Payment } from '../types/models/Payment';
import { apiFetch } from './api';


const ENDPOINT = "/clients";



type ClientInput = Omit<Client, 'id' | 'debts'>;

export const clientService = {
	getClients: async (): Promise<ClientList[]> => {
		const clients = await apiFetch<ClientList[]>(ENDPOINT);

		return clients;
	},

	getClient: async (id: number): Promise<Client> => {
		const client = await apiFetch<Client>(`${ENDPOINT}/${id}`);
		return client;

	},

	addClient: (clientData: ClientInput): Promise<Client> =>
		apiFetch(ENDPOINT, {
			method: 'POST',
			body: JSON.stringify(clientData),
		}),

	updateClient: (id: number, clientData: ClientInput): Promise<Client> =>
		apiFetch(`${ENDPOINT}/${id}`, {
			method: 'PUT',
			body: JSON.stringify(clientData),
		}),

	registerPayment: async (clientId: number, payload: RegisterPayment): Promise<Payment> => {
		const response = await apiFetch<Payment>(`${ENDPOINT}/${clientId}/payments`, {
			method: 'POST',
			body: JSON.stringify(payload),
		});

		return response;
	},

	deleteClient: (id: number): Promise<Client> => apiFetch(`${ENDPOINT}/${id}`, { method: 'DELETE' }),
};
