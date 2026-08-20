import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  devedoresQuery,
  entregasPendentesQuery,
  lowStockQuery,
  aguardandoReposicaoQuery,
  estoqueValorQuery,
  topClientesQuery,
  topProdutosQuery,
  summaryQuery,
  dashboardKeys,
} from '../../api/dashboard/dashboard.queries';
import type { SummaryPreset } from '../../api/dashboard/dashboard.types';
import { useMarkAsDelivered } from '../../api/sales/sales.queries';
import { LoadingState } from '../../components/LoadingState';
import { Graficos } from './Graficos';
import './styles.css';

type Aba = 'pendencias' | 'negocio' | 'graficos';

const SUMMARY_PRESETS: { value: SummaryPreset; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'this_week', label: 'Esta Semana' },
  { value: 'this_month', label: 'Este Mês' },
  { value: 'last_month', label: 'Mês Passado' },
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
      {phone}
    </a>
  );
}

function SecaoTitulo({ children }: { children: React.ReactNode }) {
  return <h5 className="fw-bold mt-4 mb-3 pb-2 border-bottom">{children}</h5>;
}

export function Dashboard() {
  const [aba, setAba] = useState<Aba>('pendencias');
  const [summaryPreset, setSummaryPreset] = useState<SummaryPreset>('this_week');
  const [entregandoIds, setEntregandoIds] = useState<Set<number>>(new Set());
  const [devedorAberto, setDevedorAberto] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const qc = useQueryClient();
  const markAsDelivered = useMarkAsDelivered();

  // --- Pendências ---
  const { data: devedores, isPending: isPendingDevedores, isError: isErrorDevedores } = useQuery(devedoresQuery());
  const { data: entregasPendentes, isPending: isPendingEntregas, isError: isErrorEntregas } = useQuery(entregasPendentesQuery());
  const { data: lowStockData, isPending: isPendingLowStock, isError: isErrorLowStock } = useQuery(lowStockQuery(10));
  const { data: aguardandoReposicao, isPending: isPendingAguardando, isError: isErrorAguardando } = useQuery(aguardandoReposicaoQuery());

  const isLoadingPendencias = isPendingDevedores || isPendingEntregas || isPendingLowStock || isPendingAguardando;
  const isErrorPendencias = isErrorDevedores || isErrorEntregas || isErrorLowStock || isErrorAguardando;
  const lowStockPreview = (lowStockData ?? []).slice(0, 5);

  // --- Meu Negócio ---
  const negocioAtivo = aba === 'negocio';
  const { data: estoqueValor, isPending: isLoadingEstoqueAgora } = useQuery({ ...estoqueValorQuery(), enabled: negocioAtivo });
  const { data: topClientes = [], isPending: isPendingTopClientes } = useQuery({ ...topClientesQuery(10), enabled: negocioAtivo });
  const { data: topProdutos = [], isPending: isPendingTopProdutos } = useQuery({ ...topProdutosQuery(10), enabled: negocioAtivo });
  const { data: summary, isPending: isLoadingResultado } = useQuery({ ...summaryQuery(summaryPreset), enabled: negocioAtivo });
  const isLoadingRankings = isPendingTopClientes || isPendingTopProdutos;

  const handleMarcarEntregue = async (id: number) => {
    setEntregandoIds(prev => new Set(prev).add(id));
    try {
      await markAsDelivered.mutateAsync(id);
      qc.invalidateQueries({ queryKey: dashboardKeys.entregasPendentes() });
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

  const totalPendente = (devedores ?? []).reduce((acc, d) => acc + d.totalDebt, 0);
  const totalPendenciasBadge = (devedores?.length ?? 0) + (entregasPendentes?.length ?? 0) + (aguardandoReposicao?.length ?? 0);

  return (
    <div className="container-fluid px-3 px-lg-4 py-3 py-lg-4 dashboard-tela">
      <h2 className="fw-bold mb-3">Visão Geral</h2>

      {(errorMessage || isErrorPendencias) && (
        <div className="alert alert-danger d-flex justify-content-between align-items-center">
          <span>{errorMessage || 'Não foi possível carregar as pendências.'}</span>
          {errorMessage && <button type="button" className="btn-close" onClick={() => setErrorMessage('')}></button>}
        </div>
      )}

      <div className="d-flex flex-wrap gap-2 mb-4 abas-dashboard">
        <button
          type="button"
          className={`btn btn-lg fw-semibold flex-grow-1 flex-lg-grow-0 ${aba === 'pendencias' ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => setAba('pendencias')}
        >
          Pendências
          {totalPendenciasBadge > 0 && (
            <span className="badge bg-danger rounded-pill ms-2">{totalPendenciasBadge}</span>
          )}
        </button>
        <button
          type="button"
          className={`btn btn-lg fw-semibold flex-grow-1 flex-lg-grow-0 ${aba === 'negocio' ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => setAba('negocio')}
        >
          Meu Negócio
        </button>
        <button
          type="button"
          className={`btn btn-lg fw-semibold flex-grow-1 flex-lg-grow-0 ${aba === 'graficos' ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => setAba('graficos')}
        >
          Gráficos
        </button>
      </div>

      {/* ================= ABA: PENDÊNCIAS ================= */}
      {aba === 'pendencias' && (
        <div className="row g-3">
          <div className="col-lg-6">
            <div className="card shadow-sm h-100">
              <div className="card-header d-flex justify-content-between align-items-center">
                <span className="fw-semibold fs-5">Quem está devendo</span>
                {totalPendente > 0 && <span className="badge bg-danger fs-6">{formatMoney(totalPendente)}</span>}
              </div>
              <div className="card-body p-0">
                {isLoadingPendencias ? (
                  <LoadingState />
                ) : devedores?.length === 0 ? (
                  <div className="text-center text-muted py-5 fs-5">Ninguém devendo agora.</div>
                ) : (
                  <ul className="list-group list-group-flush">
                    {devedores?.map(d => (
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
              <div className="card-header">
                <span className="fw-semibold fs-5">Quem ainda não recebeu o produto</span>
              </div>
              <div className="card-body p-0">
                {isLoadingPendencias ? (
                  <LoadingState />
                ) : entregasPendentes?.length === 0 ? (
                  <div className="text-center text-muted py-5 fs-5">Tudo entregue.</div>
                ) : (
                  <ul className="list-group list-group-flush">
                    {entregasPendentes?.map(e => (
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
                            {entregandoIds.has(e.id) ? 'Salvando...' : 'Marcar como Recebido'}
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
              <div className="card-header d-flex justify-content-between align-items-center">
                <span className="fw-semibold fs-5">Aguardando reposição</span>
                {(aguardandoReposicao?.length ?? 0) > 0 && (
                  <Link to="/entradas" className="btn btn-sm btn-warning">Registrar Entrada</Link>
                )}
              </div>
              <div className="card-body p-0">
                {isLoadingPendencias ? (
                  <LoadingState size="md" />
                ) : aguardandoReposicao?.length === 0 ? (
                  <div className="text-center text-muted py-4">Nenhuma venda sob encomenda esperando reposição.</div>
                ) : (
                  <ul className="list-group list-group-flush">
                    {aguardandoReposicao?.map(item => (
                      <li key={item.productId} className="list-group-item d-flex justify-content-between align-items-center p-3">
                        <div>
                          <div className="fw-bold">{item.productName}</div>
                          <div className="text-muted small">
                            Prometido a: {item.clientes.join(', ')}
                          </div>
                        </div>
                        <span className="badge bg-warning text-dark fs-6">{item.quantidadePendente} un</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-header d-flex justify-content-between align-items-center">
                <span className="fw-semibold fs-5">Estoque baixo</span>
                <Link to="/produtos" className="btn btn-sm btn-outline-primary">Ver estoque</Link>
              </div>
              <div className="card-body p-0">
                {isLoadingPendencias ? (
                  <LoadingState size="md" />
                ) : lowStockPreview.length === 0 ? (
                  <div className="text-center text-muted py-4">Nenhum produto com estoque baixo.</div>
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
          <SecaoTitulo>Estoque agora</SecaoTitulo>
          <div className="row g-3">
            <div className="col-6">
              <div className="card shadow-sm h-100 kpi-card">
                <div className="card-body">
                  <div className="text-muted small">Valor investido em estoque</div>
                  <div className="fs-3 fw-bold">
                    {isLoadingEstoqueAgora ? '...' : formatMoney(estoqueValor?.valorInvestido ?? 0)}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-6">
              <div className="card shadow-sm h-100 kpi-card">
                <div className="card-body">
                  <div className="text-muted small">Unidades em estoque</div>
                  <div className="fs-3 fw-bold">
                    {isLoadingEstoqueAgora ? '...' : `${estoqueValor?.unidadesEmEstoque ?? 0} un`}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <SecaoTitulo>Resultado do período</SecaoTitulo>
          <div className="d-flex flex-wrap gap-2 mb-3">
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

          <div className="row g-3 mb-3">
            <div className="col-6 col-lg-3">
              <div className="card shadow-sm h-100 kpi-card">
                <div className="card-body">
                  <div className="text-muted small">Quanto entrou</div>
                  <div className="fs-3 fw-bold">{isLoadingResultado ? '...' : formatMoney(summary?.revenue ?? 0)}</div>
                </div>
              </div>
            </div>
            <div className="col-6 col-lg-3">
              <div className="card shadow-sm h-100 kpi-card">
                <div className="card-body">
                  <div className="text-muted small">Custo dos produtos</div>
                  <div className="fs-3 fw-bold text-secondary">{isLoadingResultado ? '...' : formatMoney(summary?.cost ?? 0)}</div>
                </div>
              </div>
            </div>
            <div className="col-6 col-lg-3">
              <div className="card shadow-sm h-100 kpi-card border-success">
                <div className="card-body">
                  <div className="text-muted small">Lucro</div>
                  <div className={`fs-3 fw-bold ${(summary?.profit ?? 0) >= 0 ? 'text-success' : 'text-danger'}`}>
                    {isLoadingResultado ? '...' : formatMoney(summary?.profit ?? 0)}
                  </div>
                  <div className="text-muted small mt-1">
                    {isLoadingResultado ? '' : `${summary?.salesCount ?? 0} vendas`}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-6 col-lg-3">
              <div className="card shadow-sm h-100 kpi-card">
                <div className="card-body">
                  <div className="text-muted small">Ticket Médio</div>
                  <div className="fs-3 fw-bold">{isLoadingResultado ? '...' : formatMoney(summary?.averageTicket ?? 0)}</div>
                  <div className="text-muted small mt-1">
                    {isLoadingResultado ? '' : `${summary?.unitsSold ?? 0} unidades`}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {!isLoadingResultado && (summary?.pendingCostRevenue ?? 0) > 0 && (
            <div className="alert alert-warning mb-3">
              {formatMoney(summary!.pendingCostRevenue)} em vendas desse período aguardando reposição
              — o lucro entra na conta quando a mercadoria chegar.
            </div>
          )}

          <SecaoTitulo>Desde o início</SecaoTitulo>
          <div className="row g-3">
            <div className="col-lg-6">
              <div className="card shadow-sm h-100">
                <div className="card-header"><span className="fw-semibold fs-5">Melhores Clientes</span></div>
                <div className="card-body">
                  {isLoadingRankings ? (
                    <LoadingState size="md" />
                  ) : topClientes.length === 0 ? (
                    <div className="text-center text-muted py-4">Ainda sem vendas com cliente identificado.</div>
                  ) : (
                    <>
                      <div className="p-3 mb-3 rounded-4 melhor-cliente-card">
                        <div className="text-muted mb-1">Seu melhor cliente</div>
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

            <div className="col-lg-6">
              <div className="card shadow-sm h-100">
                <div className="card-header"><span className="fw-semibold fs-5">Produtos mais vendidos</span></div>
                <div className="card-body p-0">
                  {isLoadingRankings ? (
                    <LoadingState size="md" />
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

      {/* ================= ABA: GRÁFICOS ================= */}
      {aba === 'graficos' && <Graficos />}
    </div>
  );
}
