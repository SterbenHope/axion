"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Coins, Play, Zap, TrendingUp, TrendingDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"

interface SlotResult {
  reels: string[]
  payout: number
  netResult: number
  newBalance: number
  isWin: boolean
  error?: string
}

const SYMBOL_EMOJIS: { [key: string]: string } = {
  cherry: "🍒",
  lemon: "🍋",
  orange: "🍊",
  plum: "🍇",
  bell: "🔔",
  bar: "💎",
  seven: "7️⃣",
}

const SYMBOL_COLORS: { [key: string]: string } = {
  cherry: "text-red-400",
  lemon: "text-yellow-400",
  orange: "text-orange-400",
  plum: "text-purple-400",
  bell: "text-blue-400",
  bar: "text-cyan-400",
  seven: "text-green-400",
}

export default function SlotMachine() {
  const [balance, setBalance] = useState<number | null>(null)
  const [betAmount, setBetAmount] = useState(10)
  const [reels, setReels] = useState(["cherry", "cherry", "cherry", "cherry", "cherry"])
  const [isSpinning, setIsSpinning] = useState(false)
  const [lastResult, setLastResult] = useState<SlotResult | null>(null)
  const [spinCount, setSpinCount] = useState(0)
  const { user } = useAuth()
  const { toast } = useToast()
  
  // Check authentication from global context
  const isAuthenticated = !!user && !!user.id

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserBalance()
    }
  }, [isAuthenticated])

  const fetchUserBalance = async () => {
    try {
      if (!isAuthenticated) {
        setBalance(null)
        return
      }

      const token = localStorage.getItem('token')
      if (!token) {
        setBalance(null)
        return
      }

      const response = await fetch("http://localhost:8000/api/users/balance/", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setBalance(data.balance_neon)
      } else {
        setBalance(null)
      }
    } catch (error) {
      console.error("Failed to fetch balance:", error)
      setBalance(null)
    }
  }

  const spin = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to play",
        variant: "destructive",
      })
      return
    }

    if (betAmount < 10 || betAmount > 500) {
      toast({
        title: "Invalid Bet",
        description: "Bet must be between 10 and 500 NC",
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

    setIsSpinning(true)
    setSpinCount((prev) => prev + 1)

    // Animate spinning for 2 seconds
    const spinDuration = 2000
    const spinInterval = setInterval(() => {
      setReels(
        Array.from({ length: 5 }, () => {
          const symbols = Object.keys(SYMBOL_EMOJIS)
          const idx = Math.floor(Math.random() * symbols.length)
          return symbols[idx] as string
        }),
      )
    }, 100)

    try {
      // Get JWT token from localStorage
      const token = localStorage.getItem('token')
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please sign in again",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("http://localhost:8000/api/games/slots/play/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ betAmount }),
      })

      const result: SlotResult = await response.json()

      if (response.ok) {
        setTimeout(() => {
          clearInterval(spinInterval)
          setReels(result.reels)
          setBalance(result.newBalance)
          setLastResult(result)
          setIsSpinning(false)

          if (result.isWin) {
            toast({
                        title: "Congratulations!",
          description: `You won ${result.payout} NC!`,
            })
          }
        }, spinDuration)
      } else {
        clearInterval(spinInterval)
        setIsSpinning(false)
        toast({
          title: "Error",
          description: result.error || "An error occurred during the game",
          variant: "destructive",
        })
      }
    } catch (error) {
      clearInterval(spinInterval)
      setIsSpinning(false)
      console.error("Spin error:", error)
      toast({
        title: "Error",
        description: "An error occurred while connecting to the server",
        variant: "destructive",
      })
    }
  }

  const quickBet = (amount: number) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to play",
        variant: "destructive",
      })
      return
    }
    setBetAmount(amount)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Balance and Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gray-800/50 border-gray-600/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Coins className="h-5 w-5 text-gray-300" />
              Balance
              {!isAuthenticated && <span className="text-sm text-red-400 ml-2">(Sign in required)</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {isAuthenticated ? (
                balance !== null ? (
                  <span>{balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                ) : (
                  <span className="text-gray-400">Loading...</span>
                )
              ) : (
                <span className="text-gray-400">0.00</span>
              )} <span className="text-gray-300 text-lg">NC</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-white">
              <span className="text-purple-400">Bet</span> Management
              {!isAuthenticated && <span className="text-sm text-red-400 ml-2">(Sign in required)</span>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Bet Amount</label>
              <Input
                type="number"
                min="10"
                max="500"
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                disabled={!isAuthenticated}
                className={`bg-gray-700/50 border-cyan-400/30 text-white focus:border-cyan-300/50 focus:ring-cyan-500/20 ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''} transition-all duration-200`}
              />
            </div>
            <div className="flex gap-2">
              {[10, 25, 50, 100].map((amount) => (
                <Button
                  key={amount}
                  size="sm"
                  variant="outline"
                  onClick={() => quickBet(amount)}
                  disabled={!isAuthenticated}
                  className={`border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-300/50 ${
                    betAmount === amount ? "bg-cyan-500/20 border-cyan-300/50" : "bg-transparent"
                  } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''} transition-all duration-200`}
                >
                  {amount}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Slot Machine */}
      <Card className="bg-gray-800/50 border-cyan-500/30">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-white font-mono">
            <span className="text-cyan-400">NEON</span> <span className="text-purple-400">SLOTS</span>
            {!isAuthenticated && (
              <div className="text-sm text-red-400 mt-2 font-normal">
                Authentication required to play
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Reels */}
          <div className="flex justify-center">
            {isAuthenticated ? (
              <div className="grid grid-cols-5 gap-2 p-6 bg-gradient-to-b from-gray-800/50 to-gray-900/50 rounded-lg border border-cyan-500/30 shadow-lg shadow-cyan-500/20">
                {reels.map((symbol, index) => (
                  <motion.div
                    key={`${symbol}-${index}-${spinCount}`}
                    className={`w-20 h-20 flex items-center justify-center text-4xl bg-gray-700/50 rounded-lg border border-cyan-400/30 shadow-md ${
                      SYMBOL_COLORS[symbol]
                    }`}
                    animate={isSpinning ? { y: [-10, 10, -10] } : { y: 0 }}
                    transition={{
                      duration: 0.2,
                      repeat: isSpinning ? Number.POSITIVE_INFINITY : 0,
                      delay: index * 0.1,
                    }}
                  >
                    {SYMBOL_EMOJIS[symbol]}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-gradient-to-b from-gray-800/50 to-gray-900/50 rounded-lg border border-cyan-500/30 shadow-lg shadow-cyan-500/20">
                <div className="text-center text-gray-400">
                  <div className="text-2xl mb-2">🎰</div>
                  <div>Sign in to play slots</div>
                </div>
              </div>
            )}
          </div>

          {/* Spin Button */}
          <div className="text-center">
            {!isAuthenticated ? (
              <div className="text-center p-8 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="text-6xl mb-4">🎰</div>
                <p className="text-red-400 text-xl mb-6 font-semibold">Authentication required to play</p>
                <p className="text-gray-400 text-sm mb-6">Sign in to access your balance and start playing</p>
                <div className="space-y-3">
                  <Button
                    onClick={() => window.location.href = '/en/auth/login'}
                    className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg font-semibold w-full"
                  >
                    Sign In to Play
                  </Button>
                  <div className="text-gray-400 text-sm">
                    Don't have an account?{' '}
                    <a href="/en/auth/register" className="text-cyan-400 hover:text-cyan-300 underline">
                      Sign up here
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <Button
                onClick={spin}
                disabled={isSpinning || !isAuthenticated || !balance || balance < betAmount}
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white px-12 py-6 text-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-cyan-500/25"
              >
                {isSpinning ? (
                  <>
                    <Zap className="mr-2 h-6 w-6 animate-spin" />
                    Spinning...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-6 w-6" />
                    SPIN ({betAmount} NC)
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Last Result */}
          <AnimatePresence>
            {isAuthenticated && lastResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                <Card
                  className={`${
                    lastResult.isWin ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"
                  }`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {lastResult.isWin ? (
                        <TrendingUp className="h-5 w-5 text-green-400" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-400" />
                      )}
                      <span className={`font-semibold ${lastResult.isWin ? "text-green-400" : "text-red-400"}`}>
                        {lastResult.isWin ? "WIN!" : "LOSS"}
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {lastResult.isWin ? "+" : ""}
                      {lastResult.netResult} NC
                    </div>
                    {lastResult.payout > 0 && (
                      <div className="text-sm text-gray-400 mt-1">Payout: {lastResult.payout} NC</div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Paytable */}
          <Card className="bg-gray-800/50 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-white text-center">
                <span className="text-purple-400">Pay</span>table
                {!isAuthenticated && <div className="text-sm text-red-400 mt-1">(Sign in to see payouts)</div>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                {isAuthenticated ? (
                  Object.entries(SYMBOL_EMOJIS).map(([symbol, emoji]) => (
                    <div key={symbol} className="text-center p-2 bg-gray-800/50 rounded border border-cyan-400/30 shadow-md hover:border-cyan-300/50 transition-colors">
                      <div className={`text-2xl mb-1 ${SYMBOL_COLORS[symbol]}`}>{emoji}</div>
                      <div className="text-gray-300 text-xs">
                        3x: {symbol === "seven" ? "50x" : symbol === "bar" ? "20x" : "2-5x"}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-4 text-center p-4 text-gray-400">
                    Sign in to see paytable
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}
