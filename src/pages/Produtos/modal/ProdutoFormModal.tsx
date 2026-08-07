import React, { useEffect, useRef, useState } from 'react';
import type { Product } from '../../../types/api/Product';
import { productService } from '../../../services/productService';
import { ModalShell } from '../../../components/ModalShell';
import { useFeedback } from '../../../components/Feedback/FeedbackProvider';

interface Props {
	/** null = novo produto */
	product: Product | null;
	onClose: () => void;
	onSaved: (product: Product) => void;
}

const EMPTY = { name: '', description: '', sku: '', sellPrice: '' };

export function ProdutoFormModal({ product, onClose, onSaved }: Props) {
	const [formData, setFormData] = useState(() =>
		product
			? {
				name: product.name,
				description: product.description ?? '',
				sku: product.sku,
				sellPrice: String(product.sellPrice),
			}
			: EMPTY
	);

	const [isSaving, setIsSaving] = useState(false);
	const [isRemovingImage, setIsRemovingImage] = useState(false);
	const [imagemSalva, setImagemSalva] = useState(product?.imageUrl ?? null);

	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);

	const { sucesso, erro, confirmar } = useFeedback();

	// Libera a URL do preview quando ela troca ou o modal fecha.
	useEffect(() => {
		return () => { if (imagePreview) URL.revokeObjectURL(imagePreview); };
	}, [imagePreview]);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({ ...prev, [name]: value }));
	};

	const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setImageFile(file);
		setImagePreview(URL.createObjectURL(file));
	};

	async function handleRemoveImage() {
		if (!product) return;

		const ok = await confirmar({
			title: 'Remover foto',
			message: <>Remover a foto de <strong>{product.name}</strong>?</>,
			confirmLabel: 'Remover foto',
			danger: true,
		});
		if (!ok) return;

		setIsRemovingImage(true);
		try {
			const atualizado = await productService.removeImage(product.id);
			setImagemSalva(null);
			onSaved(atualizado);
			sucesso('Foto removida.');
		} catch (err: any) {
			erro(err?.message || 'Não foi possível remover a foto.');
		} finally {
			setIsRemovingImage(false);
		}
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setIsSaving(true);
		try {
			const payload = {
				name: formData.name,
				description: formData.description,
				sku: formData.sku,
				sellPrice: parseFloat(formData.sellPrice),
				imageFile,
			};

			const salvo = product
				? await productService.updateProduct(product.id, payload)
				: await productService.addProduct(payload);

			onSaved(salvo);
			sucesso(product ? 'Produto atualizado.' : 'Produto cadastrado.');
			onClose();
		} catch (err: any) {
			erro(err?.message || 'Não foi possível salvar o produto.');
		} finally {
			setIsSaving(false);
		}
	}

	// Preview local tem prioridade sobre a foto já salva.
	const fotoExibida = imagePreview ?? imagemSalva;

	return (
		<ModalShell
			title={product ? 'Editar produto' : 'Novo produto'}
			onClose={onClose}
			onSubmit={handleSubmit}
			footer={
				<>
					<button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
					<button type="submit" className="btn btn-primary" disabled={isSaving || isRemovingImage}>
						{isSaving ? 'Salvando…' : 'Salvar'}
					</button>
				</>
			}
		>
			<div className="mb-4 text-center">
				<div
					className="produto-foto-preview mx-auto mb-2"
					onClick={() => fileInputRef.current?.click()}
					role="button"
				>
					{fotoExibida
						? <img src={fotoExibida} alt="Prévia do produto" />
						: <span className="text-muted">Toque para adicionar uma foto</span>}
				</div>

				<input
					ref={fileInputRef}
					type="file"
					accept="image/jpeg,image/png,image/webp"
					capture="environment"
					className="d-none"
					onChange={handleImageSelected}
				/>

				<div className="d-flex justify-content-center gap-2">
					<button
						type="button"
						className="btn btn-sm btn-outline-primary"
						onClick={() => fileInputRef.current?.click()}
					>
						{fotoExibida ? 'Trocar foto' : 'Adicionar foto'}
					</button>

					{imagemSalva && !imageFile && (
						<button
							type="button"
							className="btn btn-sm btn-outline-danger"
							disabled={isRemovingImage}
							onClick={handleRemoveImage}
						>
							{isRemovingImage ? 'Removendo…' : 'Remover foto'}
						</button>
					)}
				</div>
			</div>

			<div className="row g-3">
				<div className="col-md-8">
					<label className="form-label">Nome</label>
					<input
						className="form-control"
						name="name"
						value={formData.name}
						onChange={handleInputChange}
						required
					/>
				</div>
				<div className="col-md-4">
					<label className="form-label">SKU</label>
					<input
						className="form-control"
						name="sku"
						value={formData.sku}
						onChange={handleInputChange}
						required
					/>
				</div>
				<div className="col-12">
					<label className="form-label">Descrição</label>
					<input
						className="form-control"
						name="description"
						value={formData.description}
						onChange={handleInputChange}
					/>
				</div>
				<div className="col-md-6">
					<label className="form-label">Preço de venda</label>
					<div className="input-group">
						<span className="input-group-text">R$</span>
						<input
							type="number"
							step="0.01"
							inputMode="decimal"
							className="form-control"
							name="sellPrice"
							value={formData.sellPrice}
							onChange={handleInputChange}
							required
						/>
					</div>
				</div>
				<div className="col-md-6">
					<label className="form-label">Estoque atual</label>
					<input
						className="form-control"
						value={product ? `${product.stockQuantity} un` : '0 un'}
						disabled
						readOnly
					/>
					<small className="text-muted">
						Alterado apenas por entradas e vendas, para não dessincronizar os lotes.
					</small>
				</div>
			</div>
		</ModalShell>
	);
}
