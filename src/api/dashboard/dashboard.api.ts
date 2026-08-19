import { apiFetch } from '../client';
import type {
  DashboardSummary,
  LowStockProduct,
  Devedor,
  ProfitPoint,
  EntregaPendente,
  TopCliente,
  TopProduto,
  EstoqueValor,
  AguardandoReposicao,
  FormaPagamento,
  EstoquePorProduto,
  SummaryPreset,
  SeriesPreset,
} from './dashboard.types';

const ENDPOINT = '/dashboard';

export function getSummary(preset: SummaryPreset, start?: string, end?: string): Promise<DashboardSummary> {
  const params = new URLSearchParams();
  if (start && end) {
    params.set('start', start);
    params.set('end', end);
  } else {
    params.set('preset', preset);
  }
  return apiFetch(`${ENDPOINT}/summary?${params.toString()}`);
}

export function getLowStock(threshold = 10): Promise<LowStockProduct[]> {
  return apiFetch(`${ENDPOINT}/low-stock?threshold=${threshold}`);
}

export function getDevedores(): Promise<Devedor[]> {
  return apiFetch(`${ENDPOINT}/devedores`);
}

export function getProfitSeries(preset: SeriesPreset): Promise<ProfitPoint[]> {
  return apiFetch(`${ENDPOINT}/profit-series?preset=${preset}`);
}

export function getEntregasPendentes(): Promise<EntregaPendente[]> {
  return apiFetch(`${ENDPOINT}/entregas-pendentes`);
}

export function getTopClientes(limit = 10): Promise<TopCliente[]> {
  return apiFetch(`${ENDPOINT}/top-clientes?limit=${limit}`);
}

export function getTopProdutos(limit = 10): Promise<TopProduto[]> {
  return apiFetch(`${ENDPOINT}/top-produtos?limit=${limit}`);
}

export function getEstoqueValor(): Promise<EstoqueValor> {
  return apiFetch(`${ENDPOINT}/estoque-valor`);
}

export function getAguardandoReposicao(): Promise<AguardandoReposicao[]> {
  return apiFetch(`${ENDPOINT}/aguardando-reposicao`);
}

export function getFormasPagamento(preset: SummaryPreset): Promise<FormaPagamento[]> {
  return apiFetch(`${ENDPOINT}/formas-pagamento?preset=${preset}`);
}

export function getEstoquePorProduto(): Promise<EstoquePorProduto[]> {
  return apiFetch(`${ENDPOINT}/estoque-por-produto`);
}
