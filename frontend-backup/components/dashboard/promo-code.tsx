"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Gift, CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useTranslations } from "next-intl"

export default function PromoCode() {
  const [promoCode, setPromoCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isError, setIsError] = useState(false)
  const { toast } = useToast()
  const t = useTranslations()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!promoCode.trim()) {
                 toast({
             title: t('promoCode.error'),
             description: t('promoCode.promoCodeRequired'),
             variant: "destructive",
           })
      return
    }

    setIsLoading(true)
    setIsSuccess(false)
    setIsError(false)

    try {
      const response = await fetch("http://localhost:8000/api/promo/redeem/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ promo_code: promoCode.trim() }),
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setIsSuccess(true)
                       toast({
                 title: t('promoCode.success'),
                 description: t('promoCode.activatedWithBonus', { bonusAmount: data.bonus_amount || '' }),
               })
        setPromoCode("")
      } else {
        const error = await response.json()
        setIsError(true)
                       toast({
                 title: t('promoCode.invalid'),
                 description: error.error || t('promoCode.invalidOrExpired'),
                 variant: "destructive",
               })
      }
    } catch (error) {
      setIsError(true)
               toast({
           title: t('promoCode.error'),
           description: t('promoCode.failedToActivate'),
           variant: "destructive",
         })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="bg-black/50 border-green-500/30">
      <CardHeader>
                       <CardTitle className="text-white flex items-center gap-2">
                 <Gift className="h-5 w-5 text-green-400" />
                 {t('promoCode.title')}
               </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
                               <label htmlFor="promoCode" className="block text-sm font-medium text-gray-300">
                     {t('promoCode.enterCode')}
                   </label>
            <div className="flex gap-2">
              <Input
                id="promoCode"
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                                   placeholder={t('promoCode.placeholder')}
                className="bg-black/50 border-green-500/30 text-white placeholder:text-gray-500 focus:border-green-400 focus:ring-green-400/20"
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={isLoading || !promoCode.trim()}
                className="bg-green-500 hover:bg-green-600 text-white px-6"
              >
                {isLoading ? (
                  t('promoCode.activating')
                ) : (
                  t('promoCode.activate')
                )}
              </Button>
            </div>
          </div>

          {isSuccess && (
            <div className="flex items-center gap-2 text-green-400 bg-green-500/10 border border-green-500/30 px-3 py-2 rounded-lg">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">{t('promoCode.activated')}</span>
            </div>
          )}

          {isError && (
            <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-2 rounded-lg">
              <XCircle className="h-4 w-4" />
              <span className="text-sm">{t('promoCode.invalid')}</span>
            </div>
          )}

          <div className="text-xs text-gray-400">
            <p>• {t('promoCode.info.title')}</p>
            <p>• {t('promoCode.info.oneTime')}</p>
            <p>• {t('promoCode.info.expiration')}</p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
