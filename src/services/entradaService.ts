import { apiFetch } from './api';

export interface Entrada {
  id: number;
  date: string;
  productId: number;
  productName: string;
  quantity: number;
  totalCost: number;
  unitCost: number;
  podeEditar: boolean;
}

export const entradaService = {
  getEntradas: (): Promise<Entrada[]> => apiFetch('/entradas'),

  registrar: (payload: {
    date: string;
    productId: number;
    quantity: number;
    unitCost: number;
  }): Promise<Entrada> =>
    apiFetch('/entradas', { method: 'POST', body: JSON.stringify(payload) }),

  atualizar: (id: number, payload: { date: string; quantity: number; unitCost: number }): Promise<Entrada> =>
    apiFetch(`/entradas/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  apagar: (id: number): Promise<void> =>
    apiFetch(`/entradas/${id}`, { method: 'DELETE' }),
};