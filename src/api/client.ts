import { env } from '../environment';

const API_URL = env.apiUrl;

export const API_BASE_URL = API_URL;

const TOKEN_KEY = '@AppGestaoMEI:token';

let onUnauthorized: (() => void) | null = null;


export function setUnauthorizedHandler(handler: () => void) {
	onUnauthorized = handler;
}

export function getToken(): string | null {
	return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
	localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
	localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
	status: number;
	constructor(message: string, status: number) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
	}
}

interface FastApiErrorBody {
	detail?: string | { msg: string; loc?: string[] }[];
}

function extractMessage(body: FastApiErrorBody | null, fallback: string): string {
	if (!body || !body.detail) return fallback;
	if (typeof body.detail === 'string') return body.detail;
	if (Array.isArray(body.detail)) return body.detail.map(d => d.msg).join(' | ');
	return fallback;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
	const token = getToken();

	const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

	const headers: HeadersInit = {
		...(isFormData ? {} : { 'Content-Type': 'application/json' }),
		...(options.headers || {}),
		...(token ? { Authorization: `Bearer ${token}` } : {}),
	};

	let response: Response;
	try {
		response = await fetch(`${API_URL}${path}`, { ...options, headers });
	} catch {
		throw new ApiError('Não foi possível conectar ao servidor. Verifique sua internet.', 0);
	}

	if (response.status === 204) {
		return undefined as T;
	}

	let body: any = null;
	try {
		body = await response.json();
	} catch {
		// resposta sem corpo (ex: alguns erros de rede/proxy)
	}

	if (!response.ok) {
		if (response.status === 401 && path !== '/auth/login' && onUnauthorized) {
			onUnauthorized();
		}
		throw new ApiError(extractMessage(body, 'Ocorreu um erro inesperado.'), response.status);
	}

	return body as T;
}
