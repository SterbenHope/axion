'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Gamepad2, Shield, Users, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function RulesPage() {
  const t = useTranslations('rules')

  const gameRules = [
    {
      title: t('games.neonSlots.title'),
      icon: Gamepad2,
      description: t('games.neonSlots.description'),
      rules: t('games.neonSlots.rules')
    },
    {
      title: t('games.neonBlackjack.title'),
      icon: Shield,
      description: t('games.neonBlackjack.description'),
      rules: t('games.neonBlackjack.rules')
    },
    {
      title: t('games.neonWheel.title'),
      icon: Zap,
      description: t('games.neonWheel.description'),
      rules: t('games.neonWheel.rules')
    }
  ]

  const generalRules = t('general')

  return (
    <div className="min-h-screen bg-black text-white py-20">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="h-12 w-12 text-cyan-400" />
          </div>
          <h1 className="text-4xl font-bold text-white neon-glow mb-4">
            {t('title')}
          </h1>
          <p className="text-xl text-gray-300">
            {t('subtitle')}
          </p>
        </motion.div>

        {/* General Rules */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-12"
        >
          <Card className="bg-black/50 border-cyan-500/30">
            <CardHeader>
                              <CardTitle className="text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-cyan-400" />
                  {t('generalRules')}
                </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-300">
                {generalRules.map((rule, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-1">•</span>
                    {rule}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        {/* Game Rules */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {gameRules.map((game, index) => {
            const Icon = game.icon
            return (
              <motion.div
                key={game.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
              >
                <Card className="bg-black/50 border-cyan-500/30 h-full hover:border-cyan-400/50 transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-6 w-6 text-cyan-400" />
                      <CardTitle className="text-white text-lg">{game.title}</CardTitle>
                    </div>
                    <p className="text-gray-400 text-sm">{game.description}</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-gray-300">
                      {game.rules.map((rule, ruleIndex) => (
                        <li key={ruleIndex} className="flex items-start gap-2">
                          <span className="text-cyan-400 mt-1 text-xs">•</span>
                          {rule}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Additional Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center"
        >
          <Card className="bg-black/50 border-cyan-500/30">
            <CardContent className="pt-6">
                        <p className="text-gray-400 mb-4">
            {t('contactSupport')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/faq">
              <Button variant="outline" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
                FAQ
              </Button>
            </Link>
            <Button variant="outline" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
              {t('contactSupportButton')}
            </Button>
          </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

















