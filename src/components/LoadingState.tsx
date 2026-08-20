type Size = 'sm' | 'md' | 'lg';

const PADDING: Record<Size, string> = { sm: 'py-2', md: 'py-4', lg: 'py-5' };

interface Props {
	label?: string;
	/** sm = spinner inline com o texto (uso dentro de listas/cards); md/lg = spinner empilhado, para seções e páginas inteiras. */
	size?: Size;
}

export function LoadingState({ label = 'Carregando…', size = 'lg' }: Props) {
	return (
		<div className={`text-center text-muted ${PADDING[size]}`}>
			{size === 'sm' ? (
				<>
					<span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
					{label}
				</>
			) : (
				<>
					<div className="spinner-border" role="status" aria-hidden="true" />
					<div className="mt-2">{label}</div>
				</>
			)}
		</div>
	);
}
