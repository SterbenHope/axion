import createMiddleware from 'next-intl/middleware'
import { routing } from './src/i18n'

export default createMiddleware(routing)

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(de|en|es|fr|it|pt|tr|ja)/:path*']
}

