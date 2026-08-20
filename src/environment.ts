const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Onde os arquivos estáticos (fotos de produto, etc.) são servidos. O backend
// devolve só a key (ex: "products/especial_po.jpg"), quem monta a URL completa
// é o front. Hoje é o wwwroot da própria API, mas fica configurável à parte
// pra não quebrar se um dia isso for pra um storage separado (S3, CDN...).
const imagesUrl = import.meta.env.VITE_IMAGES_URL || `${apiUrl}/images`;

export const env = {
	apiUrl,
	imagesUrl,
};
