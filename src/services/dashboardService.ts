import { apiFetch } from './api';

export interface DashboardSummary {
  startDate: string;
  endDate: string;
  revenue: number;
  cost: number;
  profit: number;
  pendingCostRevenue: number;
  salesCount: number;
  unitsSold: number;
  averageTicket: number;
}

export interface LowStockProduct {
  id: number;
  name: string;
  sku: string;
  stock: number;
  sellPrice: number;
  status: 'SEM_ESTOQUE' | 'BAIXO';
}

export interface DividaDetalhe {
  id: string;
  date: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Devedor {
  id: number;
  name: string;
  phone: string;
  notes: string;
  totalDebt: number;
  oldestDebtDate: string | null;
  debts: DividaDetalhe[];
}

export interface ProfitPoint {
  label: string;
  revenue: number;
  cost: number;
  profit: number;
}

export interface EntregaPendente {
  id: number;
  date: string;
  clientId: number | null;
  clientName: string;
  clientPhone: string;
  totalValue: number;
  itemsSummary: string;
}

export interface TopCliente {
  id: number;
  name: string;
  phone: string;
  notes: string;
  totalComprado: number;
  quantidadeCompras: number;
  ultimaCompra: string | null;
}

export interface TopProduto {
  productId: number;
  productName: string;
  quantidadeVendida: number;
  faturamento: number;
  lucro: number;
}

export interface EstoqueValor {
  unidadesEmEstoque: number;
  valorInvestido: number;
}

export interface AguardandoReposicao {
  productId: number;
  productName: string;
  quantidadePendente: number;
  clientes: string[];
}

export interface FormaPagamento {
  metodo: string;
  total: number;
  quantidade: number;
}

export interface EstoquePorProduto {
  productName: string;
  valor: number;
}

export type SummaryPreset =
  | 'today' | '7d' | '30d' | 'this_week' | 'last_week' | 'this_month' | 'last_month';
export type SeriesPreset = '7d' | '30d' | '12m';

export const dashboardService = {
  getSummary: (preset: SummaryPreset, start?: string, end?: string): Promise<DashboardSummary> => {
    const params = new URLSearchParams();
    if (start && end) {
      params.set('start', start);
      params.set('end', end);
    } else {
      params.set('preset', preset);
    }
    return apiFetch(`/dashboard/summary?${params.toString()}`);
  },

  getLowStock: (threshold = 10): Promise<LowStockProduct[]> =>
    apiFetch(`/dashboard/low-stock?threshold=${threshold}`),

  getDevedores: (): Promise<Devedor[]> => apiFetch('/dashboard/devedores'),

  getProfitSeries: (preset: SeriesPreset): Promise<ProfitPoint[]> =>
    apiFetch(`/dashboard/profit-series?preset=${preset}`),

  getEntregasPendentes: (): Promise<EntregaPendente[]> =>
    apiFetch('/dashboard/entregas-pendentes'),

  getTopClientes: (limit = 10): Promise<TopCliente[]> =>
    apiFetch(`/dashboard/top-clientes?limit=${limit}`),

  getTopProdutos: (limit = 10): Promise<TopProduto[]> =>
    apiFetch(`/dashboard/top-produtos?limit=${limit}`),

  getEstoqueValor: (): Promise<EstoqueValor> =>
    apiFetch('/dashboard/estoque-valor'),

  getAguardandoReposicao: (): Promise<AguardandoReposicao[]> =>
    apiFetch('/dashboard/aguardando-reposicao'),

  getFormasPagamento: (preset: SummaryPreset): Promise<FormaPagamento[]> =>
    apiFetch(`/dashboard/formas-pagamento?preset=${preset}`),

  getEstoquePorProduto: (): Promise<EstoquePorProduto[]> =>
    apiFetch('/dashboard/estoque-por-produto'),
};
