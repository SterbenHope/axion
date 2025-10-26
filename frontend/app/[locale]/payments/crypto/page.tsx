'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Copy, Bitcoin, ExternalLink, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'

interface CryptoWallet {
  id: number
  currency: string
  network: string
  address: string
  is_active: boolean
}

export default function CryptoPaymentPage() {
  const { locale } = useParams() as { locale: string }
  const t = useTranslations('payments')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const [wallets, setWallets] = useState<CryptoWallet[]>([])
  const [loading, setLoading] = useState(true)
  const [amount, setAmount] = useState<string>('')
  const [selectedCurrency, setSelectedCurrency] = useState<string>('')

  useEffect(() => {
    const amountParam = searchParams.get('amount')
    if (amountParam) {
      setAmount(amountParam)
    }
    fetchCryptoWallets()
  }, [searchParams])

  const fetchCryptoWallets = async () => {
    try {
      // Since the backend endpoint was removed, we'll use static data for now
      const staticWallets = [
        {
          id: 1,
          currency: 'BTC',
          network: 'Bitcoin',
          address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          is_active: true
        },
        {
          id: 2,
          currency: 'ETH',
          network: 'Ethereum',
          address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
          is_active: true
        },
        {
          id: 3,
          currency: 'USDT',
          network: 'Tron',
          address: 'TQn9Y2khDD95J42FQtQTdwVVRKqoF3fJqk',
          is_active: true
        },
        {
          id: 4,
          currency: 'USDC',
          network: 'Ethereum',
          address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
          is_active: true
        }
      ]
      setWallets(staticWallets)
    } catch (error) {
      console.error('Error loading crypto wallets:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied!",
        description: "Address copied to clipboard",
      })
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const getCurrencyIcon = (currency: string) => {
    switch (currency.toLowerCase()) {
      case 'btc':
        return <Bitcoin className="h-6 w-6 text-orange-500" />
      case 'eth':
        return <div className="h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">ETH</div>
      case 'usdt':
        return <div className="h-6 w-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">USDT</div>
      case 'usdc':
        return <div className="h-6 w-6 bg-blue-400 rounded-full flex items-center justify-center text-white text-xs font-bold">USDC</div>
      default:
        return <div className="h-6 w-6 bg-gray-500 rounded-full flex items-center justify-center text-white text-xs font-bold">{currency}</div>
    }
  }

  const getNetworkColor = (network: string) => {
    switch (network.toLowerCase()) {
      case 'bitcoin':
        return 'border-orange-500/30 text-orange-400'
      case 'ethereum':
        return 'border-blue-500/30 text-blue-400'
      case 'tron':
        return 'border-red-500/30 text-red-400'
      case 'bsc':
        return 'border-yellow-500/30 text-yellow-400'
      default:
        return 'border-gray-500/30 text-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
        <Header />
        <main className="pt-20 pb-10">
          <div className="max-w-4xl mx-auto px-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="pt-6">
                <div className="text-center text-gray-400">
                  Loading crypto wallets...
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <Header />
      <main className="pt-20 pb-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-white mb-4">
              <span className="text-green-400">Crypto</span> Payment
            </h1>
            <p className="text-xl text-gray-300">
              Send cryptocurrency to any of the addresses below
            </p>
            {amount && (
              <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg inline-block">
                <p className="text-green-400 font-mono text-lg">
                  Amount: {amount} EUR
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wallets.map((wallet) => (
              <Card key={wallet.id} className="bg-gray-900 border-gray-700 hover:border-gray-600 transition-all duration-300">
                <CardHeader className="text-center">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    {getCurrencyIcon(wallet.currency)}
                    <div>
                      <h3 className="text-xl font-bold text-white">{wallet.currency}</h3>
                      <Badge 
                        variant="outline" 
                        className={`${getNetworkColor(wallet.network)} text-xs`}
                      >
                        {wallet.network}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-400 text-center">Wallet Address</p>
                    <div className="bg-gray-800 p-3 rounded-lg border border-gray-600">
                      <p className="text-xs text-gray-300 font-mono break-all">
                        {wallet.address}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => copyToClipboard(wallet.address)}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white"
                      size="sm"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                    <Button
                      onClick={() => window.open(`https://blockchain.info/address/${wallet.address}`, '_blank')}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      size="sm"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </div>

                  <div className="text-center">
                    <Badge variant="outline" className="text-green-400 border-green-500/30">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Card className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-500/30 max-w-2xl mx-auto">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Bitcoin className="h-16 w-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">Important Notice</h3>
                  <p className="text-gray-300 mb-4">
                    Send only the specified amount to avoid processing delays. 
                    Make sure to use the correct network for your cryptocurrency.
                  </p>
                  <div className="space-y-2 text-sm text-gray-400">
                    <p>• Double-check the wallet address before sending</p>
                    <p>• Use the correct network (Bitcoin, Ethereum, etc.)</p>
                    <p>• Transaction may take 10-30 minutes to confirm</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

