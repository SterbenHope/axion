"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, CreditCard, Wallet, Bitcoin } from "lucide-react"
import { useToast } from "@/hooks/use-toast"


interface DepositFormProps {
  onSuccess?: () => void
}

export default function DepositForm({ onSuccess }: DepositFormProps) {
  const t = useTranslations()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    amount: "",
    paymentMethod: "CREDIT_CARD"
  })

  const paymentMethods = [
    { value: "CREDIT_CARD", label: "Credit Card", icon: CreditCard },
    { value: "BANK_TRANSFER", label: "Bank Transfer", icon: Wallet },
    { value: "CRYPTO", label: "Cryptocurrency", icon: Bitcoin }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast({
        title: t('common.error'),
        description: "Please enter a valid amount",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    
    try {
      // Mock deposit for now - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API delay
      
      toast({
        title: t('common.success'),
        description: "Deposit request submitted successfully"
      })
      
      setFormData({ amount: "", paymentMethod: "CREDIT_CARD" })
      onSuccess?.()
    } catch (error) {
      toast({
        title: t('common.error'),
        description: "Failed to submit deposit request"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-black/50 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Wallet className="h-5 w-5 text-green-400" />
          Deposit Funds
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-white">Amount (NEON)</Label>
            <Input
              id="amount"
              type="number"
              min="10"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="bg-black/30 border-purple-500/30 text-white"
              placeholder="Enter amount"
              disabled={loading}
            />
            <p className="text-xs text-gray-400">Minimum deposit: 10 NEON</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod" className="text-white">Payment Method</Label>
            <Select
              value={formData.paymentMethod}
              onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
              disabled={loading}
            >
              <SelectTrigger className="bg-black/30 border-purple-500/30 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black border-purple-500/30">
                {paymentMethods.map((method) => {
                  const Icon = method.icon
                  return (
                    <SelectItem key={method.value} value={method.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {method.label}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Submit Deposit Request"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

