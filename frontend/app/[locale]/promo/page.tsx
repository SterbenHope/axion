'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'
import { Gift, Star, Users, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface PromoCode {
  code: string
  name: string
  description: string
  promo_type: string
  bonus_amount: number
  bonus_percentage: number
  max_bonus: number
  min_deposit: number
  free_spins: number
  valid_until: string | null
  terms_conditions: string
}

export default function PromoPage() {
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [redeeming, setRedeeming] = useState<string | null>(null)
  const [promoInput, setPromoInput] = useState('')
  const { t } = useTranslation()

  useEffect(() => {
    if (isAuthenticated) {
      fetchPromoCodes()
    } else {
      setLoading(false)
    }
  }, [isAuthenticated])

  const fetchPromoCodes = async () => {
    try {
      const response = await fetch('/api/promo/list/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setPromoCodes(data.available_codes || [])
      } else {
        console.error('Failed to fetch promo codes')
      }
    } catch (error) {
      console.error('Error fetching promo codes:', error)
    } finally {
      setLoading(false)
    }
  }

  const redeemPromoCode = async (code: string) => {
    if (!isAuthenticated) {
      toast({
        title: t('authenticationRequired'),
        description: t('loginToUsePromocodes'),
        variant: "destructive"
      })
      return
    }

    setRedeeming(code)
    try {
      const response = await fetch('/api/promo/validate/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ code })
      })

      const data = await response.json()
      
      if (response.ok) {
        toast({
          title: t('promocodeActivated'),
          description: data.message,
          variant: "default"
        })
        // Refresh promo codes
        fetchPromoCodes()
      } else {
        toast({
          title: "Error",
          description: data.error || t('failedToActivatePromocode'),
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: t('errorActivatingPromocode'),
        variant: "destructive"
      })
    } finally {
      setRedeeming(null)
    }
  }

  const handleCustomPromo = async () => {
    if (!promoInput.trim()) return
    
    await redeemPromoCode(promoInput.trim().toUpperCase())
    setPromoInput('')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-500 mx-auto"></div>
          <p className="mt-4 text-xl">{t('loadingPromocodes')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white neon-glow mb-4 font-mono">
              🎁 <span className="text-cyan-400">{t('promocodes')}</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              {t('activatePromocodesDescription')}
            </p>
          </motion.div>

          {/* Custom Promo Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-md mx-auto mb-16"
          >
            <Card className="bg-black/50 border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-cyan-400 text-center">{t('enterPromocode')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder={t('enterPromocodeCode')}
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    className="bg-gray-900 border-cyan-500/30 text-white placeholder-gray-400"
                    onKeyPress={(e) => e.key === 'Enter' && handleCustomPromo()}
                  />
                  <Button
                    onClick={handleCustomPromo}
                    disabled={!promoInput.trim() || redeeming === promoInput.trim().toUpperCase()}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                  >
                    {redeeming === promoInput.trim().toUpperCase() ? 'Activating...' : 'Activate'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Available Promo Codes */}
          {promoCodes.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {promoCodes.map((promo, index) => (
                <motion.div
                  key={promo.code}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 + index * 0.1 }}
                >
                  <Card className="bg-black/50 border-cyan-500/30 hover:border-cyan-500/60 transition-all duration-300 group hover:transform hover:scale-105">
                    <CardHeader className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center group-hover:animate-pulse-neon">
                        <Gift className="h-8 w-8 text-white" />
                      </div>
                      <CardTitle className="text-white text-xl">{promo.name}</CardTitle>
                      <CardDescription className="text-gray-400">{promo.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        {promo.bonus_amount > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Bonus:</span>
                            <Badge variant="outline" className="text-green-400 border-green-500/30">
                              {promo.bonus_amount} NC
                            </Badge>
                          </div>
                        )}
                        {promo.bonus_percentage > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Discount:</span>
                            <Badge variant="outline" className="text-purple-400 border-purple-500/30">
                              {promo.bonus_percentage}%
                            </Badge>
                          </div>
                        )}
                        {promo.free_spins > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Free Spins:</span>
                            <Badge variant="outline" className="text-yellow-400 border-yellow-500/30">
                              {promo.free_spins}
                            </Badge>
                          </div>
                        )}
                        {promo.min_deposit > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Min. Deposit:</span>
                            <Badge variant="outline" className="text-blue-400 border-blue-500/30">
                              {promo.min_deposit} EUR
                            </Badge>
                          </div>
                        )}
                      </div>
                      
                      <Button
                        onClick={() => redeemPromoCode(promo.code)}
                        disabled={redeeming === promo.code}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white transition-all duration-300"
                      >
                        {redeeming === promo.code ? 'Activating...' : `Activate ${promo.code}`}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-center"
            >
              <Card className="bg-black/50 border-gray-600/30 max-w-md mx-auto">
                <CardHeader>
                  <CardTitle className="text-gray-300">{t('noPromocodesAvailable')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-center">
                    {t('noPromocodesAvailableDescription')}
                  </p>
                  <div className="flex justify-center space-x-4">
                    <div className="text-center">
                      <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">Bonuses</p>
                    </div>
                    <div className="text-center">
                      <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">Community</p>
                    </div>
                    <div className="text-center">
                      <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">Growth</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  )
}
