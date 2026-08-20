import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSales, getSale, createSale, markAsDelivered } from './sales.api';

export const salesKeys = {
  all: ['sales'] as const,
  byClient: (clientId: number) => [...salesKeys.all, 'client', clientId] as const,
  detail: (saleId: number) => [...salesKeys.all, 'detail', saleId] as const,
};

export const salesQuery = () =>
  queryOptions({
    queryKey: salesKeys.all,
    queryFn: () => getSales(),
  });

export const salesByClientQuery = (clientId: number) =>
  queryOptions({
    queryKey: salesKeys.byClient(clientId),
    queryFn: () => getSales({ clientId }),
    enabled: Number.isFinite(clientId),
  });

export const saleDetailQuery = (saleId: number) =>
  queryOptions({
    queryKey: salesKeys.detail(saleId),
    queryFn: () => getSale(saleId),
    enabled: Number.isFinite(saleId),
  });

export function useCreateSale() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: unknown) => createSale(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: salesKeys.all });
    },
  });
}

export function useMarkAsDelivered() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => markAsDelivered(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: salesKeys.all });
    },
  });
}
