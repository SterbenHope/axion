"use client"

import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useLocale } from "next-intl"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const locale = useLocale()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/${locale}/auth/login`)
    }
  }, [user, isLoading, router, locale])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black cyber-grid flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-cyan-400 animate-spin mx-auto mb-4" />
          <div className="text-white text-lg">Loading...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
