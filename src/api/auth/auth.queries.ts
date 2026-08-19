import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { login, getMe } from './auth.api';

export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
};

export const meQuery = () =>
  queryOptions({
    queryKey: authKeys.me(),
    queryFn: getMe,
    retry: false,
  });

export function useLogin() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) => login(username, password),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
}
