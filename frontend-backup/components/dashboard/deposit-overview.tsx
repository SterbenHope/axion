"use client"

import { useLocale } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Info, Shield, Zap, Gift } from "lucide-react"
import Link from "next/link"

export default function DepositOverview() {
  const locale = useLocale()

  return (
    <div id="deposit" className="mt-12">
      <Card className="bg-black/50 border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-white text-2xl flex items-center">
            <Plus className="h-6 w-6 mr-3 text-green-400" />
            Deposit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Deposit Information */}
              <div className="space-y-6">
                <div className="text-center lg:text-left">
                  <h3 className="text-xl font-semibold text-white mb-4">
                    Ready to start your gaming journey?
                  </h3>
                  <p className="text-gray-300 mb-6">
                    Add funds to your account and unlock the full NeonCasino experience. 
                    All games use virtual NeonCoins (NC) for entertainment purposes.
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Shield className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-white font-medium">Secure Payments</h4>
                      <p className="text-sm text-gray-400">Bank-level encryption and secure payment processing</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Zap className="h-5 w-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-white font-medium">Instant Credit</h4>
                      <p className="text-sm text-gray-400">Funds are available immediately after successful payment</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Gift className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-white font-medium">Welcome Bonus</h4>
                      <p className="text-sm text-gray-400">Get 1000 NC bonus on your first deposit!</p>
                    </div>
                  </div>
                </div>

                {/* Payment Methods */}
                <div>
                  <h4 className="text-white font-medium mb-3">Available Payment Methods:</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/50">
                      <div className="text-sm text-gray-300">Credit/Debit Cards</div>
                      <div className="text-xs text-gray-500">Visa, MasterCard, Amex</div>
                    </div>
                    <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/50">
                      <div className="text-sm text-gray-300">Cryptocurrency</div>
                      <div className="text-xs text-gray-500">Bitcoin, Ethereum, USDT</div>
                    </div>
                    <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/50">
                      <div className="text-sm text-gray-300">Bank Transfer</div>
                      <div className="text-xs text-gray-500">SEPA, SWIFT, Local</div>
                    </div>
                    <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/50">
                      <div className="text-sm text-gray-300">Digital Wallets</div>
                      <div className="text-xs text-gray-500">PayPal, Skrill, Neteller</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deposit Form & Limits */}
              <div className="space-y-6">
                {/* Limits Info */}
                <Card className="bg-gray-800/30 border-gray-700/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-lg">Deposit Limits</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Minimum:</span>
                      <span className="text-green-400 font-medium">10 NC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Maximum:</span>
                      <span className="text-green-400 font-medium">10,000 NC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Processing:</span>
                      <span className="text-blue-400 font-medium">Instant</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Important Notice */}
                <Card className="bg-yellow-500/10 border-yellow-500/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-yellow-400 text-lg flex items-center">
                      <Info className="h-5 w-5 mr-2" />
                      Important Notice
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-yellow-200 text-sm">
                      NeonCasino uses virtual NeonCoins (NC) for entertainment purposes only. 
                      All games are free-to-play and no real money is required. 
                      Deposits are for account enhancement and do not affect gameplay.
                    </p>
                  </CardContent>
                </Card>

                {/* Action Button */}
                                 <div className="text-center">
                   <Link href={`/${locale}/payments`}>
                     <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white neon-glow py-4 text-lg">
                       <Plus className="h-5 w-5 mr-2" />
                       Proceed to Payment
                     </Button>
                   </Link>
                  <p className="text-xs text-gray-500 mt-2">
                    You'll be redirected to our secure payment page
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
