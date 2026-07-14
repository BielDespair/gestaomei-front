import { apiFetch } from './api';

export interface Entrada {
  id: number;
  date: string;
  productId: number;
  productName: string;
  quantity: number;
  totalCost: number;
  unitCost: number;
}

export const entradaService = {
  getEntradas: (): Promise<Entrada[]> => apiFetch('/entradas'),

  // O backend recalcula o custo médio ponderado e atualiza o estoque do
  // produto — o frontend só manda os dados brutos da compra.
  registrar: (payload: {
    date: string;
    productId: number;
    quantity: number;
    unitCost: number;
  }): Promise<Entrada> =>
    apiFetch('/entradas', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
