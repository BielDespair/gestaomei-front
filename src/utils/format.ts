const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const onlyDigits = (v: string) => v.replace(/\D/g, '');

/** 1234.5 -> "R$ 1.234,50" */
export const formatMoney = (value?: number | null) => BRL.format(value ?? 0);

/**
 * "2026-03-14" ou "2026-03-14T10:22:00Z" -> "14/03/2026"
 * Fatia a string em vez de usar new Date() de propósito: no fuso do Brasil
 * new Date('2026-03-14') volta como 13/03.
 */
export const formatDate = (iso?: string | null) => {
	if (!iso) return '-';
	const [y, m, d] = iso.split('T')[0].split('-');
	return y && m && d ? `${d}/${m}/${y}` : '-';
};

/** "2026-03-14T10:22:00Z" -> "14/03/2026 10:22" */
export const formatDateTime = (iso?: string | null) => {
	if (!iso) return '-';
	const [date, time] = iso.split('T');
	const hhmm = time?.slice(0, 5);
	return hhmm ? `${formatDate(date)} ${hhmm}` : formatDate(date);
};

/** "11987654321" -> "(11) 98765-4321" */
export const formatPhone = (value?: string | null): string => {
	const d = onlyDigits(value ?? '');
	if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
	if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
	return value ?? '-';
};

/** CPF -> 000.000.000-00 | CNPJ -> 00.000.000/0000-00 */
export const formatDocument = (value?: string | null): string => {
	const d = onlyDigits(value ?? '');
	if (d.length === 11) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
	if (d.length === 14) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
	return value ?? '-';
};

/** "38400000" -> "38400-000" */
export const formatCep = (value?: string | null): string => {
	const d = onlyDigits(value ?? '');
	return d.length === 8 ? `${d.slice(0, 5)}-${d.slice(5)}` : value ?? '-';
};

/* ---------- Máscaras de digitação ----------
   Formatam parcialmente enquanto a pessoa digita. Sempre string -> string.
   Para exibir dado pronto, use as format* acima.                        */

export const maskCep = (v: string): string =>
	onlyDigits(v).slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2');

export const maskPhone = (v: string): string => {
	const d = onlyDigits(v).slice(0, 11);
	return d.length <= 10
		? d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
		: d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
};

export const maskDocument = (v: string): string => {
	const d = onlyDigits(v).slice(0, 14);
	return d.length <= 11
		? d.replace(/(\d{3})(\d)/, '$1.$2')
		   .replace(/(\d{3})(\d)/, '$1.$2')
		   .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
		: d.replace(/(\d{2})(\d)/, '$1.$2')
		   .replace(/(\d{3})(\d)/, '$1.$2')
		   .replace(/(\d{3})(\d)/, '$1/$2')
		   .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
};
