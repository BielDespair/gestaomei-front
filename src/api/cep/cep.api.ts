import { apiFetch, ApiError } from '../client';
import type { ViaCepResponse } from './cep.types';

const ENDPOINT = '/cep';

export async function fetchCep(cep: string): Promise<ViaCepResponse | null> {
  const cleanCep = cep.replace(/\D/g, '');

  if (cleanCep.length !== 8) return null;

  try {
    // Vai pro backend (GET /cep/{cep}), que faz o proxy pro ViaCEP.
    // Isso evita CORS/lentidão direto no tablet e centraliza a chamada externa.
    return await apiFetch<ViaCepResponse>(`${ENDPOINT}/${cleanCep}`);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) {
      return null; // CEP inválido ou não encontrado — mesmo comportamento de antes
    }
    console.error('Erro ao buscar o CEP:', error);
    return null;
  }
}
