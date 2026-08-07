import { ModalShell } from '../../../components/ModalShell';

interface Props {
	onClose: () => void;
}

export function VendaConcluidaModal({ onClose }: Props) {
	return (
		<ModalShell
			title="Venda finalizada"
			centered
			maxWidth="400px"
			onClose={onClose}
			footer={
				<button
					type="button"
					className="btn btn-success w-100 py-3 fs-4 fw-bold rounded-3"
					onClick={onClose}
					autoFocus
				>
					Nova venda
				</button>
			}
		>
			<div className="text-center py-3">
				<div className="fs-1 mb-3">✅</div>
				<p className="text-muted mb-0 fs-5">
					Tudo certo. As quantidades foram atualizadas no estoque.
				</p>
			</div>
		</ModalShell>
	);
}
