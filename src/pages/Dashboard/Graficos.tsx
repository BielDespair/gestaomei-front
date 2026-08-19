import { useState } from 'react';
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { profitSeriesQuery, topProdutosQuery, formasPagamentoQuery, estoquePorProdutoQuery } from '../../api/dashboard/dashboard.queries';
import type { SeriesPreset } from '../../api/dashboard/dashboard.types';

const SERIES_PRESETS: { value: SeriesPreset; label: string }[] = [
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: '12m', label: '12 meses' },
];


const formatMoney = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatLabel = (label: string) => {
  if (label.length === 7) {
    const [y, m] = label.split('-');
    return `${m}/${y.slice(2)}`;
  }
  const parts = label.split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}` : label;
};



export function Graficos() {
  const [seriesPreset, setSeriesPreset] = useState<SeriesPreset>('7d');

  const { data: profitSeries = [], isPending: isLoadingSeries, isError: isErrorSeries } = useQuery(profitSeriesQuery(seriesPreset));
  const { isError: isErrorResto } = useQuery(topProdutosQuery(8));
  useQuery(formasPagamentoQuery('this_month'));
  useQuery(estoquePorProdutoQuery());

  return (
    <div>
      {(isErrorSeries || isErrorResto) && (
        <div className="alert alert-danger d-flex justify-content-between align-items-center">
          <span>Não foi possível carregar os gráficos.</span>
        </div>
      )}

      <h5 className="fw-bold mt-2 mb-3 pb-2 border-bottom">Evolução do lucro</h5>
      <div className="d-flex justify-content-end mb-2">
        <div className="btn-group">
          {SERIES_PRESETS.map(p => (
            <button
              key={p.value}
              type="button"
              className={`btn btn-sm ${seriesPreset === p.value ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setSeriesPreset(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          {isLoadingSeries ? (
            <div className="text-center text-muted py-5">Carregando...</div>
          ) : profitSeries.length === 0 ? (
            <div className="text-center text-muted py-5">Sem vendas nesse período.</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={profitSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tickFormatter={formatLabel}
                  fontSize={12}
                />

                <YAxis
                  tickFormatter={(v) => formatMoney(v)}
                  width={90}
                  fontSize={12}
                />

                <Tooltip
                  formatter={(value) => formatMoney(Number(value ?? 0))}
                  labelFormatter={(label) => formatLabel(String(label ?? ''))}
                />

                <Line
                  type="monotone"
                  dataKey="profit"
                  name="Lucro"
                  stroke="#198754"
                  strokeWidth={3}
                  dot
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
      <div className="col-lg-6">
      </div>
    </div>
  );
}
