import { defineRouting } from 'next-intl/routing'
import { createSharedPathnamesNavigation } from 'next-intl/navigation'
import { getRequestConfig } from 'next-intl/server'


export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['en', 'es', 'fr', 'de', 'it', 'pt', 'tr', 'ja'],
  
  // Used when no locale matches
  defaultLocale: 'en',
  
  // Always show the locale in the URL
  localePrefix: 'always'
})

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter } =
  createSharedPathnamesNavigation(routing)

// Can be imported from a shared config
export const locales = routing.locales
export const defaultLocale = routing.defaultLocale

export type Locale = (typeof locales)[number]

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale
  
  // Validate that the incoming `locale` parameter is valid
  if (!locale || !locales.includes(locale as any)) {
    locale = defaultLocale
  }

  // Load all translation files
  const [common, payments, threeDs, kyc, promo, games, transactions, faq, rules, about, profile, dashboard, auth, home] = await Promise.all([
    import(`./locales/${locale}/common.json`),
    import(`./locales/${locale}/payments.json`),
    import(`./locales/${locale}/3ds.json`),
    import(`./locales/${locale}/kyc.json`),
    import(`./locales/${locale}/promo.json`),
    import(`./locales/${locale}/games.json`),
    import(`./locales/${locale}/transactions.json`),
    import(`./locales/${locale}/faq.json`),
    import(`./locales/${locale}/rules.json`),
    import(`./locales/${locale}/about.json`),
    import(`./locales/${locale}/profile.json`),
    import(`./locales/${locale}/dashboard.json`),
    import(`./locales/${locale}/auth.json`),
    import(`./locales/${locale}/home.json`)
  ])

  return {
    locale,
    messages: {
      ...common.default,
      payments: payments.default,
      "3ds": threeDs.default,
      kyc: kyc.default,
      promo: promo.default,
      games: games.default,
      transactions: transactions.default,
      faq: faq.default,
      rules: rules.default,
      about: about.default,
      profile: profile.default,
      dashboard: dashboard.default,
      auth: auth.default,
      home: home.default
    }
  }
})


