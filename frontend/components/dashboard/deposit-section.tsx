"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, CreditCard, Wallet, Bitcoin } from "lucide-react"
import { useToast } from "@/hooks/use-toast"


export default function DepositSection() {
  const t = useTranslations()
  const { toast } = useToast()
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [loading, setLoading] = useState(false)

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      // Mock deposit for now - replace with real API call
      setTimeout(() => {
        toast({
          title: "Success",
          description: `Deposit of ${amount} NC submitted successfully!`,
        })
        setAmount("")
        setLoading(false)
      }, 2000)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit deposit request",
        variant: "destructive"
      })
      setLoading(false)
    }
  }

  return (
    <div id="deposit" className="mt-12">
      <Card className="bg-black/50 border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-white text-2xl flex items-center">
            <Plus className="h-6 w-6 mr-3 text-green-400" />
            {t('dashboard.deposit')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-2xl mx-auto">
            <div className="space-y-6">
              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Amount (NC)
                </label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-black/50 border-purple-500/30 text-white"
                  min="1"
                  step="1"
                />
              </div>

              {/* Payment Method Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Payment Method
                </label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="bg-black/50 border-purple-500/30 text-white">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 text-white border-purple-500/30">
                    <SelectItem value="card" className="focus:bg-purple-600 focus:text-white hover:bg-purple-500 hover:text-white">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4" />
                        <span>Credit/Debit Card</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="crypto" className="focus:bg-purple-600 focus:text-white hover:bg-purple-500 hover:text-white">
                      <div className="flex items-center space-x-2">
                        <Bitcoin className="h-4 w-4" />
                        <span>Cryptocurrency</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="wallet" className="focus:bg-purple-600 focus:text-white hover:bg-purple-500 hover:text-white">
                      <div className="flex items-center space-x-2">
                        <Wallet className="h-4 w-4" />
                        <span>Digital Wallet</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Details */}
              {paymentMethod === "card" && (
                <div className="space-y-4 p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                  <h4 className="text-white font-medium">Card Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="Card Number"
                      className="bg-black/50 border-gray-600 text-white"
                    />
                    <Input
                      placeholder="MM/YY"
                      className="bg-black/50 border-gray-600 text-white"
                    />
                    <Input
                      placeholder="CVC"
                      className="bg-black/50 border-gray-600 text-white"
                    />
                    <Input
                      placeholder="Cardholder Name"
                      className="bg-black/50 border-gray-600 text-white"
                    />
                  </div>
                </div>
              )}

              {paymentMethod === "crypto" && (
                <div className="space-y-4 p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                  <h4 className="text-white font-medium">Cryptocurrency Payment</h4>
                  <p className="text-gray-300 text-sm">
                    You will be redirected to complete your cryptocurrency payment.
                  </p>
                </div>
              )}

              {paymentMethod === "wallet" && (
                <div className="space-y-4 p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                  <h4 className="text-white font-medium">Digital Wallet</h4>
                  <p className="text-gray-300 text-sm">
                    Connect your digital wallet to complete the payment.
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                onClick={handleDeposit}
                disabled={loading || !amount}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white neon-glow py-3 text-lg"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  `Deposit ${amount || '0'} NC`
                )}
              </Button>

              {/* Info */}
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  Minimum deposit: 10 NC • Maximum deposit: 10,000 NC
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Processing time: Instant for cards, 1-3 confirmations for crypto
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

