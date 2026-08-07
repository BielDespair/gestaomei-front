import React, { useState } from 'react';
import type { Client } from '../../../types/api/Client';
import { ModalShell } from '../../../components/ModalShell';
import { DadosTab } from './DadosTab';
import { DividasTab } from './DividasTab';
import { ComprasTab } from './ComprasTab';
import { useClientForm, type ClientFormData } from './useClientForm';

export enum ActiveTab {
	Details = 'details',
	Debts = 'debts',
	Purchases = 'purchases',
}

export type ModalMode = 'view' | 'edit';

export interface TabProps {
	client: Client;
	/** Recarrega o cliente do servidor (após pagamento, por exemplo). */
	onRefresh: () => void;
}

const TABS: { id: ActiveTab; label: string }[] = [
	{ id: ActiveTab.Details, label: 'Dados' },
	{ id: ActiveTab.Debts, label: 'Débitos' },
	{ id: ActiveTab.Purchases, label: 'Compras' },
];

interface Props {
	/** null = novo cliente (sempre em modo edição) */
	client: Client | null;
	tab: ActiveTab;
	mode: ModalMode;
	onClose: () => void;
	onSave: (data: ClientFormData) => Promise<void>;
	onRefresh: () => void;
}

export default function ClienteModal({ client, tab, mode, onClose, onSave, onRefresh }: Props) {
	const [activeTab, setActiveTab] = useState<ActiveTab>(tab);
	const [isEditing, setIsEditing] = useState(mode === 'edit' || !client);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState('');
	const form = useClientForm(client);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setIsSaving(true);
		try {
			await onSave(form.formData);
			onClose();
		} catch (err: any) {
			setError(err?.message || 'Não foi possível salvar o cliente.');
			setActiveTab(ActiveTab.Details);
		} finally {
			setIsSaving(false);
		}
	};

	const footer = isEditing ? (
		<>
			<button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
			<button type="submit" className="btn btn-primary" disabled={isSaving || !form.isDirty}>
				{isSaving ? 'Salvando…' : client ? 'Salvar alterações' : 'Salvar cliente'}
			</button>
		</>
	) : (
		<>
			<button type="button" className="btn btn-secondary" onClick={onClose}>Fechar</button>
			<button type="button" className="btn btn-primary" onClick={() => { setActiveTab(ActiveTab.Details); setIsEditing(true); }}>
				<i className="bi bi-pencil me-1" aria-hidden="true" /> Editar
			</button>
		</>
	);

	return (
		<ModalShell
			title={client ? client.name : 'Novo cliente'}
			size="xl"
			onClose={onClose}
			onSubmit={handleSubmit}
			footer={footer}
		>
			{error && <div className="alert alert-danger">{error}</div>}

			{/* Cliente novo não tem débito nem histórico: sem abas. */}
			{client && (
				<ul className="nav nav-tabs mb-4">
					{TABS.map(t => (
						<li className="nav-item" key={t.id}>
							<button
								type="button"
								className={`nav-link ${activeTab === t.id ? 'active' : ''}`}
								onClick={() => setActiveTab(t.id)}
							>
								{t.label}
							</button>
						</li>
					))}
				</ul>
			)}

			{/* O form vive no hook, então trocar de aba não perde o que foi digitado. */}
			<div hidden={activeTab !== ActiveTab.Details}>
				<DadosTab form={form} readOnly={!isEditing} />
			</div>

			{client && activeTab === ActiveTab.Debts && <DividasTab client={client} onRefresh={onRefresh} />}
			{client && activeTab === ActiveTab.Purchases && <ComprasTab client={client} onRefresh={onRefresh} />}
		</ModalShell>
	);
}
