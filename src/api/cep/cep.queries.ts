import { useMutation } from '@tanstack/react-query';
import { fetchCep } from './cep.api';

export function useFetchCep() {
  return useMutation({
    mutationFn: (cep: string) => fetchCep(cep),
  });
}
