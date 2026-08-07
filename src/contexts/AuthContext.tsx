import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authService } from '../services/authService';
import { getToken, clearToken, setUnauthorizedHandler } from '../services/api';
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
  const [user, setUser] = useState<User| null>(null);
  const [isLoading, setIsLoading] = useState(true);

  function signOut() {
    setUser(null);
    clearToken();
  }

  useEffect(() => {
    // Se qualquer chamada à API voltar 401 (token expirado/inválido), desloga.
    setUnauthorizedHandler(signOut);

    async function restoreSession() {
      const token = getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        // Valida o token salvo contra o backend, em vez de confiar cegamente
        // no localStorage (o mock antigo nunca checava se o token ainda era válido).
        const me = await authService.me();
        setUser(me);
      } catch {
        clearToken();
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  async function signIn(email: string, pass: string) {
    await authService.login(email, pass);
    const me = await authService.me();
    
    const user: User = {
      id: me.id,
      name: me.name,
      roles: me.roles
    }
    setUser(user);
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
