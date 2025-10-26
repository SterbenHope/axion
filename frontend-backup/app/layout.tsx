import './globals.css'
import { AuthProvider } from '@/hooks/use-auth'

export const metadata = {
  title: 'NeonCasino',
  description: 'Cyberpunk casino with NeonCoins',
}

export default function RootLayout({
  children,
}: {
 children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-black text-white antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
