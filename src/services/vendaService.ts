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

export const vendaService = {
  getVendas: (): Promise<Venda[]> => apiFetch('/vendas'),

  // Baixa de estoque + lançamento de fiado (se houver) acontecem numa única
  // transação no backend — se algo falhar no meio, nada fica gravado pela metade.
  registrarVenda: (payload: Omit<Venda, 'id'>): Promise<Venda> =>
    apiFetch('/vendas', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
