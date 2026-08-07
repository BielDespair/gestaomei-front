/** Unidades federativas do Brasil. Fonte única — reutilize em qualquer tela. */

export const UFS = [
	'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
	'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
	'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const;

export type UF = (typeof UFS)[number];

export const UF_NOMES: Record<UF, string> = {
	AC: 'Acre',
	AL: 'Alagoas',
	AP: 'Amapá',
	AM: 'Amazonas',
	BA: 'Bahia',
	CE: 'Ceará',
	DF: 'Distrito Federal',
	ES: 'Espírito Santo',
	GO: 'Goiás',
	MA: 'Maranhão',
	MT: 'Mato Grosso',
	MS: 'Mato Grosso do Sul',
	MG: 'Minas Gerais',
	PA: 'Pará',
	PB: 'Paraíba',
	PR: 'Paraná',
	PE: 'Pernambuco',
	PI: 'Piauí',
	RJ: 'Rio de Janeiro',
	RN: 'Rio Grande do Norte',
	RS: 'Rio Grande do Sul',
	RO: 'Rondônia',
	RR: 'Roraima',
	SC: 'Santa Catarina',
	SP: 'São Paulo',
	SE: 'Sergipe',
	TO: 'Tocantins',
};

/** Ordenado por nome — é como a pessoa procura num select. */
export const UFS_POR_NOME = [...UFS].sort((a, b) =>
	UF_NOMES[a].localeCompare(UF_NOMES[b], 'pt-BR')
);

export function isUF(value: unknown): value is UF {
	return typeof value === 'string' && (UFS as readonly string[]).includes(value.toUpperCase());
}

/** Normaliza o que vier do ViaCEP ou de dado legado. Devolve null se não for UF válida. */
export function toUF(value?: string | null): UF | null {
	const v = value?.trim().toUpperCase();
	return isUF(v) ? (v as UF) : null;
}
