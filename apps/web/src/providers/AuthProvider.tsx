'use client';

import { createContext, useContext } from 'react';
import { authClient } from '@/lib/auth-client';

type SessionHook = ReturnType<(typeof authClient)['useSession']>;

const AuthContext = createContext<SessionHook | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const session = authClient.useSession();
  return <AuthContext.Provider value={session}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
