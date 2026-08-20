import { maskCep, maskDocument, maskPhone } from '../../../utils/format';
import { UFS_POR_NOME, UF_NOMES } from '../../../constants/estados';
import type { ClientFormBinding } from './useClientForm';

interface Props {
	form: ClientFormBinding;
	readOnly?: boolean;
}

export function DadosTab({ form, readOnly = false }: Props) {
	const { bind, isFetchingCep, handleCepBlur } = form;

	// Mesma caixinha nos dois modos; readOnly só impede a digitação.
	const ro = { readOnly, className: 'form-control' };

	return (
		<>
			<h6 className="text-primary mb-3">Dados básicos</h6>
			<div className="row g-3 mb-4">
				<div className="col-md-8">
					<label className="form-label">Nome completo</label>
					<input required autoComplete="off" {...ro} {...bind('name')} />
				</div>
				<div className="col-md-4">
					<label className="form-label">CPF / CNPJ</label>
					<input autoComplete="off" {...ro} {...bind('document', maskDocument)} />
				</div>
				<div className="col-md-4">
					<label className="form-label">Telefone</label>
					<input autoComplete="off" {...ro} {...bind('phoneNumber', maskPhone)} />
				</div>
				<div className="col-md-4">
					<label className="form-label">E-mail</label>
					<input type="email" autoComplete="off" {...ro} {...bind('email')} />
				</div>
				<div className="col-md-4">
					<label className="form-label">Chave PIX</label>
					<input autoComplete="off" {...ro} {...bind('pix')} />
				</div>
			</div>

			<h6 className="text-primary mb-3">Endereço</h6>
			<div className="row g-3 mb-4">
				<div className="col-md-3">
					<label className="form-label">CEP</label>
					<input
						placeholder="38400-000"
						autoComplete="off"
						onBlur={readOnly ? undefined : handleCepBlur}
						{...ro}
						{...bind('cep', maskCep)}
					/>
					{isFetchingCep && <small className="text-info">Buscando endereço…</small>}
				</div>
				<div className="col-md-7">
					<label className="form-label">Rua / avenida</label>
					<input autoComplete="off" {...ro} {...bind('street')} />
				</div>
				<div className="col-md-2">
					<label className="form-label">Número</label>
					<input autoComplete="off" {...ro} {...bind('number')} />
				</div>
				<div className="col-md-3">
					<label className="form-label">Complemento</label>
					<input autoComplete="off" {...ro} {...bind('complement')} />
				</div>
				<div className="col-md-3">
					<label className="form-label">Bairro</label>
					<input autoComplete="off" {...ro} {...bind('district')} />
				</div>
				<div className="col-md-4">
					<label className="form-label">Cidade</label>
					<input autoComplete="off" {...ro} {...bind('city')} />
				</div>
				<div className="col-md-2">
					<label className="form-label">UF</label>
					<select
						className="form-select"
						disabled={readOnly}
						autoComplete="off"
						{...bind('state')}
					>
						<option value="">--</option>
						{UFS_POR_NOME.map(uf => (
							<option key={uf} value={uf} title={UF_NOMES[uf]}>
								{uf}
							</option>
						))}
					</select>
				</div>
			</div>

			<h6 className="text-primary mb-3">Observações</h6>
			<textarea
				rows={2}
				placeholder="Primo do Carlos, dono da padaria da esquina"
				autoComplete="off"
				{...ro}
				{...bind('description')}
			/>
		</>
	);
}
