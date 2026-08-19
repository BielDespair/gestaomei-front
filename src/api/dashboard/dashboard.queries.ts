import { queryOptions } from '@tanstack/react-query';
import {
  getSummary,
  getLowStock,
  getDevedores,
  getProfitSeries,
  getEntregasPendentes,
  getTopClientes,
  getTopProdutos,
  getEstoqueValor,
  getAguardandoReposicao,
  getFormasPagamento,
  getEstoquePorProduto,
} from './dashboard.api';
import type { SummaryPreset, SeriesPreset } from './dashboard.types';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: (preset: SummaryPreset) => [...dashboardKeys.all, 'summary', preset] as const,
  lowStock: (threshold: number) => [...dashboardKeys.all, 'low-stock', threshold] as const,
  devedores: () => [...dashboardKeys.all, 'devedores'] as const,
  profitSeries: (preset: SeriesPreset) => [...dashboardKeys.all, 'profit-series', preset] as const,
  entregasPendentes: () => [...dashboardKeys.all, 'entregas-pendentes'] as const,
  topClientes: (limit: number) => [...dashboardKeys.all, 'top-clientes', limit] as const,
  topProdutos: (limit: number) => [...dashboardKeys.all, 'top-produtos', limit] as const,
  estoqueValor: () => [...dashboardKeys.all, 'estoque-valor'] as const,
  aguardandoReposicao: () => [...dashboardKeys.all, 'aguardando-reposicao'] as const,
  formasPagamento: (preset: SummaryPreset) => [...dashboardKeys.all, 'formas-pagamento', preset] as const,
  estoquePorProduto: () => [...dashboardKeys.all, 'estoque-por-produto'] as const,
};

export const summaryQuery = (preset: SummaryPreset) =>
  queryOptions({
    queryKey: dashboardKeys.summary(preset),
    queryFn: () => getSummary(preset),
  });

export const lowStockQuery = (threshold = 10) =>
  queryOptions({
    queryKey: dashboardKeys.lowStock(threshold),
    queryFn: () => getLowStock(threshold),
  });

export const devedoresQuery = () =>
  queryOptions({
    queryKey: dashboardKeys.devedores(),
    queryFn: getDevedores,
  });

export const profitSeriesQuery = (preset: SeriesPreset) =>
  queryOptions({
    queryKey: dashboardKeys.profitSeries(preset),
    queryFn: () => getProfitSeries(preset),
  });

export const entregasPendentesQuery = () =>
  queryOptions({
    queryKey: dashboardKeys.entregasPendentes(),
    queryFn: getEntregasPendentes,
  });

export const topClientesQuery = (limit = 10) =>
  queryOptions({
    queryKey: dashboardKeys.topClientes(limit),
    queryFn: () => getTopClientes(limit),
  });

export const topProdutosQuery = (limit = 10) =>
  queryOptions({
    queryKey: dashboardKeys.topProdutos(limit),
    queryFn: () => getTopProdutos(limit),
  });

export const estoqueValorQuery = () =>
  queryOptions({
    queryKey: dashboardKeys.estoqueValor(),
    queryFn: getEstoqueValor,
  });

export const aguardandoReposicaoQuery = () =>
  queryOptions({
    queryKey: dashboardKeys.aguardandoReposicao(),
    queryFn: getAguardandoReposicao,
  });

export const formasPagamentoQuery = (preset: SummaryPreset) =>
  queryOptions({
    queryKey: dashboardKeys.formasPagamento(preset),
    queryFn: () => getFormasPagamento(preset),
  });

export const estoquePorProdutoQuery = () =>
  queryOptions({
    queryKey: dashboardKeys.estoquePorProduto(),
    queryFn: getEstoquePorProduto,
  });
