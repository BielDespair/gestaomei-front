import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  dashboardService,
  type DashboardSummary,
  type LowStockProduct,
  type Devedor,
  type ProfitPoint,
  type EntregaPendente,
  type TopCliente,
  type TopProduto,
  type SummaryPreset,
  type SeriesPreset,
} from '../../services/dashboardService';
import { vendaService } from '../../services/vendaService';
import './styles.css';

type Aba = 'pendencias' | 'negocio';

const SUMMARY_PRESETS: { value: SummaryPreset; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'this_week', label: 'Esta Semana' },
  { value: 'this_month', label: 'Este Mês' },
  { value: 'last_month', label: 'Mês Passado' },
];

const SERIES_PRESETS: { value: SeriesPreset; label: string }[] = [
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: '12m', label: '12 meses' },
];

const formatMoney = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatDateBR = (iso: string) => {
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  const [y, m, d] = parts;
  return `${d}/${m}/${y}`;
};

const onlyDigits = (value: string) => value.replace(/\D/g, '');

function TelefoneLink({ phone }: { phone: string }) {
  if (!phone) return <span className="text-muted">Sem telefone</span>;
  return (
    <a href={`tel:${onlyDigits(phone)}`} className="link-primary text-decoration-none">
      📞 {phone}
    </a>
  );
}

function ProfitChart({ data }: { data: ProfitPoint[] }) {
  if (data.length === 0) {
    return <div className="text-center text-muted py-5">Sem vendas nesse período.</div>;
  }

  const width = 700;
  const height = 220;
  const paddingLeft = 8;
  const paddingBottom = 26;
  const chartWidth = width - paddingLeft - 8;
  const chartHeight = height - paddingBottom - 14;
  const zeroY = 10 + chartHeight / 2;

  const maxAbs = Math.max(1, ...data.map(d => Math.abs(d.profit)));
  const barWidth = chartWidth / data.length;

  const labelIndexes = Array.from(
    new Set([0, Math.floor((data.length - 1) / 2), data.length - 1])
  );

  const formatLabel = (label: string) => {
    if (label.length === 7) {
      const [y, m] = label.split('-');
      return `${m}/${y.slice(2)}`;
    }
    const parts = label.split('-');
    return `${parts[2]}/${parts[1]}`;
  };

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="profit-chart-svg" role="img">
      <line x1={paddingLeft} y1={zeroY} x2={width - 4} y2={zeroY} stroke="var(--bs-border-color)" strokeWidth={1} />
      {data.map((d, i) => {
        const barHeight = Math.max((Math.abs(d.profit) / maxAbs) * (chartHeight / 2 - 6), d.profit === 0 ? 0 : 2);
        const x = paddingLeft + i * barWidth + barWidth * 0.18;
        const w = Math.max(barWidth * 0.64, 1);
        const y = d.profit >= 0 ? zeroY - barHeight : zeroY;
        const color = d.profit >= 0 ? '#198754' : '#dc3545';
        return (
          <rect key={d.label} x={x} y={y} width={w} height={barHeight} fill={color} rx={2}>
            <title>{`${formatLabel(d.label)}: ${formatMoney(d.profit)}`}</title>
          </rect>
        );
      })}
      {labelIndexes.map(i => (
        <text key={i} x={paddingLeft + i * barWidth + barWidth / 2} y={height - 6} fontSize={11} textAnchor="middle" fill="var(--bs-secondary-color)">
          {formatLabel(data[i].label)}
        </text>
      ))}
    </svg>
  );
}

