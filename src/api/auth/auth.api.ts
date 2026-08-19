import { apiFetch, setToken } from '../client';
import type { LoginResponse, MeResponse } from './auth.types';

const ENDPOINT = '/auth';

export async function login(username: string, password: string): Promise<LoginResponse> {
  const formData = new FormData();

  formData.append('username', username);
  formData.append('password', password);

  const data = await apiFetch<LoginResponse>(`${ENDPOINT}/login`, {
    method: 'POST',
    body: formData,
  });

  setToken(data.access_token);

  return data;
}

// Usado para validar/restaurar a sessão quando o app abre com um token salvo
export function getMe(): Promise<MeResponse> {
  return apiFetch(`${ENDPOINT}/me`);
}
