import type { Metadata } from 'next'
import { Orbitron } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { locales } from '@/src/i18n'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'

import { AuthWrapper } from '@/components/auth/auth-wrapper'
import '../globals.css'

const orbitron = Orbitron({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-orbitron',
})

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  return {
    title: 'NeonCasino - Future of Gaming',
    description: 'Experience the future of gaming with neon aesthetics and cutting-edge technology',
    viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
    themeColor: '#000000',
    manifest: '/manifest.json',
    alternates: {
      canonical: `/${locale}`,
      languages: {
        'en': '/en',
        'es': '/es',
        'fr': '/fr',
        'de': '/de',
        'it': '/it',
        'pt': '/pt',
        'tr': '/tr',
        'ja': '/ja',
      },
    },
  }
}

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  const messages = await getMessages()

  return (
    <html lang={locale} className={`${orbitron.variable} dark`} suppressHydrationWarning>
      <body className="min-h-screen bg-black text-white antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
            <NextIntlClientProvider messages={messages}>
              <AuthWrapper>
                {children}
                <Toaster />
              </AuthWrapper>
            </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
