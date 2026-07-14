import { apiFetch } from './api';

export interface VendaItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Venda {
  id: number;
  date: string;
  clientId: number | null;
  clientName: string;
  items: VendaItem[];
  totalValue: number;
  isPaid: boolean;
  paymentMethod: 'PIX' | 'DINHEIRO' | 'CARTAO' | '';
  deliveryStatus: 'ENTREGUE' | 'PENDENTE';
}

export interface VendasFiltro {
  start?: string;
  end?: string;
  clientId?: number;
}

export const vendaService = {
  getVendas: (filtro?: VendasFiltro): Promise<Venda[]> => {
    const params = new URLSearchParams();
    if (filtro?.start) params.set('start', filtro.start);
    if (filtro?.end) params.set('end', filtro.end);
    if (filtro?.clientId) params.set('client_id', filtro.clientId.toString());
    const query = params.toString();
    return apiFetch(`/vendas${query ? `?${query}` : ''}`);
  },

  registrarVenda: (payload: Omit<Venda, 'id'>): Promise<Venda> =>
    apiFetch('/vendas', { method: 'POST', body: JSON.stringify(payload) }),

  marcarComoEntregue: (id: number): Promise<Venda> =>
    apiFetch(`/vendas/${id}/entregar`, { method: 'PATCH' }),
};