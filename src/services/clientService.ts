import { apiFetch } from './api';

export interface DebtDetail {
  id: string;
  date: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Client {
  id: number;
  name: string;
  document: string;
  phone: string;
  email: string;
  pix: string;

  zipCode: string;
  address: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;

  notes: string;

  totalDebt: number;
  debts: DebtDetail[];
}

type ClientInput = Omit<Client, 'id' | 'totalDebt' | 'debts'>;

export const clientService = {
  getClients: (): Promise<Client[]> => apiFetch('/clients'),

  addClient: (clientData: ClientInput): Promise<Client> =>
    apiFetch('/clients', {
      method: 'POST',
      body: JSON.stringify(clientData),
    }),

  updateClient: (id: number, clientData: ClientInput): Promise<Client> =>
    apiFetch(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(clientData),
    }),

  // Novo: quita (remove) todas as dívidas do cliente de uma vez.
  quitarDivida: (id: number): Promise<Client> =>
    apiFetch(`/clients/${id}/quitar-divida`, { method: 'POST' }),
};
