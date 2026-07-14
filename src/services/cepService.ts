import { apiFetch, ApiError } from './api';

export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export const cepService = {
  fetchCep: async (cep: string): Promise<ViaCepResponse | null> => {
    const cleanCep = cep.replace(/\D/g, '');

    if (cleanCep.length !== 8) return null;

    try {
      // Vai pro backend (GET /cep/{cep}), que faz o proxy pro ViaCEP.
      // Isso evita CORS/lentidão direto no tablet e centraliza a chamada externa.
      return await apiFetch<ViaCepResponse>(`/cep/${cleanCep}`);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 404 || error.status === 400)) {
        return null; // CEP inválido ou não encontrado — mesmo comportamento de antes
      }
      console.error('Erro ao buscar o CEP:', error);
      return null;
    }
  },
};
