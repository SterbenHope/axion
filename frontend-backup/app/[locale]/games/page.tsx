import Header from "@/components/layout/header"
import Footer from "@/components/layout/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Zap, Spade, RotateCcw, Star, Play } from "lucide-react"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"

export default function GamesPage() {
  const locale = useLocale()
  const t = useTranslations()
  const games = [
    {
      id: "slots",
      name: "Neon Slots",
      description: "Classic slots with neon symbols and bonus rounds",
      icon: Zap,
      minBet: "10 NC",
      maxBet: "500 NC",
      color: "from-cyan-500 to-blue-600",
      borderColor: "border-cyan-500/30",
      available: true,
    },
    {
      id: "blackjack",
      name: "Cyber Blackjack",
      description: "Cyberpunk-style blackjack with intelligent dealer",
      icon: Spade,
      minBet: "25 NC",
      maxBet: "1000 NC",
      color: "from-purple-500 to-pink-600",
      borderColor: "border-purple-500/30",
      available: true,
    },
    {
      id: "wheel",
      name: "Fortune Wheel",
      description: "Wheel of fortune with multipliers up to x50",
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
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black cyber-grid">
      <Header />
      <main className="pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 font-mono">
              {t('games.title')} <span className="text-cyan-400">{t('games.subtitle')}</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              {t('games.description')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {games.map((game) => {
              const Icon = game.icon
              return (
                <Card
                  key={game.id}
                  className={`bg-black/50 ${game.borderColor} hover:border-opacity-70 transition-all duration-300 group ${
                    game.available ? "hover:transform hover:scale-105" : "opacity-60"
                  }`}
                >
                  <CardHeader className="text-center">
                    <div
                      className={`w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r ${game.color} flex items-center justify-center ${
                        game.available ? "group-hover:animate-pulse-neon" : ""
                      }`}
                    >
                      <Icon className="h-10 w-10 text-white" />
                    </div>
                    <CardTitle className="text-white text-2xl flex items-center justify-center gap-2">
                      {game.name}
                      {!game.available && (
                        <Badge variant="outline" className="text-yellow-400 border-yellow-500/30 text-xs">
                          Soon
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-gray-400 text-lg">{game.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Min bet:</span>
                      <span className="text-cyan-400 font-mono">{game.minBet}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Max bet:</span>
                      <span className="text-cyan-400 font-mono">{game.maxBet}</span>
                    </div>
                    {game.available ? (
                      <Link href={`/${locale}/games/${game.id === 'roulette' ? 'wheel' : game.id}`}>
                        <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white">
                          <Play className="h-4 w-4 mr-2" />
                                                     Play
                        </Button>
                      </Link>
                    ) : (
                                              <Button disabled className="w-full bg-gray-600 text-gray-400 cursor-not-allowed">
                          Soon
                        </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
