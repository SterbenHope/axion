"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Gamepad2, TrendingUp, TrendingDown } from "lucide-react"
import { motion } from "framer-motion"

interface GameSession {
  id: number
  bet_amount: string
  result_amount: string
  started_at: string
  game: {
    title: string
    game_type: string
  }
  is_win: boolean
  profit_loss: string
}

interface RecentGamesProps {
  games: GameSession[]
  loading?: boolean
}

export default function RecentGames({ games, loading = false }: RecentGamesProps) {
  const getGameIcon = (type: string) => {
    switch (type) {
      case "slots":
        return "🎰"
      case "blackjack":
        return "♠️"
      case "wheel":
        return "🎡"
      case "roulette":
        return "🎲"
      default:
        return "🎮"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Card className="bg-black/50 border-purple-500/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-medium text-white flex items-center gap-2">
            <Gamepad2 className="h-5 w-5 text-purple-400" />
            Recent Games
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading recent games...</p>
            </div>
          ) : !games || !Array.isArray(games) || games.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Gamepad2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium text-white mb-2">Your gaming adventure awaits!</p>
              <p className="text-gray-400 mb-4">No games played yet, but your first victory is just around the corner!</p>
              <p className="text-sm text-gray-500">Start with Neon Slots or try your luck at Cyber Blackjack</p>
            </div>
          ) : (
            <div className="space-y-3">
              {games?.map((game, index) => {
                const isWin = game.is_win

                return (
                  <motion.div
                    key={game.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-700/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{getGameIcon(game.game.game_type)}</div>
                      <div>
                        <div className="font-medium text-white">{game.game.title}</div>
                        <div className="text-sm text-gray-400">{formatDate(game.started_at)}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400 mb-1">Bet: {game.bet_amount} NC</div>
                      <Badge
                        variant={isWin ? "default" : "destructive"}
                        className={`${
                          isWin
                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                            : "bg-red-500/20 text-red-400 border-red-500/30"
                        }`}
                      >
                        {isWin ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                        {isWin ? "+" : ""}
                        {game.profit_loss} NC
                      </Badge>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
