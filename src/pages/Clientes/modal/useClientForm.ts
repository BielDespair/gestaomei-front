import React, { useMemo, useState } from 'react';
import type { Client } from '../../../api/clients/clients.types';
import { useFetchCep } from '../../../api/cep/cep.queries';
import { onlyDigits } from '../../../utils/format';
import { toUF } from '../../../constants/estados';

export type ClientFormData = Omit<Client, 'id' | 'debts'>;

type FormEl = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
type Mask = (v: string) => string;

const EMPTY: ClientFormData = {
	name: '',
	description: '',
	email: '',
	document: '',
	pix: '',
	phoneNumber: '',
	cep: '',
	street: '',
	number: '',
	complement: '',
 	district: '',
	city: 'Uberlândia',
	state: 'MG',
};

export function useClientForm(client: Client | null) {

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
	const fetchCep = useFetchCep();

	const isDirty = JSON.stringify(formData) !== JSON.stringify(initial);

	const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
		const cep = onlyDigits(e.target.value);
		if (cep.length !== 8) return;
		const data = await fetchCep.mutateAsync(cep);
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
	};
	
	const bind = (name: keyof ClientFormData, mask?: Mask) => ({
		name,
		value: mask ? mask(formData[name] ?? '') : (formData[name] ?? ''),
		onChange: (e: React.ChangeEvent<FormEl>) => {
			const raw = e.target.value;
			setFormData(prev => ({ ...prev, [name]: mask ? onlyDigits(raw) : raw }));
		},
	});

	return { formData, bind, isDirty, isFetchingCep: fetchCep.isPending, handleCepBlur };
}

export type ClientFormBinding = ReturnType<typeof useClientForm>;
