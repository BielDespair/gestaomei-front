import { useState } from 'react';
import type { SaleDebt } from '../../../api/clients/clients.types';
import type { TabProps } from './ClienteModal';
import { formatMoney, formatDate } from '../../../utils/format';
import { useRegisterPayment } from '../../../api/clients/clients.queries';

/** Centavos inteiros: evita 0.1 + 0.2 = 0.30000000000000004 nas comparações. */
const cents = (v: number) => Math.round(v * 100);

interface Alocacao {
	saleId: number;
	saleDate: string;
	valor: number;
	quita: boolean;
}

/** Prévia da distribuição — a alocação real acontece no backend. */
function alocar(debts: SaleDebt[], valor: number) {
	let restante = cents(valor);
	const alocacoes: Alocacao[] = [];

	for (const d of debts) {
		if (restante <= 0) break;
		const devido = cents(d.remaining);
		const usado = Math.min(restante, devido);
		alocacoes.push({
			saleId: d.saleId,
			saleDate: d.saleDate,
			valor: usado / 100,
			quita: usado === devido,
		});
		restante -= usado;
	}

	return { alocacoes, sobra: restante / 100 };
}

function PainelPagamento({ debts, total, clientId, onPago, onCancel }: { debts: SaleDebt[]; total: number; clientId: number; onPago: () => void; onCancel: () => void; }) {
	const [valor, setValor] = useState(total.toFixed(2).replace('.', ','));
	const registerPayment = useRegisterPayment()

	const numero = Number(valor.replace(',', '.')) || 0;
	const excede = cents(numero) > cents(total);
	const invalido = numero <= 0 || excede;
	const { alocacoes } = alocar(debts, numero);

	function confirmar() {
		registerPayment.mutate(
			{ clientId, payload: { amount: numero } },
			{ onSuccess: () => onPago() }
		);
	}

	return (
		<div className="border rounded p-3 mb-3">
			<h6 className="mb-3">Receber pagamento</h6>

			{registerPayment.isError && (
				<div className="alert alert-danger py-2">
					{registerPayment.error?.message || 'Não foi possível registrar o pagamento.'}
				</div>
			)}

			<div className="row g-3 align-items-end mb-3">
				<div className="col-sm-5">
					<label className="form-label">Valor recebido</label>
					<div className="input-group">
						<span className="input-group-text">R$</span>
						<input
							className={`form-control ${excede ? 'is-invalid' : ''}`}
							inputMode="decimal"
							autoFocus
							value={valor}
							onChange={e => setValor(e.target.value)}
						/>
					</div>
					{excede && <small className="text-danger">Maior que o total em aberto.</small>}
				</div>
				<div className="col-sm-7">
					<button
						type="button"
						className="btn btn-outline-secondary btn-sm"
						onClick={() => setValor(total.toFixed(2).replace(".", ","))}
					>
						Quitar tudo ({formatMoney(total)})
					</button>
				</div>
			</div>

			{!invalido && (
				<div className="mb-3">
					<small className="text-muted d-block mb-1">Abatimento (mais antigas primeiro):</small>
					<ul className="list-unstyled mb-0 small">
						{alocacoes.map(a => (
							<li key={a.saleId} className="d-flex justify-content-between border-bottom py-1">
								<span>
									Venda #{a.saleId} · {formatDate(a.saleDate)}
								</span>
								<span>
									{formatMoney(a.valor)}
									{a.quita && <span className="badge bg-success ms-2">quita</span>}
								</span>
							</li>
						))}
					</ul>
				</div>
			)}

			<div className="d-flex gap-2">
				<button type="button" className="btn btn-secondary btn-sm" onClick={onCancel} disabled={registerPayment.isPending}>
					Cancelar
				</button>
				<button
					type="button"
					className="btn btn-success btn-sm"
					onClick={confirmar}
					disabled={ invalido || registerPayment.isPending }
				>
					{ registerPayment.isPending ? 'Registrando…' : 'Registrar pagamento' }
				</button>
			</div>
		</div>
	);
}

