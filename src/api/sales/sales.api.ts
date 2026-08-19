import { apiFetch } from '../client';
import type { Sale, SaleListItem, SalesFilter } from './sales.types';

const ENDPOINT = '/sales';

export function getSales(filter?: SalesFilter): Promise<SaleListItem[]> {
  const params = new URLSearchParams();
  if (filter?.clientId) params.set('clientId', filter.clientId.toString());
  if (filter?.sellerId) params.set('sellerId', filter.sellerId.toString());
  const query = params.toString();
  return apiFetch(`${ENDPOINT}${query ? `?${query}` : ''}`);
}

export function getSale(id: number): Promise<Sale> {
  return apiFetch(`${ENDPOINT}/${id}`);
}

// TODO: backend ainda responde 501 pra POST /sales (não implementado, sem contrato de request definido).
export function createSale(payload: unknown): Promise<Sale> {
  return apiFetch(ENDPOINT, { method: 'POST', body: JSON.stringify(payload) });
}

// TODO: backend não tem mais rota dedicada de entrega; PUT /sales/{id} também ainda responde 501.
export function markAsDelivered(id: number): Promise<Sale> {
  return apiFetch(`${ENDPOINT}/${id}`, { method: 'PUT' });
}
