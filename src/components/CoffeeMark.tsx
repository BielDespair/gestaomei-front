/** Símbolo da marca (xícara com pires e vapor) — ver documento de marca, seção 02. */

type Variant = 'dark' | 'light' | 'mono';

interface Props {
	/** dark = xícara clara p/ fundo escuro (versão principal); light = xícara escura p/ fundo claro; mono = uma cor só. */
	variant?: Variant;
	size?: number;
	className?: string;
}

const VARIANT_COLORS: Record<Variant, { xicara: string; cafe: string; vapor: string }> = {
	dark: { xicara: '#FAF2DE', cafe: '#452316', vapor: '#D5993F' },
	light: { xicara: '#452316', cafe: '#FAF2DE', vapor: '#774635' },
	mono: { xicara: '#452316', cafe: '#FAF2DE', vapor: '#452316' },
};

export function CoffeeMark({ variant = 'dark', size = 28, className }: Props) {
	const { xicara, cafe, vapor } = VARIANT_COLORS[variant];

	return (
		<svg width={size} height={size} viewBox="-19 -28 38 33" className={className} aria-hidden="true">
			<g transform="scale(1,-1)">
				<path
					fill={xicara}
					fillRule="evenodd"
					d="M-17,-0.9 a17,2.5 0 1,0 34,0 a17,2.5 0 1,0 -34,0 z
					   M-13.2,0.3 a13.2,1.9 0 1,0 26.4,0 a13.2,1.9 0 1,0 -26.4,0 z"
				/>
				<circle cx="12.6" cy="7.4" r="4.9" fill="none" stroke={xicara} strokeWidth="2.1" />
				<path
					fill={xicara}
					d="M-12.5,13 C-12.3,5.5 -9.8,1.2 -5.4,1.2 L5.4,1.2 C9.8,1.2 12.3,5.5 12.5,13 Z"
				/>
				<ellipse cx="0" cy="13" rx="12.5" ry="2.6" fill={xicara} />
				<ellipse cx="0" cy="13" rx="9.6" ry="1.5" fill={cafe} />
				<g fill="none" stroke={vapor} strokeWidth="1.55" strokeLinecap="round">
					<path d="M-5.6,17.2 C-8.3,19.44 -2.9,21.69 -5.6,24" />
					<path d="M0,17.2 C-2.7,20.27 2.7,23.34 0,26.5" />
					<path d="M5.6,17.2 C2.9,19.44 8.3,21.69 5.6,24" />
				</g>
			</g>
		</svg>
	);
}
