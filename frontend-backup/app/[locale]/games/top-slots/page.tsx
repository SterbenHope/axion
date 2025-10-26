import Header from "@/components/layout/header"
import Footer from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Zap, Star, Clock } from "lucide-react"

export default function TopSlotsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black cyber-grid">
      <Header />
      <main className="pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 font-mono">
              <span className="text-yellow-400">TOP</span> <span className="text-cyan-400">SLOTS</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Premium slot machines with massive jackpots and exclusive features
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Coming Soon Slots */}
            {[
              {
                name: "Mega Fortune",
                description: "Progressive jackpot slots with life-changing payouts",
                minBet: "1 NC",
                maxBet: "1000 NC",
                jackpot: "1,000,000+ NC",
                status: "Coming Soon"
              },
              {
                name: "Diamond Riches",
                description: "High-stakes slots with diamond multipliers",
                minBet: "5 NC",
                maxBet: "2000 NC",
                jackpot: "500,000+ NC",
                status: "Coming Soon"
              },
              {
                name: "Royal Flush",
                description: "Royal-themed slots with royal flush bonuses",
                minBet: "2 NC",
                maxBet: "1500 NC",
                jackpot: "750,000+ NC",
                status: "Coming Soon"
              }
            ].map((slot, index) => (
              <Card key={index} className="bg-black/50 border-yellow-500/30 hover:border-opacity-70 transition-all duration-300">
                <CardHeader className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
                    <Star className="h-10 w-10 text-white" />
                  </div>
                  <CardTitle className="text-white text-2xl flex items-center justify-center gap-2">
                    {slot.name}
                    <Badge variant="outline" className="text-yellow-400 border-yellow-500/30">
                      {slot.status}
                    </Badge>
                  </CardTitle>
                  <p className="text-gray-400">{slot.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Min bet:</span>
                      <span className="text-green-400 font-mono">{slot.minBet}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Max bet:</span>
                      <span className="text-red-400 font-mono">{slot.maxBet}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Jackpot:</span>
                      <span className="text-yellow-400 font-mono">{slot.jackpot}</span>
                    </div>
                  </div>
                  <Button disabled className="w-full bg-gray-600 text-gray-400 cursor-not-allowed">
                    <Clock className="h-4 w-4 mr-2" />
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30 max-w-2xl mx-auto">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Star className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">Premium Experience Coming Soon</h3>
                  <p className="text-gray-300 mb-4">
                    We're working hard to bring you the most exciting and rewarding slot machines in the crypto gaming world.
                  </p>
                  <Badge variant="outline" className="text-yellow-400 border-yellow-500/30 text-lg px-4 py-2">
                    Stay Tuned for Updates
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}








