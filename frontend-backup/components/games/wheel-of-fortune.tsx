"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Coins, Play, RotateCcw, TrendingUp, TrendingDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/hooks/use-toast"

interface WheelResult {
  winningSegment: {
    id: number
    multiplier: number
    probability: number
    color: string
    label: string
  }
  payout: number
  netResult: number
  newBalance: number
  finalAngle: number
  isWin: boolean
  error?: string
}

const WHEEL_SEGMENTS = [
  { id: 1, multiplier: 1, color: "#ef4444", label: "1x" },
  { id: 2, multiplier: 2, color: "#f97316", label: "2x" },
  { id: 3, multiplier: 1, color: "#ef4444", label: "1x" },
  { id: 4, multiplier: 5, color: "#eab308", label: "5x" },
  { id: 5, multiplier: 1, color: "#ef4444", label: "1x" },
  { id: 6, multiplier: 2, color: "#f97316", label: "2x" },
  { id: 7, multiplier: 1, color: "#ef4444", label: "1x" },
  { id: 8, multiplier: 10, color: "#22c55e", label: "10x" },
  { id: 9, multiplier: 1, color: "#ef4444", label: "1x" },
  { id: 10, multiplier: 2, color: "#f97316", label: "2x" },
  { id: 11, multiplier: 1, color: "#ef4444", label: "1x" },
  { id: 12, multiplier: 5, color: "#eab308", label: "5x" },
  { id: 13, multiplier: 1, color: "#ef4444", label: "1x" },
  { id: 14, multiplier: 2, color: "#f97316", label: "2x" },
  { id: 15, multiplier: 1, color: "#ef4444", label: "1x" },
  { id: 16, multiplier: 20, color: "#8b5cf6", label: "20x" },
  { id: 17, multiplier: 1, color: "#ef4444", label: "1x" },
  { id: 18, multiplier: 2, color: "#f97316", label: "2x" },
  { id: 19, multiplier: 1, color: "#ef4444", label: "1x" },
  { id: 20, multiplier: 5, color: "#eab308", label: "5x" },
  { id: 21, multiplier: 1, color: "#ef4444", label: "1x" },
  { id: 22, multiplier: 2, color: "#f97316", label: "2x" },
  { id: 23, multiplier: 1, color: "#ef4444", label: "1x" },
  { id: 24, multiplier: 50, color: "#06b6d4", label: "50x" },
]

