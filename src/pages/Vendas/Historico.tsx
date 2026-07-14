import { useEffect, useState, useCallback } from 'react';
import { vendaService, type Venda } from '../../services/vendaService';

type PeriodoPreset = 'hoje' | '7d' | '30d' | 'tudo';

const PRESETS: { value: PeriodoPreset; label: string }[] = [
  { value: 'hoje', label: 'Hoje' },
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: 'tudo', label: 'Tudo' },
];

const formatMoney = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatDateBR = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

function resolveRange(preset: PeriodoPreset): { start?: string; end?: string } {
  const today = new Date();
  const toIso = (d: Date) => d.toISOString().split('T')[0];

  if (preset === 'tudo') return {};
  if (preset === 'hoje') return { start: toIso(today), end: toIso(today) };

  const dias = preset === '7d' ? 6 : 29;
  const inicio = new Date(today);
  inicio.setDate(inicio.getDate() - dias);
  return { start: toIso(inicio), end: toIso(today) };
}

export function HistoricoVendas() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [preset, setPreset] = useState<PeriodoPreset>('30d');
  const [busca, setBusca] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const load = useCallback(async (p: PeriodoPreset) => {
    setIsLoading(true);
    try {
      const { start, end } = resolveRange(p);
      const data = await vendaService.getVendas({ start, end });
      setVendas(data);
    } catch {
      setErrorMessage('Não foi possível carregar o histórico de vendas.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(preset); }, [preset, load]);

  const termo = busca.trim().toLowerCase();
  const vendasFiltradas = termo
    ? vendas.filter(v =>
        v.clientName.toLowerCase().includes(termo) ||
        v.items.some(i => i.productName.toLowerCase().includes(termo))
      )
    : vendas;

  return (
    <div>
      {errorMessage && (
        <div className="alert alert-danger d-flex justify-content-between align-items-center">
          <span>{errorMessage}</span>
          <button type="button" className="btn-close" onClick={() => setErrorMessage('')}></button>
        </div>
      )}

      <div className="d-flex flex-wrap gap-2 mb-3">
        {PRESETS.map(p => (
          <button
            key={p.value}
            type="button"
            className={`btn ${preset === p.value ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setPreset(p.value)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <input
        type="text"
        className="form-control form-control-lg mb-3"
        placeholder="🔍 Buscar por cliente ou produto..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      {isLoading ? (
        <div className="text-center text-muted py-5">Carregando...</div>
      ) : vendasFiltradas.length === 0 ? (
        <div className="text-center text-muted py-5 fs-5">Nenhuma venda encontrada nesse período.</div>
      ) : (
        <div className="list-group">
          {vendasFiltradas.map(v => (
            <div key={v.id} className="list-group-item p-3">
              <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                <div>
                  <div className="fw-bold fs-5">{v.clientName}</div>
                  <div className="text-muted small">{formatDateBR(v.date)}</div>
                </div>
                <div className="d-flex gap-2">
                  <span className={`badge ${v.isPaid ? 'bg-success' : 'bg-danger'}`}>
                    {v.isPaid ? `Pago (${v.paymentMethod})` : 'Fiado'}
                  </span>
                  <span className={`badge ${v.deliveryStatus === 'ENTREGUE' ? 'bg-primary' : 'bg-warning text-dark'}`}>
                    {v.deliveryStatus === 'ENTREGUE' ? 'Entregue' : 'Pendente'}
                  </span>
                </div>
              </div>

              <ul className="mt-2 mb-2 ps-3">
                {v.items.map((item, i) => (
                  <li key={i} className="text-muted">
                    {item.quantity}x {item.productName} — {formatMoney(item.totalPrice)}
                  </li>
                ))}
              </ul>

              <div className="text-end fw-bold fs-5">{formatMoney(v.totalValue)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}