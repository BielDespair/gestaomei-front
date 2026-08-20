import { env } from '../environment';

/** O backend devolve só a key do arquivo (ex: "products/foo.jpg"); aqui monta a URL completa pra exibir. */
export function getImageUrl(key: string | null | undefined): string | null {
	if (!key) return null;
	return `${env.imagesUrl}/${key}`;
}
