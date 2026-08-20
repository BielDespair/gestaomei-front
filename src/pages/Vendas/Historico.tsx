import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { salesQuery } from '../../api/sales/sales.queries';
import { DeliveryStatus, PaymentStatus } from '../../api/sales/sales.types';
import { formatMoney, formatDate } from '../../utils/format';
import { LoadingState } from '../../components/LoadingState';

type PeriodoPreset = 'hoje' | '7d' | '30d' | 'tudo';

const PRESETS: { value: PeriodoPreset; label: string }[] = [
	{ value: 'hoje', label: 'Hoje' },
	{ value: '7d', label: '7 dias' },
	{ value: '30d', label: '30 dias' },
	{ value: 'tudo', label: 'Tudo' },
];

const PAYMENT_LABEL: Record<PaymentStatus, string> = {
	[PaymentStatus.Pending]: 'Fiado',
	[PaymentStatus.Paid]: 'Pago',
	[PaymentStatus.PartiallyPaid]: 'Parcial',
	[PaymentStatus.Cancelled]: 'Cancelada',
};

const PAYMENT_BADGE: Record<PaymentStatus, string> = {
	[PaymentStatus.Pending]: 'bg-danger',
	[PaymentStatus.Paid]: 'bg-success',
	[PaymentStatus.PartiallyPaid]: 'bg-warning text-dark',
	[PaymentStatus.Cancelled]: 'bg-secondary',
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
	const { data, isPending, isError } = useQuery(salesQuery());
	const [preset, setPreset] = useState<PeriodoPreset>('30d');
	const [busca, setBusca] = useState('');

	// O backend não filtra mais por período/texto: filtramos no cliente
	// já que a lista completa é trazida de uma vez.
	const vendasFiltradas = useMemo(() => {
		const vendas = data ?? [];
		const { start, end } = resolveRange(preset);
		const termo = busca.trim().toLowerCase();

		return vendas
			.filter(v => (!start || v.saleDate >= start) && (!end || v.saleDate <= end))
			.filter(v => !termo || v.sellerName.toLowerCase().includes(termo))
			.sort((a, b) => b.saleDate.localeCompare(a.saleDate));
	}, [data, preset, busca]);

	return (
		<div>
			{isError && (
				<div className="alert alert-danger">Não foi possível carregar o histórico de vendas.</div>
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
				placeholder="Buscar por vendedor…"
				autoComplete="off"
				value={busca}
				onChange={e => setBusca(e.target.value)}
			/>

			{isPending ? (
				<LoadingState />
			) : vendasFiltradas.length === 0 ? (
				<div className="text-center text-muted py-5 fs-5">Nenhuma venda encontrada nesse período.</div>
			) : (
				<div className="list-group">
					{vendasFiltradas.map(v => (
						<div key={v.saleId} className="list-group-item p-3">
							<div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
								<div>
									<div className="fw-bold fs-5">{formatDate(v.saleDate)}</div>
									<div className="text-muted small">
										{v.totalItems} {v.totalItems === 1 ? 'item' : 'itens'} · Vendedor: {v.sellerName}
									</div>
								</div>
								<div className="d-flex gap-2">
									<span className={`badge ${PAYMENT_BADGE[v.paymentStatus]}`}>
										{PAYMENT_LABEL[v.paymentStatus]}
									</span>
									<span className={`badge ${v.deliveryStatus === DeliveryStatus.Delivered ? 'bg-primary' : 'bg-warning text-dark'}`}>
										{v.deliveryStatus === DeliveryStatus.Delivered ? 'Entregue' : 'Pendente'}
									</span>
								</div>
							</div>

							<div className="text-end fw-bold fs-5 mt-2">{formatMoney(v.total)}</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