export function Dashboard() {
  const [aba, setAba] = useState<Aba>('pendencias');
  const [errorMessage, setErrorMessage] = useState('');

  // --- Pendências ---
  const [devedores, setDevedores] = useState<Devedor[]>([]);
  const [entregasPendentes, setEntregasPendentes] = useState<EntregaPendente[]>([]);
  const [lowStockPreview, setLowStockPreview] = useState<LowStockProduct[]>([]);
  const [isLoadingPendencias, setIsLoadingPendencias] = useState(true);
  const [entregandoIds, setEntregandoIds] = useState<Set<number>>(new Set());
  const [devedorAberto, setDevedorAberto] = useState<number | null>(null);

  // --- Meu Negócio ---
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [profitSeries, setProfitSeries] = useState<ProfitPoint[]>([]);
  const [topClientes, setTopClientes] = useState<TopCliente[]>([]);
  const [topProdutos, setTopProdutos] = useState<TopProduto[]>([]);
  const [summaryPreset, setSummaryPreset] = useState<SummaryPreset>('this_month');
  const [seriesPreset, setSeriesPreset] = useState<SeriesPreset>('30d');
  const [isLoadingNegocio, setIsLoadingNegocio] = useState(true);

  const loadPendencias = useCallback(async () => {
    setIsLoadingPendencias(true);
    try {
      const [devedoresData, entregasData, lowStockData] = await Promise.all([
        dashboardService.getDevedores(),
        dashboardService.getEntregasPendentes(),
        dashboardService.getLowStock(10),
      ]);
      setDevedores(devedoresData);
      setEntregasPendentes(entregasData);
      setLowStockPreview(lowStockData.slice(0, 5));
    } catch {
      setErrorMessage('Não foi possível carregar as pendências.');
    } finally {
      setIsLoadingPendencias(false);
    }
  }, []);

  const loadNegocio = useCallback(async (sPreset: SummaryPreset, gPreset: SeriesPreset) => {
    setIsLoadingNegocio(true);
    try {
      const [summaryData, seriesData, clientesData, produtosData] = await Promise.all([
        dashboardService.getSummary(sPreset),
        dashboardService.getProfitSeries(gPreset),
        dashboardService.getTopClientes(10),
        dashboardService.getTopProdutos(10),
      ]);
      setSummary(summaryData);
      setProfitSeries(seriesData);
      setTopClientes(clientesData);
      setTopProdutos(produtosData);
    } catch {
      setErrorMessage('Não foi possível carregar as informações do negócio.');
    } finally {
      setIsLoadingNegocio(false);
    }
  }, []);

  useEffect(() => { loadPendencias(); }, [loadPendencias]);
  useEffect(() => { if (aba === 'negocio') loadNegocio(summaryPreset, seriesPreset); }, [aba, summaryPreset, seriesPreset, loadNegocio]);

  const handleMarcarEntregue = async (id: number) => {
    setEntregandoIds(prev => new Set(prev).add(id));
    try {
      await vendaService.marcarComoEntregue(id);
      setEntregasPendentes(prev => prev.filter(e => e.id !== id));
    } catch {
      setErrorMessage('Não foi possível marcar essa entrega como recebida. Tente de novo.');
    } finally {
      setEntregandoIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const totalPendente = devedores.reduce((acc, d) => acc + d.totalDebt, 0);

  return (
    <div className="container-fluid px-3 px-lg-4 py-3 py-lg-4 dashboard-tela">
      <h2 className="fw-bold mb-3">Visão Geral</h2>

      {errorMessage && (
        <div className="alert alert-danger d-flex justify-content-between align-items-center">
          <span>{errorMessage}</span>
          <button type="button" className="btn-close" onClick={() => setErrorMessage('')}></button>
        </div>
      )}

      <div className="d-flex flex-wrap gap-2 mb-4 abas-dashboard">
        <button
          type="button"
          className={`btn btn-lg fw-semibold flex-grow-1 flex-lg-grow-0 ${aba === 'pendencias' ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => setAba('pendencias')}
        >
          🔔 Pendências
          {(devedores.length + entregasPendentes.length) > 0 && (
            <span className="badge bg-danger rounded-pill ms-2">{devedores.length + entregasPendentes.length}</span>
          )}
        </button>
        <button
          type="button"
          className={`btn btn-lg fw-semibold flex-grow-1 flex-lg-grow-0 ${aba === 'negocio' ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => setAba('negocio')}
        >
          📊 Meu Negócio
        </button>
      </div>

      {/* ================= ABA: PENDÊNCIAS ================= */}
      {aba === 'pendencias' && (
        <div className="row g-3">
          <div className="col-lg-6">
            <div className="card shadow-sm h-100">
              <div className="card-header bg-white d-flex justify-content-between align-items-center">
                <span className="fw-semibold fs-5">Quem está devendo</span>
                {totalPendente > 0 && <span className="badge bg-danger fs-6">{formatMoney(totalPendente)}</span>}
              </div>
              <div className="card-body p-0">
                {isLoadingPendencias ? (
                  <div className="text-center text-muted py-5">Carregando...</div>
                ) : devedores.length === 0 ? (
                  <div className="text-center text-muted py-5 fs-5">🎉 Ninguém devendo agora!</div>
                ) : (
                  <ul className="list-group list-group-flush">
                    {devedores.map(d => (
                      <li key={d.id} className="list-group-item p-3">
                        <div
                          className="d-flex justify-content-between align-items-start gap-2"
                          role="button"
                          onClick={() => setDevedorAberto(prev => (prev === d.id ? null : d.id))}
                        >
                          <div>
                            <div className="fw-bold fs-5">{d.name}</div>
                            {d.notes && <div className="text-primary small fst-italic">{d.notes}</div>}
                            <div className="mt-1"><TelefoneLink phone={d.phone} /></div>
                            {d.oldestDebtDate && (
                              <div className="text-muted small mt-1">Devendo desde {formatDateBR(d.oldestDebtDate)}</div>
                            )}
                          </div>
                          <span className="fs-4 fw-bold text-danger text-nowrap">{formatMoney(d.totalDebt)}</span>
                        </div>

                        {devedorAberto === d.id && (
                          <div className="mt-3 ps-2 border-start border-3 border-danger-subtle">
                            <div className="text-muted small mb-1">O que ele deve:</div>
                            {d.debts.map(item => (
                              <div key={item.id} className="d-flex justify-content-between small mb-1">
                                <span>{item.quantity}x {item.productName} <span className="text-muted">({formatDateBR(item.date)})</span></span>
                                <span className="fw-semibold">{formatMoney(item.totalPrice)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="card shadow-sm h-100">
              <div className="card-header bg-white">
                <span className="fw-semibold fs-5">Quem ainda não recebeu o produto</span>
              </div>
              <div className="card-body p-0">
                {isLoadingPendencias ? (
                  <div className="text-center text-muted py-5">Carregando...</div>
                ) : entregasPendentes.length === 0 ? (
                  <div className="text-center text-muted py-5 fs-5">✅ Tudo entregue!</div>
                ) : (
                  <ul className="list-group list-group-flush">
                    {entregasPendentes.map(e => (
                      <li key={e.id} className="list-group-item p-3">
                        <div className="fw-bold fs-5">{e.clientName}</div>
                        <div className="mt-1"><TelefoneLink phone={e.clientPhone} /></div>
                        <div className="text-muted mt-1">O que falta entregar: {e.itemsSummary}</div>
                        <div className="d-flex justify-content-between align-items-center mt-2">
                          <span className="fw-bold fs-5">{formatMoney(e.totalValue)}</span>
                          <button
                            type="button"
                            className="btn btn-success"
                            disabled={entregandoIds.has(e.id)}
                            onClick={() => handleMarcarEntregue(e.id)}
                          >
                            {entregandoIds.has(e.id) ? 'Salvando...' : '✅ Marcar como Recebido'}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-header bg-white d-flex justify-content-between align-items-center">
                <span className="fw-semibold fs-5">Estoque baixo</span>
                <Link to="/produtos" className="btn btn-sm btn-outline-primary">Ver tudo em Estoque →</Link>
              </div>
              <div className="card-body p-0">
                {isLoadingPendencias ? (
                  <div className="text-center text-muted py-4">Carregando...</div>
                ) : lowStockPreview.length === 0 ? (
                  <div className="text-center text-muted py-4">✅ Nenhum produto com estoque baixo.</div>
                ) : (
                  <ul className="list-group list-group-flush">
                    {lowStockPreview.map(p => (
                      <li key={p.id} className="list-group-item d-flex justify-content-between align-items-center p-3">
                        <span className="fw-bold">{p.name}</span>
                        <span className={`badge ${p.status === 'SEM_ESTOQUE' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                          {p.status === 'SEM_ESTOQUE' ? 'Sem estoque' : `${p.stock} un`}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= ABA: MEU NEGÓCIO ================= */}
      {aba === 'negocio' && (
        <>
          <div className="card shadow-sm mb-3">
            <div className="card-body d-flex flex-wrap gap-2">
              {SUMMARY_PRESETS.map(p => (
                <button
                  key={p.value}
                  type="button"
                  className={`btn ${summaryPreset === p.value ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setSummaryPreset(p.value)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-6 col-lg-4">
              <div className="card shadow-sm h-100 kpi-card">
                <div className="card-body">
                  <div className="text-muted small">Quanto entrou</div>
                  <div className="fs-3 fw-bold">{isLoadingNegocio ? '...' : formatMoney(summary?.revenue ?? 0)}</div>
                </div>
              </div>
            </div>
            <div className="col-6 col-lg-4">
              <div className="card shadow-sm h-100 kpi-card">
                <div className="card-body">
                  <div className="text-muted small">Custo dos produtos</div>
                  <div className="fs-3 fw-bold text-secondary">{isLoadingNegocio ? '...' : formatMoney(summary?.cost ?? 0)}</div>
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-4">
              <div className="card shadow-sm h-100 kpi-card border-success">
                <div className="card-body">
                  <div className="text-muted small">Lucro</div>
                  <div className={`fs-3 fw-bold ${(summary?.profit ?? 0) >= 0 ? 'text-success' : 'text-danger'}`}>
                    {isLoadingNegocio ? '...' : formatMoney(summary?.profit ?? 0)}
                  </div>
                  <div className="text-muted small mt-1">
                    {isLoadingNegocio ? '' : `${summary?.salesCount ?? 0} vendas nesse período`}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card shadow-sm mb-3">
            <div className="card-header bg-white d-flex flex-wrap justify-content-between align-items-center gap-2">
              <span className="fw-semibold">Evolução do lucro</span>
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
            <div className="card-body">
              {isLoadingNegocio ? <div className="text-center text-muted py-5">Carregando...</div> : <ProfitChart data={profitSeries} />}
            </div>
          </div>

          <div className="row g-3">
            {/* Melhores Clientes */}
            <div className="col-lg-6">
              <div className="card shadow-sm h-100">
                <div className="card-header bg-white"><span className="fw-semibold fs-5">Melhores Clientes</span></div>
                <div className="card-body">
                  {isLoadingNegocio ? (
                    <div className="text-center text-muted py-4">Carregando...</div>
                  ) : topClientes.length === 0 ? (
                    <div className="text-center text-muted py-4">Ainda sem vendas com cliente identificado.</div>
                  ) : (
                    <>
                      <div className="p-3 mb-3 rounded-4 melhor-cliente-card">
                        <div className="text-muted mb-1">🏆 Seu melhor cliente</div>
                        <div className="fs-4 fw-bold">{topClientes[0].name}</div>
                        {topClientes[0].notes && (
                          <div className="text-primary fst-italic small">{topClientes[0].notes}</div>
                        )}
                        <div className="mt-1"><TelefoneLink phone={topClientes[0].phone} /></div>
                        <div className="fs-5 fw-bold text-success mt-2">{formatMoney(topClientes[0].totalComprado)}</div>
                      </div>

                      <ul className="list-group list-group-flush">
                        {topClientes.map((c, i) => (
                          <li key={c.id} className="list-group-item d-flex justify-content-between align-items-center p-3">
                            <div className="d-flex align-items-center gap-3">
                              <span className="badge bg-secondary rounded-circle ranking-badge">{i + 1}</span>
                              <div>
                                <div className="fw-bold">{c.name}</div>
                                {c.notes && <div className="text-primary fst-italic small">{c.notes}</div>}
                                <div className="text-muted small">{c.quantidadeCompras} compras</div>
                              </div>
                            </div>
                            <span className="fw-bold">{formatMoney(c.totalComprado)}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Top Produtos */}
            <div className="col-lg-6">
              <div className="card shadow-sm h-100">
                <div className="card-header bg-white"><span className="fw-semibold fs-5">Produtos mais vendidos</span></div>
                <div className="card-body p-0">
                  {isLoadingNegocio ? (
                    <div className="text-center text-muted py-4">Carregando...</div>
                  ) : topProdutos.length === 0 ? (
                    <div className="text-center text-muted py-4">Ainda não há vendas registradas.</div>
                  ) : (
                    <ul className="list-group list-group-flush">
                      {topProdutos.map((p, i) => (
                        <li key={p.productId} className="list-group-item d-flex justify-content-between align-items-center p-3">
                          <div className="d-flex align-items-center gap-3">
                            <span className="badge bg-secondary rounded-circle ranking-badge">{i + 1}</span>
                            <div>
                              <div className="fw-bold">{p.productName}</div>
                              <div className="text-muted small">{p.quantidadeVendida} unidades vendidas</div>
                            </div>
                          </div>
                          <div className="text-end">
                            <div className="fw-bold">{formatMoney(p.faturamento)}</div>
                            <div className="text-success small">+{formatMoney(p.lucro)} lucro</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}