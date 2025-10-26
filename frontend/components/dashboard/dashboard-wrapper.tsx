'use client'

import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useEffect } from 'react'
import { Loader2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DashboardWrapperProps {
  children: React.ReactNode
  t: any
  user?: any
}

export function DashboardWrapper({ children, t }: DashboardWrapperProps) {
  const locale = useLocale()
  const router = useRouter()
  const { user, loading, refreshUser } = useAuth()

  useEffect(() => {
    if (user) {
      refreshUser()
    }
  }, [user, refreshUser])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black cyber-grid flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">{t('dashboard.loadingDashboard')}</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black cyber-grid flex items-center justify-center">
        <div className="text-center">
          <User className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-white text-lg mb-4">{t('dashboard.profileNotFound')}</p>
          <Button onClick={() => router.push(`/${locale}/auth/login`)}>
            {t('auth.signIn')}
          </Button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
