import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { TabProps } from './ClienteModal';
import { salesByClientQuery, saleDetailQuery } from '../../../api/sales/sales.queries';
import { DeliveryStatus, PaymentStatus, type SaleListItem } from '../../../api/sales/sales.types';
import { formatMoney, formatDate } from '../../../utils/format';
import { LoadingState } from '../../../components/LoadingState';

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

function CompraCard({ sale }: { sale: SaleListItem }) {
	const [isOpen, setIsOpen] = useState(false);
	const { data: detail, isPending, isError } = useQuery({
		...saleDetailQuery(sale.saleId),
		enabled: isOpen,
	});

	return (
		<div className="list-group-item p-3">
			<div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
				<div>
					<div className="fw-bold fs-5">{formatDate(sale.saleDate)}</div>
					<div className="text-muted small">
						{sale.totalItems} {sale.totalItems === 1 ? 'item' : 'itens'} · Vendedor: {sale.sellerName}
					</div>
				</div>
				<div className="d-flex gap-2">
					<span className={`badge ${PAYMENT_BADGE[sale.paymentStatus]}`}>
						{PAYMENT_LABEL[sale.paymentStatus]}
					</span>
					<span className={`badge ${sale.deliveryStatus === DeliveryStatus.Delivered ? 'bg-primary' : 'bg-warning text-dark'}`}>
						{sale.deliveryStatus === DeliveryStatus.Delivered ? 'Entregue' : 'Pendente'}
					</span>
				</div>
			</div>

			<div className="d-flex justify-content-between align-items-center flex-wrap mt-2">
				<button
					type="button"
					className="btn btn-sm btn-link ps-0 text-decoration-none"
					aria-expanded={isOpen}
					onClick={() => setIsOpen(v => !v)}
				>
					{isOpen ? 'Ocultar itens' : `Ver itens (${sale.totalItems})`}
				</button>
				<span className="fw-bold fs-5">{formatMoney(sale.total)}</span>
			</div>

			{isOpen && (
				<div className="table-responsive mt-2">
					{isPending ? (
						<LoadingState label="Carregando itens…" size="sm" />
					) : isError ? (
						<div className="alert alert-danger py-2 mb-0">Não foi possível carregar os itens dessa compra.</div>
					) : (
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
								{detail.items.map(item => (
									<tr key={item.productId}>
										<td>{item.productName}</td>
										<td className="text-center">{item.quantity}</td>
										<td className="text-end text-muted">{formatMoney(item.unitPrice)}</td>
										<td className="text-end">{formatMoney(item.totalPrice)}</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
				</div>
			)}
		</div>
	);
}

export function ComprasTab({ client }: TabProps) {
	const { data, isPending, isError } = useQuery(salesByClientQuery(client.id));

	if (isPending) {
		return <LoadingState />;
	}

	if (isError) {
		return <div className="alert alert-danger">Não foi possível carregar o histórico de compras.</div>;
	}

	const sales = [...data].sort((a, b) => b.saleDate.localeCompare(a.saleDate));

	if (sales.length === 0) {
		return (
			<div className="text-center text-muted py-5">
				<div className="fs-5">Nenhuma compra registrada.</div>
				<small>Este cliente ainda não fez nenhuma compra.</small>
			</div>
		);
	}

	const total = sales.reduce((acc, s) => acc + s.total, 0);

	return (
		<>
			<div className="d-flex justify-content-between align-items-end gap-3 border rounded p-3 mb-3 bg-light">
				<div>
					<small className="text-muted d-block">Total gasto</small>
					<span className="fs-3 fw-bold text-success">{formatMoney(total)}</span>
				</div>
				<div className="text-end">
					<small className="text-muted d-block">
						{sales.length === 1 ? '1 compra' : `${sales.length} compras`}
						{' · '}Última: {formatDate(sales[0].saleDate)}
					</small>
				</div>
			</div>

			<div className="list-group">
				{sales.map(s => (
					<CompraCard key={s.saleId} sale={s} />
				))}
			</div>
		</>
	);
}
