import { apiFetch, setToken } from './api';

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface MeResponse {
  id: number;
  name: string;
  roles: string[];
}

export const authService = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const formData = new FormData();

    formData.append("username", username);
    formData.append("password", password);

    const data = await apiFetch<LoginResponse>("/auth/login", {
      method: "POST",
      body: formData,
    });

    setToken(data.access_token);

    return data;
  },

  // Usado para validar/restaurar a sessão quando o app abre com um token salvo
  me: (): Promise<MeResponse> => apiFetch('/auth/me'),
};