function VendaEmAberto({ debt }: { debt: SaleDebt }) {
	const [isOpen, setIsOpen] = useState(false);
	const temPagamento = debt.amountPaid > 0;
	const pctPago = debt.total > 0 ? (debt.amountPaid / debt.total) * 100 : 0;

	return (
		<div className="card mb-2">
			<div className="card-body py-2 px-3">
				<div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
					<div>
						<div className="fw-bold">{formatDate(debt.saleDate)}</div>
						<small className="text-muted">
							Venda #{debt.saleId} · Vendedor: {debt.sellerName}
						</small>
					</div>
					<div className="text-end">
						<div className="fs-5 fw-bold text-danger">{formatMoney(debt.remaining)}</div>
						{temPagamento && (
							<small className="text-muted">
								Pago {formatMoney(debt.amountPaid)} de {formatMoney(debt.total)}
							</small>
						)}
					</div>
				</div>

				{temPagamento && (
					<div className="progress mt-2" style={{ height: '4px' }}>
						<div
							className="progress-bar bg-success"
							style={{ width: `${pctPago}%` }}
							role="progressbar"
							aria-valuenow={Math.round(pctPago)}
							aria-valuemin={0}
							aria-valuemax={100}
						/>
					</div>
				)}

				<div className="d-flex justify-content-between align-items-center flex-wrap">
					<button
						type="button"
						className="btn btn-sm btn-link ps-0 text-decoration-none"
						aria-expanded={isOpen}
						onClick={() => setIsOpen(v => !v)}
					>
						{isOpen ? 'Ocultar itens' : `Ver itens (${debt.items.length})`}
					</button>
				</div>

				{isOpen && (
					<div className="table-responsive">
						<table className="table table-sm mb-0">
							<thead>
								<tr>
									<th>Produto</th>
									<th className="text-center" style={{ width: '60px' }}>Qtd</th>
									<th className="text-end" style={{ width: '110px' }}>Unit.</th>
									<th className="text-end" style={{ width: '110px' }}>Total</th>
								</tr>
							</thead>
							<tbody>
								{debt.items.map(item => (
									<tr key={item.productId}>
										<td>{item.productName}</td>
										<td className="text-center">{item.quantity}</td>
										<td className="text-end text-muted">{formatMoney(item.unitPrice)}</td>
										<td className="text-end">{formatMoney(item.totalPrice)}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
}

export function DividasTab({ client }: TabProps) {
	const [recebendo, setRecebendo] = useState(false);

	// Mais antiga primeiro: é a ordem em que se cobra e em que se abate.
	const debts = [...client.debts].sort((a, b) => a.saleDate.localeCompare(b.saleDate));
	const total = debts.reduce((acc, d) => acc + d.remaining, 0);

	function aposPagamento() {
		setRecebendo(false);
	}

	if (debts.length === 0) {
		return (
			<div className="text-center text-muted py-5">
				<div className="fs-5">Nenhum débito em aberto.</div>
				<small>Este cliente está em dia.</small>
			</div>
		);
	}

	return (
		<>
			<div className="d-flex justify-content-between align-items-end gap-3 border rounded p-3 mb-3 bg-light">
				<div>
					<small className="text-muted d-block">Total em aberto</small>
					<span className="fs-3 fw-bold text-danger">{formatMoney(total)}</span>
				</div>
				<div className="text-end">
					<small className="text-muted d-block">
						{debts.length === 1 ? '1 venda em aberto' : `${debts.length} vendas em aberto`}
						{' · '}Mais antiga: {formatDate(debts[0].saleDate)}
					</small>
					{!recebendo && (
						<button
							type="button"
							className="btn btn-success btn-sm mt-2"
							onClick={() => setRecebendo(true)}
						>
							Receber pagamento
						</button>
					)}
				</div>
			</div>

			{recebendo && (
				<PainelPagamento
					debts={debts}
					total={total}
					clientId={client.id}
					onPago={aposPagamento}
					onCancel={() => setRecebendo(false)}
				/>
			)}

			{debts.map(debt => (
				<VendaEmAberto key={debt.saleId}debt={debt}/>
			))}
		</>
	);
}
