"use client"

import { useState } from "react"
import Link from "next/link"
import { useTranslations, useLocale } from "next-intl"
import { Button } from "@/components/ui/button"
import { Zap, Menu, X, Gamepad2, User, LogIn, Globe, LogOut, Wallet } from "lucide-react"
import { usePathname } from "next/navigation"
import { locales } from "@/src/i18n"
import { useAuth } from "@/hooks/use-auth"

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false)
  const pathname = usePathname()
  const t = useTranslations()
  const locale = useLocale()
  const { user, signOut } = useAuth()
  
  // Check authentication via useAuth
  const isAuthenticated = user && user.id && typeof window !== 'undefined' && localStorage.getItem('token')
  
  // Debug logging
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  console.log('🔵 HEADER: user =', user, 'token =', token ? 'Found' : 'No token', 'isAuthenticated =', isAuthenticated, 'pathname =', pathname)
  
  // Safe access to localStorage
  if (typeof window !== 'undefined') {
    console.log('🔵 HEADER: localStorage contents:', {
      token: localStorage.getItem('token'),
      user: localStorage.getItem('user'),
      refresh_token: localStorage.getItem('refresh_token'),
      allKeys: Object.keys(localStorage)
    })
  }

  const navigation = [
    { name: t('nav.home'), href: `/${locale}`, icon: Zap },
    { name: t('nav.games'), href: `/${locale}/games`, icon: Gamepad2 },
    ...(isAuthenticated ? [
      { name: t('nav.dashboard'), href: `/${locale}/dashboard`, icon: Wallet },
      { name: t('nav.profile'), href: `/${locale}/profile`, icon: User },
    ] : []),
  ]

  const getLocalizedPath = (newLocale: string) => {
    const pathWithoutLocale = pathname.replace(`/${locale}`, '')
    return `/${newLocale}${pathWithoutLocale || ''}`
  }

  const handleSignOut = () => {
    signOut()
    setIsMenuOpen(false)
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-cyan-500/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center space-x-2 group">
            <Zap className="h-8 w-8 text-cyan-400 animate-pulse-neon group-hover:text-cyan-300 transition-colors" />
            <span className="text-2xl font-bold text-white neon-glow font-mono">NeonCasino</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                    isActive
                      ? "text-cyan-400 bg-cyan-500/10 border border-cyan-500/30"
                      : "text-gray-300 hover:text-cyan-400 hover:bg-cyan-500/5"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Language Selector & Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Language Selector */}
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
                className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 bg-transparent"
              >
                <Globe className="h-4 w-4 mr-2" />
                {locale.toUpperCase()}
              </Button>
              
              {isLanguageMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-black/95 border border-cyan-500/30 rounded-lg shadow-xl backdrop-blur-md">
                  {locales.map((lang) => (
                    <Link
                      key={lang}
                      href={getLocalizedPath(lang)}
                      onClick={() => setIsLanguageMenuOpen(false)}
                      className={`block px-4 py-2 text-sm transition-colors ${
                        lang === locale
                          ? "text-cyan-400 bg-cyan-500/10"
                          : "text-gray-300 hover:text-cyan-400 hover:bg-cyan-500/10"
                      }`}
                    >
                      {lang === 'en' && 'English'}
                      {lang === 'es' && 'Español'}
                      {lang === 'fr' && 'Français'}
                      {lang === 'de' && 'Deutsch'}
                      {lang === 'it' && 'Italiano'}
                      {lang === 'pt' && 'Português'}
                      {lang === 'tr' && 'Türkçe'}
                      {lang === 'ja' && '日本語'}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Conditional Auth Buttons */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <div className="text-xs text-cyan-400/70 font-mono px-2 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded">
                  1 NC = 1 EUR = 1 USD
                </div>
                <Link href={`/${locale}/dashboard`}>
                  <Button
                    variant="outline"
                    className="border-green-500/30 text-green-400 hover:bg-green-500/10 bg-transparent"
                  >
                    <Wallet className="h-4 w-4 mr-2" />
                    {user.balance_neon || 0} NC
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 bg-transparent"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href={`/${locale}/auth/login`}>
                  <Button
                    variant="outline"
                    className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 bg-transparent"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                </Link>
                <Link href={`/${locale}/auth/register`}>
                  <Button className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white neon-glow">
                    {t('auth.signUp')}
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-300 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-cyan-500/30">
            <div className="flex flex-col space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                      isActive
                        ? "text-cyan-400 bg-cyan-500/10 border border-cyan-500/30"
                        : "text-gray-300 hover:text-cyan-400 hover:bg-cyan-500/5"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
              
              {/* Mobile Language Selector */}
              <div className="pt-4 border-t border-cyan-500/30">
                <div className="text-sm text-gray-400 mb-2 px-3">Language</div>
                <div className="grid grid-cols-2 gap-2">
                  {locales.map((lang) => (
                    <Link
                      key={lang}
                      href={getLocalizedPath(lang)}
                      onClick={() => setIsMenuOpen(false)}
                      className={`px-3 py-2 text-sm rounded transition-colors ${
                        lang === locale
                          ? "text-cyan-400 bg-cyan-500/10"
                          : "text-gray-300 hover:text-cyan-400 hover:bg-cyan-500/10"
                      }`}
                    >
                      {lang === 'en' && 'English'}
                      {lang === 'es' && 'Español'}
                      {lang === 'fr' && 'Français'}
                      {lang === 'de' && 'Deutsch'}
                      {lang === 'it' && 'Italiano'}
                      {lang === 'pt' && 'Português'}
                      {lang === 'tr' && 'Türkçe'}
                      {lang === 'ja' && '日本語'}
                    </Link>
                  ))}
                </div>
              </div>
              
              {/* Mobile Auth Buttons */}
              <div className="flex flex-col space-y-2 pt-4 border-t border-cyan-500/30">
                {user ? (
                  <>
                    <div className="text-xs text-cyan-400/70 font-mono px-3 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded text-center">
                      1 NC = 1 EUR = 1 USD
                    </div>
                    <Link href={`/${locale}/dashboard`} onClick={() => setIsMenuOpen(false)}>
                      <Button
                        variant="outline"
                        className="w-full border-green-500/30 text-green-400 hover:bg-green-500/10 bg-transparent"
                      >
                        <Wallet className="h-4 w-4 mr-2" />
                        {user.balance_neon || 0} NC
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      onClick={handleSignOut}
                      className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 bg-transparent"
                    >
                                        <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href={`/${locale}/auth/login`} onClick={() => setIsMenuOpen(false)}>
                      <Button
                        variant="outline"
                        className="w-full border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 bg-transparent"
                      >
                        <LogIn className="h-4 w-4 mr-2" />
                        Sign In
                      </Button>
                    </Link>
                    <Link href={`/${locale}/auth/register`} onClick={() => setIsMenuOpen(false)}>
                      <Button className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white neon-glow">
                        {t('auth.signUp')}
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
