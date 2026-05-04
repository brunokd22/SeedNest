import { useEffect } from 'react';
import type { AuthUser } from '@seednest/shared';
import { api } from '@/lib/api';
import { clearToken, getToken } from '@/lib/auth';
import { useAuthStore } from '@/store/auth-store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    async function checkSession() {
      try {
        const token = await getToken();
        if (!token) {
          clearAuth();
          return;
        }
        const response = await api.get<{ user?: AuthUser }>('/api/auth/get-session');
        if (response.data?.user) {
          setAuth(response.data.user, token);
        } else {
          await clearToken();
          clearAuth();
        }
      } catch {
        await clearToken();
        clearAuth();
      }
    }
    checkSession();
  }, []);

  return <>{children}</>;
}
