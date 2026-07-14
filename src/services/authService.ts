import { apiFetch, setToken } from './api';

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    name: string;
  };
}

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const data = await apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    return data;
  },

  // Usado para validar/restaurar a sessão quando o app abre com um token salvo
  me: (): Promise<LoginResponse['user']> => apiFetch('/auth/me'),
};
