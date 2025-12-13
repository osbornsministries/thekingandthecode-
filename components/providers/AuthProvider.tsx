'use client';

import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';

interface AuthProviderProps {
  children: React.ReactNode;
  session?: Session | null; // Allow passing the session from server
}

export default function AuthProvider({ children, session }: AuthProviderProps) {
  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  );
}