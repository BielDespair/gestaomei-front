import { useEffect, type ReactNode, type FormEvent } from 'react';

interface Props {
	title: ReactNode;
	size?: 'sm' | 'lg' | 'xl';
	/** Centraliza verticalmente. */
	centered?: boolean;
	/** Sobrescreve a largura do modal-dialog, ex.: '450px'. */
	maxWidth?: string;
	/** Teto de altura do corpo rolável (o resto vira scroll interno). Padrão: 70vh. */
	bodyMaxHeight?: string;
	onClose: () => void;
	children: ReactNode;
	footer?: ReactNode;
	/** Se informado, envolve corpo + rodapé em um <form>. */
	onSubmit?: (e: FormEvent) => void;
}

export function ModalShell({
	title, size = 'lg', centered = false, maxWidth, bodyMaxHeight = '70vh',
	onClose, children, footer, onSubmit,
}: Props) {
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		document.addEventListener('keydown', onKey);
		document.body.style.overflow = 'hidden';
		return () => {
			document.removeEventListener('keydown', onKey);
			document.body.style.overflow = '';
		};
	}, [onClose]);

	const inner = (
		<>
			<div className="modal-body" style={{ maxHeight: bodyMaxHeight, overflowY: 'auto' }}>
				{children}
			</div>
			{footer && <div className="modal-footer bg-light">{footer}</div>}
		</>
	);

	return (
		<>
			<div
				className="modal fade show d-block"
				tabIndex={-1}
				role="dialog"
				aria-modal="true"
				onClick={e => { if (e.target === e.currentTarget) onClose(); }}
			>
				<div
					className={`modal-dialog modal-${size} ${centered ? 'modal-dialog-centered' : ''}`}
					style={maxWidth ? { maxWidth } : undefined}
				>
					<div className="modal-content">
						<div className="modal-header">
							<h5 className="modal-title">{title}</h5>
							<button
								type="button"
								className="btn btn-danger rounded-circle btn-remove"
								aria-label="Fechar"
								onClick={onClose}
							>
								<i className="bi bi-x-lg" aria-hidden="true" />
							</button>
						</div>
						{onSubmit ? <form onSubmit={onSubmit}>{inner}</form> : inner}
					</div>
				</div>
			</div>
			<div className="modal-backdrop fade show" />
		</>
	);
}
