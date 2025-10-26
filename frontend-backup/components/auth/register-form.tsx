"use client"

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Zap, Gift } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { useTranslations } from "next-intl"
import { useAuth } from "@/hooks/use-auth"

function SubmitButton() {
  const { pending } = useFormStatus()
  const t = useTranslations()

  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white py-6 text-lg font-medium rounded-lg h-[60px] transition-all duration-300"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          {t('auth.creatingAccount')}
        </>
      ) : (
        <>
          <Gift className="mr-2 h-5 w-5" />
          {t('auth.createAccount')}
        </>
      )}
    </Button>
  )
}

export default function RegisterForm() {
  const router = useRouter()
  const { signUp } = useAuth()
  const [state, setState] = useState<any>(null)
  const t = useTranslations()

  const handleSubmit = async (formData: FormData) => {
    try {
      const username = formData.get("username")?.toString()
      const email = formData.get("email")?.toString()
      const password = formData.get("password")?.toString()
      const fullName = formData.get("fullName")?.toString()
      const promoCode = formData.get("promoCode")?.toString()

      if (!username || !email || !password) {
        setState({ error: "Username, email and password are required" })
        return
      }

      // Use the useAuth hook for registration
      const result = await signUp(email, password, username, fullName)
      setState(result)
      
      if (result.success) {
        // Show success message and redirect to login
        setTimeout(() => {
          router.push("/en/auth/login")
        }, 2000)
      }
    } catch (error) {
      setState({ error: "An error occurred during registration" })
    }
  }

  return (
    <Card className="w-full max-w-md bg-black/50 border-purple-500/30 backdrop-blur-sm">
      <CardHeader className="space-y-4 text-center">
        <div className="flex items-center justify-center space-x-2">
          <Zap className="h-8 w-8 text-purple-400 animate-pulse-neon" />
          <CardTitle className="text-3xl font-bold text-white">NeonCasino</CardTitle>
        </div>
        <CardDescription className="text-lg text-purple-300">{t('auth.joinRevolution')}</CardDescription>
      </CardHeader>

      <CardContent>
        <form action={handleSubmit} className="space-y-6">
          {state?.error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg backdrop-blur-sm">
              {state.error}
            </div>
          )}

          {state?.success && (
            <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg backdrop-blur-sm">
              {state.success}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
                              <label htmlFor="username" className="block text-sm font-medium text-purple-300">
                  {t('auth.username')}
                </label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="cyberpunk_gamer"
                required
                className="bg-black/50 border-purple-500/30 text-white placeholder:text-gray-500 focus:border-purple-400 focus:ring-purple-400/20"
              />
            </div>
            <div className="space-y-2">
                              <label htmlFor="email" className="block text-sm font-medium text-purple-300">
                  {t('auth.email')}
                </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="cyber@neoncasino.com"
                required
                className="bg-black/50 border-purple-500/30 text-white placeholder:text-gray-500 focus:border-purple-400 focus:ring-purple-400/20"
              />
            </div>
            <div className="space-y-2">
                              <label htmlFor="fullName" className="block text-sm font-medium text-purple-300">
                  {t('auth.fullName')} (Optional)
                </label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Cyber Gamer"
                className="bg-black/50 border-purple-500/30 text-white placeholder:text-gray-500 focus:border-purple-400 focus:ring-purple-400/20"
              />
            </div>
            <div className="space-y-2">
                              <label htmlFor="password" className="block text-sm font-medium text-purple-300">
                  {t('auth.password')}
                </label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                className="bg-black/50 border-purple-500/30 text-white focus:border-purple-400 focus:ring-purple-400/20"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="promoCode" className="block text-sm font-medium text-purple-300">
                {t('auth.promoCode')}
              </label>
              <Input
                id="promoCode"
                name="promoCode"
                type="text"
                placeholder={t('auth.promoCodePlaceholder')}
                className="bg-black/50 border-purple-500/30 text-white placeholder:text-gray-500 focus:border-purple-400 focus:ring-purple-400/20"
              />
            </div>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/30 text-purple-300 px-4 py-3 rounded-lg backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <Gift className="h-5 w-5 text-purple-400" />
                                <span className="text-sm font-medium">{t('auth.welcomeBonus')}</span>
            </div>
            <p className="text-xs mt-1">{t('auth.welcomeBonusDesc')}</p>
          </div>

          <SubmitButton />

          <div className="text-center text-gray-400">
            {t('auth.alreadyHaveAccount')}{" "}
            <Link href="/en/auth/login" className="text-purple-400 hover:text-purple-300 transition-colors">
              {t('auth.signIn')}
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
