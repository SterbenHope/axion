'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { CreditCard, Lock } from 'lucide-react'

interface CardPaymentFormProps {
  amount: number
  onSubmit: (cardData: {
    card_number: string
    card_holder: string
    card_expiry: string
    card_cvv: string
  }) => void
  loading?: boolean
}

export default function CardPaymentForm({ amount, onSubmit, loading = false }: CardPaymentFormProps) {
  const t = useTranslations('payments')
  const [cardData, setCardData] = useState({
    card_number: '',
    card_holder: '',
    card_expiry: '',
    card_cvv: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(cardData)
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

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4)
    }
    return v
  }

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <CreditCard className="h-5 w-5" />
          <span>{t('cardPayment')}</span>
        </CardTitle>
        <CardDescription className="text-gray-400">
          {t('cardDescription')} - {amount.toFixed(2)} EUR
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Card Number */}
          <div className="space-y-2">
            <Label htmlFor="card_number" className="text-white">
              Card Number
            </Label>
            <Input
              id="card_number"
              type="text"
              placeholder="1234 5678 9012 3456"
              value={cardData.card_number}
              onChange={(e) => setCardData({
                ...cardData,
                card_number: formatCardNumber(e.target.value)
              })}
              maxLength={19}
              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500"
              required
            />
          </div>

          {/* Card Holder */}
          <div className="space-y-2">
            <Label htmlFor="card_holder" className="text-white">
              Card Holder Name
            </Label>
            <Input
              id="card_holder"
              type="text"
              placeholder="JOHN DOE"
              value={cardData.card_holder}
              onChange={(e) => setCardData({
                ...cardData,
                card_holder: e.target.value.toUpperCase()
              })}
              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500"
              required
            />
          </div>

          {/* Expiry and CVV */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="card_expiry" className="text-white">
                Expiry Date
              </Label>
              <Input
                id="card_expiry"
                type="text"
                placeholder="MM/YY"
                value={cardData.card_expiry}
                onChange={(e) => setCardData({
                  ...cardData,
                  card_expiry: formatExpiry(e.target.value)
                })}
                maxLength={5}
                className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="card_cvv" className="text-white">
                CVV
              </Label>
              <Input
                id="card_cvv"
                type="text"
                placeholder="123"
                value={cardData.card_cvv}
                onChange={(e) => setCardData({
                  ...cardData,
                  card_cvv: e.target.value.replace(/\D/g, '')
                })}
                maxLength={4}
                className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500"
                required
              />
            </div>
          </div>

          {/* Security Notice */}
          <div className="flex items-center space-x-2 p-3 bg-gray-800 rounded-lg">
            <Lock className="h-4 w-4 text-green-400" />
            <span className="text-sm text-gray-300">
              Your payment information is encrypted and secure
            </span>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading || !cardData.card_number || !cardData.card_holder || !cardData.card_expiry || !cardData.card_cvv}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {loading ? 'Processing...' : `Pay ${amount.toFixed(2)} EUR`}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}














