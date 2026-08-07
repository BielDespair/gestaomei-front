import React, { useMemo, useState } from 'react';
import type { Client } from '../../../types/api/Client';
import { cepService } from '../../../services/cepService';
import { onlyDigits } from '../../../utils/format';
import { toUF } from '../../../constants/estados';

export type ClientFormData = Omit<Client, 'id' | 'debts'>;

type FormEl = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
type Mask = (v: string) => string;

const EMPTY: ClientFormData = {
	name: '', description: '', email: '', document: '', pix: '', phoneNumber: '',
	cep: '', street: '', number: '', complement: '', district: '', city: '', state: '',
};

export function useClientForm(client: Client | null) {
	// Normaliza os campos mascarados: o state guarda só dígitos.
	// Sem isso, dado legado com pontuação faz o form nascer "sujo".
	const initial = useMemo<ClientFormData>(() => {
		if (!client) return EMPTY;
		return {
			...EMPTY,
			...client,
			document: onlyDigits(client.document ?? ''),
			phoneNumber: onlyDigits(client.phoneNumber ?? ''),
			cep: onlyDigits(client.cep ?? ''),
			state: toUF(client.state) ?? '',
		};
	}, [client]);

	const [formData, setFormData] = useState<ClientFormData>(initial);
	const [isFetchingCep, setIsFetchingCep] = useState(false);

	const isDirty = JSON.stringify(formData) !== JSON.stringify(initial);

	const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
		const cep = onlyDigits(e.target.value);
		if (cep.length !== 8) return;
		setIsFetchingCep(true);
		try {
			const data = await cepService.fetchCep(cep);
			if (data) {
				// nomes do ViaCEP -> nomes do type Client
				setFormData(prev => ({
					...prev,
					street: data.logradouro,
					district: data.bairro,
					city: data.localidade,
					state: toUF(data.uf) ?? prev.state,
				}));
			}
		} finally {
			setIsFetchingCep(false);
		}
	};

	/**
	 * Espalhe num input: <input {...bind('city')} />
	 * Com máscara: <input {...bind('cep', maskCep)} />
	 * A máscara vale só para exibir — o state sempre guarda dígitos crus.
	 */
	const bind = (name: keyof ClientFormData, mask?: Mask) => ({
		name,
		value: mask ? mask(formData[name] ?? '') : (formData[name] ?? ''),
		onChange: (e: React.ChangeEvent<FormEl>) => {
			const raw = e.target.value;
			setFormData(prev => ({ ...prev, [name]: mask ? onlyDigits(raw) : raw }));
		},
	});

	return { formData, bind, isDirty, isFetchingCep, handleCepBlur };
}

export type ClientFormBinding = ReturnType<typeof useClientForm>;
