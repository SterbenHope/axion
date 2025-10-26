"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Coins, Play, Hand, Square, RotateCcw } from "lucide-react"
import { motion } from "framer-motion"
import { useToast } from "@/hooks/use-toast"

type Suit = "hearts" | "diamonds" | "clubs" | "spades"
type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K"

interface GameCard {
  suit: Suit
  rank: Rank
  value: number
}

interface GameState {
  playerHand: GameCard[]
  dealerHand: GameCard[]
  deck: GameCard[]
  playerScore: number
  dealerScore: number
  gameStatus:
    | "playing"
    | "player_blackjack"
    | "dealer_blackjack"
    | "player_bust"
    | "dealer_bust"
    | "player_wins"
    | "dealer_wins"
    | "push"
  canDouble: boolean
  canSplit: boolean
}

interface GameResult {
  gameState: GameState
  payout?: number
  netResult?: number
  newBalance?: number
  finalBetAmount?: number
  error?: string
}

const SUIT_SYMBOLS = {
  hearts: "♥️",
  diamonds: "♦️",
  clubs: "♣️",
  spades: "♠️",
}

const SUIT_COLORS = {
  hearts: "text-red-400",
  diamonds: "text-red-400",
  clubs: "text-white",
  spades: "text-white",
}

export default function BlackjackGame() {
  const [balance, setBalance] = useState<number | null>(null)
  const [betAmount, setBetAmount] = useState(25)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastResult, setLastResult] = useState<GameResult | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchUserBalance()
  }, [])

  const fetchUserBalance = async () => {
    try {
      const response = await fetch("/api/user/profile")
      if (response.ok) {
        const data = await response.json()
        if (data.profile && data.profile.neon_coins !== undefined) {
          setBalance(data.profile.neon_coins)
          setIsAuthenticated(true)
        } else {
          setIsAuthenticated(false)
          setBalance(null)
        }
      } else {
        setIsAuthenticated(false)
        setBalance(null)
      }
    } catch (error) {
      console.error("Failed to fetch balance:", error)
      setIsAuthenticated(false)
      setBalance(null)
    }
  }

  const startGame = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to play",
        variant: "destructive",
      })
      return
    }

    if (betAmount < 25 || betAmount > 1000) {
      toast({
        title: "Invalid Bet",
        description: "Bet must be between 25 and 1000 NC",
        variant: "destructive",
      })
      return
    }

    if (!balance || balance < betAmount) {
      toast({
        title: "Insufficient Funds",
        description: "You don't have enough NeonCoins for this bet",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setLastResult(null)

    try {
      const response = await fetch("/api/games/blackjack/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ betAmount }),
      })

      const result = await response.json()

      if (response.ok) {
        setGameState(result.gameState)
        setIsPlaying(true)
        setBalance((prev) => (prev ?? 0) - betAmount)

        // Check for immediate game end (blackjacks)
        if (result.gameState.gameStatus !== "playing") {
          handleGameEnd(result)
        }
      } else {
        toast({
                  title: "Error",
        description: result.error || "An error occurred while starting the game",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Start game error:", error)
      toast({
        title: "Error",
        description: "An error occurred while connecting to the server",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const performAction = async (action: "hit" | "stand" | "double") => {
    if (!gameState || isProcessing) return

    setIsProcessing(true)

    try {
      const response = await fetch("/api/games/blackjack/action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, gameState, betAmount }),
      })

      const result: GameResult = await response.json()

      if (response.ok) {
        setGameState(result.gameState)

        if (result.gameState.gameStatus !== "playing") {
          handleGameEnd(result)
        }
      } else {
        toast({
                  title: "Error",
        description: result.error || "An error occurred while performing the action",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Action error:", error)
      toast({
        title: "Error",
        description: "An error occurred while connecting to the server",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleGameEnd = (result: GameResult) => {
    setLastResult(result)
    setIsPlaying(false)

    if (result.newBalance !== undefined) {
      setBalance(result.newBalance)
    }

    // Show result toast
    const status = result.gameState.gameStatus
    if (status === "player_blackjack") {
      toast({
        title: "BLACKJACK!",
        description: `Congratulations! You won ${result.payout} NC!`,
      })
    } else if (status === "player_wins" || status === "dealer_bust") {
      toast({
        title: "Victory!",
        description: `You won ${result.payout} NC!`,
      })
    } else if (status === "push") {
      toast({
        title: "Push",
        description: "Bet returned",
      })
    }
  }

  const newGame = () => {
    setGameState(null)
    setIsPlaying(false)
    setLastResult(null)
  }

  const getStatusMessage = (status: GameState["gameStatus"]) => {
    switch (status) {
      case "player_blackjack":
        return "BLACKJACK! You won!"
      case "dealer_blackjack":
        return "Dealer has blackjack"
      case "player_bust":
        return "Bust! You lost"
      case "dealer_bust":
        return "Dealer bust! You won!"
      case "player_wins":
        return "You won!"
      case "dealer_wins":
        return "Dealer won"
      case "push":
        return "Push"
      default:
        return ""
    }
  }

  const getStatusColor = (status: GameState["gameStatus"]) => {
    switch (status) {
      case "player_blackjack":
      case "player_wins":
      case "dealer_bust":
        return "text-green-400"
      case "push":
        return "text-yellow-400"
      default:
        return "text-red-400"
    }
  }

  const renderCard = (card: GameCard, index: number, _isDealer = false, isHidden = false) => {
    if (isHidden) {
      return (
        <motion.div
          key={`hidden-${index}`}
          initial={{ rotateY: 180, scale: 0.8 }}
          animate={{ rotateY: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="w-16 h-24 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg border border-purple-400 flex items-center justify-center"
        >
          <div className="text-white text-xs">🎴</div>
        </motion.div>
      )
    }

    return (
      <motion.div
        key={`${card.suit}-${card.rank}-${index}`}
        initial={{ rotateY: 180, scale: 0.8 }}
        animate={{ rotateY: 0, scale: 1 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        className="w-16 h-24 bg-white rounded-lg border border-gray-300 flex flex-col items-center justify-between p-1 shadow-lg"
      >
        <div className={`text-xs font-bold ${SUIT_COLORS[card.suit]}`}>{card.rank}</div>
        <div className={`text-lg ${SUIT_COLORS[card.suit]}`}>{SUIT_SYMBOLS[card.suit]}</div>
        <div className={`text-xs font-bold ${SUIT_COLORS[card.suit]} rotate-180`}>{card.rank}</div>
      </motion.div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Balance and Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-black/50 border-gray-600/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Coins className="h-5 w-5 text-gray-300" />
              Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {balance?.toLocaleString("en-US") || "0"} <span className="text-gray-300 text-lg">NC</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/50 border-pink-500/30">
          <CardHeader>
            <CardTitle className="text-white">Bet Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
                              <label className="text-sm text-gray-300">Bet Amount</label>
              <Input
                type="number"
                min="25"
                max="1000"
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                disabled={isPlaying}
                className="bg-black/50 border-pink-500/30 text-white"
              />
            </div>
            <div className="flex gap-2">
              {[25, 50, 100, 250].map((amount) => (
                <Button
                  key={amount}
                  size="sm"
                  variant="outline"
                  onClick={() => setBetAmount(amount)}
                  disabled={isPlaying}
                  className={`border-pink-500/30 text-pink-400 hover:bg-pink-500/10 ${
                    betAmount === amount ? "bg-pink-500/20" : "bg-transparent"
                  }`}
                >
                  {amount}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Game Table */}
              <Card className="bg-black/50 border-purple-500/30">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-white font-mono">
            <span className="text-purple-400">CYBER</span> <span className="text-pink-400">BLACKJACK</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Dealer Section */}
          {gameState && (
            <div className="text-center space-y-4">
              <div className="text-xl text-white">
                                  Dealer{" "}
                <span className="text-purple-400">
                  ({isPlaying && gameState.gameStatus === "playing" ? "?" : gameState.dealerScore})
                </span>
              </div>
              <div className="flex justify-center gap-2">
                {gameState.dealerHand.map((card, index) =>
                  renderCard(
                    card,
                    index,
                    true,
                    index === 1 && isPlaying && gameState.gameStatus === "playing", // Hide second card while playing
                  ),
                )}
              </div>
            </div>
          )}

          {/* Player Section */}
          {gameState && (
            <div className="text-center space-y-4">
              <div className="text-xl text-white">
                You <span className="text-cyan-400">({gameState.playerScore})</span>
              </div>
              <div className="flex justify-center gap-2">
                {gameState.playerHand.map((card, index) => renderCard(card, index))}
              </div>
            </div>
          )}

          {/* Game Status */}
          {gameState && gameState.gameStatus !== "playing" && (
            <div className="text-center">
              <div className={`text-2xl font-bold ${getStatusColor(gameState.gameStatus)}`}>
                {getStatusMessage(gameState.gameStatus)}
              </div>
              {lastResult && lastResult.payout !== undefined && (
                <div className="text-lg text-white mt-2">
                  {lastResult.netResult! > 0 ? "+" : ""}
                  {lastResult.netResult} NC
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            {!isAuthenticated ? (
              <div className="text-center p-6 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-lg mb-4">Authentication required to play</p>
                <Button
                  onClick={() => window.location.href = '/en/auth/login'}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  Sign In
                </Button>
              </div>
            ) : !isPlaying ? (
              <Button
                onClick={startGame}
                disabled={isProcessing || !balance || balance < betAmount}
                size="lg"
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-8 py-6 text-lg transition-all duration-300"
              >
                {isProcessing ? (
                  <>
                    <RotateCcw className="mr-2 h-5 w-5 animate-spin" />
                    Dealing...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-5 w-5" />
                    Start Game ({betAmount} NC)
                  </>
                )}
              </Button>
            ) : gameState?.gameStatus === "playing" ? (
              <>
                <Button
                  onClick={() => performAction("hit")}
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3"
                >
                  <Hand className="mr-2 h-4 w-4" />
                  Hit
                </Button>
                <Button
                  onClick={() => performAction("stand")}
                  disabled={isProcessing}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3"
                >
                  <Square className="mr-2 h-4 w-4" />
                  Stand
                </Button>
                {gameState.canDouble && (
                  <Button
                    onClick={() => performAction("double")}
                    disabled={isProcessing}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3"
                  >
                    Double
                  </Button>
                )}
              </>
            ) : (
              <Button
                onClick={newGame}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-3"
              >
                New Game
              </Button>
            )}
          </div>

          {/* Rules */}
          <Card className="bg-gray-800/50 border-gray-600/30">
            <CardHeader>
              <CardTitle className="text-white text-center">Game Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
                <div>
                  <h4 className="font-semibold text-white mb-2">Game Objective:</h4>
                  <p>Get 21 points or closer to 21 than the dealer without exceeding 21</p>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Card Values:</h4>
                  <p>2-10: face value, J/Q/K: 10 points, A: 1 or 11 points</p>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Blackjack:</h4>
                  <p>A + 10/J/Q/K = 3:2 payout</p>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Dealer:</h4>
                  <p>Takes cards until 17 points or higher</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}
