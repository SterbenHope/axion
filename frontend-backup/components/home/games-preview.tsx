"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Zap, Spade, RotateCcw, Star } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useTranslations, useLocale } from "next-intl"

export default function GamesPreview() {
  const t = useTranslations()
  const locale = useLocale()

  const games = [
    {
      id: "slots",
      name: t('games.slot.title'),
      description: t('games.slot.description'),
      icon: Zap,
      minBet: "10 NC",
      maxBet: "500 NC",
      color: "from-cyan-500 to-blue-600",
      borderColor: "border-cyan-500/30",
      available: true,
    },
    {
      id: "blackjack",
      name: t('games.blackjack.title'),
      description: t('games.blackjack.description'),
      icon: Spade,
      minBet: "25 NC",
      maxBet: "1000 NC",
      color: "from-purple-500 to-pink-600",
      borderColor: "border-purple-500/30",
      available: true,
    },
    {
      id: "wheel",
      name: t('games.wheel.title'),
      description: t('games.wheel.description'),
      icon: RotateCcw,
      minBet: "5 NC",
      maxBet: "200 NC",
      color: "from-green-500 to-emerald-600",
      borderColor: "border-green-500/30",
      available: true,
    },
    {
      id: "top-slots",
      name: "Top Slots",
      description: "Premium slots with massive jackpots",
      icon: Star,
      minBet: "1 NC",
      maxBet: "2000 NC",
      color: "from-yellow-500 to-orange-600",
      borderColor: "border-yellow-500/30",
      available: true,
    },
  ]

  return (
    <section className="py-20 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white neon-glow mb-4 font-mono">
            {t('home.games.title')} <span className="text-cyan-400">Future</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            {t('home.games.subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.filter(game => game.available).map((game, index) => {
            const Icon = game.icon
            return (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card
                  className={`bg-black/50 ${game.borderColor} hover:border-opacity-70 transition-all duration-300 group hover:transform hover:scale-105`}
                >
                  <CardHeader className="text-center">
                    <div
                      className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${game.color} flex items-center justify-center group-hover:animate-pulse-neon`}
                    >
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-white text-xl">{game.name}</CardTitle>
                    <CardDescription className="text-gray-400">{game.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Badge variant="outline" className="text-green-400 border-green-500/30">
                        Min: {game.minBet}
                      </Badge>
                      <Badge variant="outline" className="text-red-400 border-red-500/30">
                        Max: {game.maxBet}
                      </Badge>
                    </div>
                    <Link href={`/${locale}/games/${game.id}`}>
                      <Button
                        className={`w-full bg-gradient-to-r ${game.color} hover:opacity-90 text-white transition-all duration-300`}
                      >
                        {t('common.play')}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link href={`/${locale}/games`}>
            <Button
              size="lg"
              variant="outline"
              className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 px-8 py-4 text-lg bg-transparent"
            >
              {t('home.games.viewAll')}
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
