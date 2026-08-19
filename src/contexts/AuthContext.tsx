import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { meQuery, authKeys, useLogin } from '../api/auth/auth.queries';
import { getToken, clearToken, setUnauthorizedHandler } from '../api/client';
import type { User } from '../types/models/User';

interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean; // true enquanto valida um token salvo ao abrir o app
  signIn: (email: string, pass: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [hasToken, setHasToken] = useState(() => !!getToken());
  const qc = useQueryClient();
  const login = useLogin();

  // Valida o token salvo contra o backend, em vez de confiar cegamente
  // no localStorage (o mock antigo nunca checava se o token ainda era válido).
  const { data: me, isPending, isError } = useQuery({
    ...meQuery(),
    enabled: hasToken,
  });

  const user: User | null = me ? { id: me.id, name: me.name, roles: me.roles } : null;
  const isLoading = hasToken && isPending;

  function signOut() {
    setHasToken(false);
    clearToken();
    qc.removeQueries({ queryKey: authKeys.me() });
  }

  useEffect(() => {
    // Se qualquer chamada à API voltar 401 (token expirado/inválido), desloga.
    setUnauthorizedHandler(signOut);
  }, []);

  useEffect(() => {
    if (hasToken && isError) {
      clearToken();
      setHasToken(false);
    }
  }, [hasToken, isError]);

  async function signIn(email: string, pass: string) {
    await login.mutateAsync({ username: email, password: pass });
    await qc.fetchQuery(meQuery());
    setHasToken(true);
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook customizado para facilitar o uso
export function useAuth() {
  return useContext(AuthContext);
}
