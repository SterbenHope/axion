"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Zap } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useTranslations } from "next-intl"

export default function LoginForm() {
  const router = useRouter()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const t = useTranslations()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const formData = new FormData(e.currentTarget)
      const email = formData.get("email")?.toString()
      const password = formData.get("password")?.toString()

      if (!email || !password) {
        setError("Email and password are required")
        return
      }

      // Use the useAuth hook for login
      const loginResult = await login(email, password)
      
      if (loginResult.success) {
        // Redirect to dashboard after successful login
        router.push("/en/dashboard")
      } else {
        setError(loginResult.error || "Login failed")
      }
    } catch (error) {
      setError("An error occurred during login")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md bg-black/50 border-cyan-500/30 backdrop-blur-sm">
      <CardHeader className="space-y-4 text-center">
        <div className="flex items-center justify-center space-x-2">
          <Zap className="h-8 w-8 text-cyan-400 animate-pulse-neon" />
          <CardTitle className="text-3xl font-bold text-white">NeonCasino</CardTitle>
        </div>
        <CardDescription className="text-lg text-cyan-300">{t('auth.welcomeToFuture')}</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg backdrop-blur-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-cyan-300">
                {t('auth.email')}
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="cyber@neoncasino.com"
                required
                disabled={loading}
                className="bg-black/50 border-cyan-500/30 text-white placeholder:text-gray-500 focus:border-cyan-400 focus:ring-cyan-400/20"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-cyan-300">
                {t('auth.password')}
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                disabled={loading}
                className="bg-black/50 border-cyan-500/30 text-white focus:border-cyan-400 focus:ring-cyan-400/20"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white py-6 text-lg font-medium rounded-lg h-[60px] transition-all duration-300"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {t('auth.signingIn')}
              </>
            ) : (
              <>
                <Zap className="mr-2 h-5 w-5" />
                {t('auth.enterNeonCasino')}
              </>
            )}
          </Button>

          <div className="text-center text-gray-400">
            {t('auth.noAccount')}{" "}
            <Link href="/en/auth/register" className="text-cyan-400 hover:text-cyan-300 transition-colors">
              {t('auth.signUp')}
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
