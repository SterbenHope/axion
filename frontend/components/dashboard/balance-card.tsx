"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Coins, TrendingUp, TrendingDown, Plus } from "lucide-react"
import { motion } from "framer-motion"

interface BalanceCardProps {
  balance: number
  totalWinnings: number
  totalLosses: number
}

export default function BalanceCard({ balance, totalWinnings, totalLosses }: BalanceCardProps) {
  const netProfit = totalWinnings - totalLosses

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="bg-black/50 border-cyan-500/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-cyan-300">NeonCoins Balance</CardTitle>
          <Coins className="h-4 w-4 text-cyan-400 animate-pulse-neon" />
        </CardHeader>
        <div className="px-6 pb-2">
          <div className="text-xs text-cyan-400/70 font-mono text-center">
            1 NC = 1 EUR = 1 USD
          </div>
        </div>
        <CardContent>
          <div className="text-3xl font-bold text-white mb-4">
            {balance.toLocaleString("en-US")} <span className="text-cyan-400 text-lg">NC</span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="flex items-center justify-center text-green-400 mb-1">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span className="text-sm">Winnings</span>
              </div>
              <div className="text-lg font-semibold text-green-400">{totalWinnings.toLocaleString("en-US")} NC</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center text-red-400 mb-1">
                <TrendingDown className="h-4 w-4 mr-1" />
                <span className="text-sm">Losses</span>
              </div>
              <div className="text-lg font-semibold text-red-400">{totalLosses.toLocaleString("en-US")} NC</div>
            </div>
          </div>

          <div className="text-center mb-4">
            <div className="text-sm text-gray-400 mb-1">Net Profit</div>
            <div className={`text-lg font-semibold ${netProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
              {netProfit >= 0 ? "+" : ""}
              {netProfit.toLocaleString("en-US")} NC
            </div>
          </div>

          <a href="#deposit" className="block">
            <Button className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Deposit
            </Button>
          </a>
        </CardContent>
      </Card>
    </motion.div>
  )
}
