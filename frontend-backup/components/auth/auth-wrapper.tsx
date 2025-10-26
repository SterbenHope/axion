'use client'

import { AuthProvider } from '@/hooks/use-auth'

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}