export default function WheelOfFortune() {
  const [balance, setBalance] = useState<number | null>(null)
  const [betAmount, setBetAmount] = useState(5)
  const [isSpinning, setIsSpinning] = useState(false)
  const [lastResult, setLastResult] = useState<WheelResult | null>(null)
  const [wheelRotation, setWheelRotation] = useState(0)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const wheelRef = useRef<HTMLDivElement>(null)
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

  const spin = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to play",
        variant: "destructive",
      })
      return
    }

    if (betAmount < 5 || betAmount > 200) {
      toast({
        title: "Invalid Bet",
        description: "Bet must be between 5 and 200 NC",
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
    setLastResult(null)

    try {
      const response = await fetch("/api/games/wheel/play", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ betAmount }),
      })

      const result: WheelResult = await response.json()

      if (response.ok) {
        // Animate wheel rotation
        const newRotation = wheelRotation + result.finalAngle
        setWheelRotation(newRotation)

        // Wait for animation to complete
        setTimeout(() => {
          setLastResult(result)
          setBalance(result.newBalance)
          setIsSpinning(false)

          if (result.isWin && result.winningSegment?.multiplier > 1) {
            toast({
              title: "Congratulations!",
              description: `Multiplier ${result.winningSegment.multiplier}x! You won ${result.payout} NC!`,
            })
          }
        }, 4000) // Match animation duration
      } else {
        setIsSpinning(false)
        toast({
          title: "Error",
          description: result.error || "An error occurred during the game",
          variant: "destructive",
        })
      }
    } catch (error) {
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
    setBetAmount(amount)
  }

  const renderWheel = () => {
    const segmentAngle = 360 / WHEEL_SEGMENTS.length

    return (
      <div className="relative">
        {/* Wheel */}
        <motion.div
          ref={wheelRef}
          className="w-80 h-80 rounded-full border-4 border-cyan-400 relative overflow-hidden shadow-2xl"
          style={{
            background: `conic-gradient(${WHEEL_SEGMENTS.map(
              (segment, index) => `${segment.color} ${index * segmentAngle}deg ${(index + 1) * segmentAngle}deg`,
            ).join(", ")})`,
          }}
          animate={{ rotate: wheelRotation }}
          transition={{
            duration: isSpinning ? 4 : 0,
            ease: isSpinning ? [0.25, 0.46, 0.45, 0.94] : "linear",
          }}
        >
          {/* Segment labels */}
          {WHEEL_SEGMENTS.map((segment, index) => {
            const angle = index * segmentAngle + segmentAngle / 2
            const radian = (angle * Math.PI) / 180
            const radius = 120
            const x = Math.cos(radian) * radius
            const y = Math.sin(radian) * radius

            return (
              <div
                key={segment.id}
                className="absolute text-white font-bold text-sm transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                  transform: `translate(-50%, -50%) rotate(${angle + 90}deg)`,
                  textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                }}
              >
                {segment.label}
              </div>
            )
          })}

          {/* Center circle */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-full border-4 border-white flex items-center justify-center">
            <RotateCcw className="h-6 w-6 text-white" />
          </div>
        </motion.div>

        {/* Pointer */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
          <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-yellow-400 drop-shadow-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Balance and Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-black/50 border-green-500/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Coins className="h-5 w-5 text-green-400" />
              Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {balance?.toLocaleString("ru-RU") || "0"} <span className="text-green-400 text-lg">NC</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/50 border-emerald-500/30">
          <CardHeader>
            <CardTitle className="text-white">Bet Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Bet Amount</label>
              <Input
                type="number"
                min="5"
                max="200"
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                className="bg-black/50 border-emerald-500/30 text-white"
              />
            </div>
            <div className="flex gap-2">
              {[5, 10, 25, 50].map((amount) => (
                <Button
                  key={amount}
                  size="sm"
                  variant="outline"
                  onClick={() => quickBet(amount)}
                  className={`border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 ${
                    betAmount === amount ? "bg-emerald-500/20" : "bg-transparent"
                  }`}
                >
                  {amount}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Wheel Game */}
              <Card className="bg-black/50 border-green-500/30">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-white font-mono">
            <span className="text-green-400">FORTUNE</span> <span className="text-emerald-400">WHEEL</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Wheel */}
          <div className="flex justify-center">{renderWheel()}</div>

          {/* Spin Button */}
          <div className="text-center">
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
            ) : (
              <Button
                onClick={spin}
                disabled={isSpinning || !balance || balance < betAmount}
                size="lg"
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-12 py-6 text-xl transition-all duration-300 transform hover:scale-105"
              >
                {isSpinning ? (
                  <>
                                      <RotateCcw className="mr-2 h-6 w-6 animate-spin" />
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
            {lastResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                <Card
                  className={`${
                    lastResult.isWin && lastResult.winningSegment.multiplier > 1
                      ? "bg-green-500/10 border-green-500/30"
                      : "bg-gray-500/10 border-gray-500/30"
                  }`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {lastResult.isWin && lastResult.winningSegment.multiplier > 1 ? (
                        <TrendingUp className="h-5 w-5 text-green-400" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-gray-400" />
                      )}
                                                                <span
                        className={`font-semibold ${
                          lastResult.isWin && lastResult.winningSegment?.multiplier > 1
                            ? "text-green-400"
                            : "text-gray-400"
                        }`}
                      >
                        Multiplier: {lastResult.winningSegment?.multiplier || 1}x
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-white mb-2">
                      {lastResult.netResult > 0 ? "+" : ""}
                      {lastResult.netResult} NC
                    </div>
                    <div className="text-sm text-gray-400">Payout: {lastResult.payout} NC</div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Multiplier Table */}
          <Card className="bg-gray-800/50 border-gray-600/30">
            <CardHeader>
              <CardTitle className="text-white text-center">Multiplier Table</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-sm">
                {[
                  { multiplier: "1x", color: "bg-red-500", count: "12 segments" },
                  { multiplier: "2x", color: "bg-orange-500", count: "6 segments" },
                  { multiplier: "5x", color: "bg-yellow-500", count: "3 segments" },
                  { multiplier: "10x", color: "bg-green-500", count: "1 segment" },
                  { multiplier: "20x", color: "bg-purple-500", count: "1 segment" },
                  { multiplier: "50x", color: "bg-cyan-500", count: "1 segment" },
                ].map((item) => (
                  <div key={item.multiplier} className="text-center p-2 bg-black/30 rounded">
                    <div className={`w-6 h-6 ${item.color} rounded mx-auto mb-1`}></div>
                    <div className="text-white font-bold">{item.multiplier}</div>
                    <div className="text-gray-400 text-xs">{item.count}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}
