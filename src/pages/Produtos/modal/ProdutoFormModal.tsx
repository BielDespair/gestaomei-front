import React, { useEffect, useRef, useState } from 'react';
import type { Product } from '../../../api/products/products.types';
import { useAddProduct, useUpdateProduct, useRemoveProductImage } from '../../../api/products/products.queries';
import { ModalShell } from '../../../components/ModalShell';
import { useFeedback } from '../../../components/Feedback/FeedbackProvider';

export type ModalMode = 'view' | 'edit';

interface Props {
	/** null = novo produto */
	product: Product | null;
	mode?: ModalMode;
	onClose: () => void;
}

const EMPTY = { name: '', description: '', sku: '', sellPrice: '' };

export function ProdutoFormModal({ product, mode = 'edit', onClose }: Props) {
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

	const [isEditing, setIsEditing] = useState(mode === 'edit' || !product);
	const [isSaving, setIsSaving] = useState(false);
	/** Intenção de remover: só é executada ao salvar. */
	const [removerImagem, setRemoverImagem] = useState(false);

	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);

	const { sucesso, erro } = useFeedback();
	const addProduct = useAddProduct();
	const updateProduct = useUpdateProduct();
	const removeImage = useRemoveProductImage();

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
		// Escolher uma foto nova cancela a remoção pendente.
		setRemoverImagem(false);
		setImageFile(file);
		setImagePreview(URL.createObjectURL(file));
	};

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

			if (product) {
				await updateProduct.mutateAsync({ id: product.id, data: payload });
			} else {
				await addProduct.mutateAsync(payload);
			}

			// O PUT não mexe na imagem quando nenhum arquivo é enviado;
			// a remoção é um endpoint próprio, chamado só agora.
			if (product && removerImagem && !imageFile) {
				await removeImage.mutateAsync(product.id);
			}
			sucesso(product ? 'Produto atualizado.' : 'Produto cadastrado.');
			onClose();
		} catch (err: any) {
			erro(err?.message || 'Não foi possível salvar o produto.');
		} finally {
			setIsSaving(false);
		}
	}

	// Preview local tem prioridade; remoção pendente esconde a foto atual.
	const fotoSalva = removerImagem ? null : (product?.imageUrl ?? null);
	const fotoExibida = imagePreview ?? fotoSalva;
	const ro = { readOnly: !isEditing, className: 'form-control' };

	return (
		<ModalShell
			title={product ? product.name : 'Novo produto'}
			onClose={onClose}
			onSubmit={isEditing ? handleSubmit : undefined}
			footer={isEditing ? (
				<>
					<button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
					<button type="submit" className="btn btn-primary" disabled={isSaving}>
						{isSaving ? 'Salvando…' : 'Salvar'}
					</button>
				</>
			) : (
				<>
					<button type="button" className="btn btn-secondary" onClick={onClose}>Fechar</button>
					<button type="button" className="btn btn-warning" onClick={() => setIsEditing(true)}>
						Editar
					</button>
				</>
			)}
		>
			<div className="mb-4 text-center">
				<div
					className="produto-foto-preview mx-auto mb-2"
					onClick={isEditing ? () => fileInputRef.current?.click() : undefined}
					role={isEditing ? 'button' : undefined}
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
					{isEditing && (
						<button
							type="button"
							className="btn btn-sm btn-outline-primary"
							onClick={() => fileInputRef.current?.click()}
						>
							{fotoExibida ? 'Trocar foto' : 'Adicionar foto'}
						</button>
					)}

					{isEditing && product?.imageUrl && !imageFile && (
						removerImagem ? (
							<button
								type="button"
								className="btn btn-sm btn-outline-secondary"
								onClick={() => setRemoverImagem(false)}
							>
								Desfazer remoção
							</button>
						) : (
							<button
								type="button"
								className="btn btn-sm btn-outline-danger"
								onClick={() => setRemoverImagem(true)}
							>
								Remover foto
							</button>
						)
					)}
				</div>

				{removerImagem && !imageFile && (
					<small className="text-danger d-block mt-2">
						A foto será removida ao salvar.
					</small>
				)}
			</div>

			<div className="row g-3">
				<div className="col-md-8">
					<label className="form-label">Nome</label>
					<input
						{...ro}
						name="name"
						value={formData.name}
						onChange={handleInputChange}
						required
					/>
				</div>
				<div className="col-md-4">
					<label className="form-label">SKU</label>
					<input
						{...ro}
						name="sku"
						value={formData.sku}
						onChange={handleInputChange}
						required
					/>
				</div>
				<div className="col-12">
					<label className="form-label">Descrição</label>
					<input
						{...ro}
						name="description"
						value={formData.description}
						onChange={handleInputChange}
					/>
				</div>
				<div className="col-md-6">
					<label className="form-label">Preço de venda (R$)</label>
					<input
						type="number"
						step="0.01"
						className="form-control"
						name="sellPrice"
						value={formData.sellPrice}
						onChange={handleInputChange}
						required
					/>
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
