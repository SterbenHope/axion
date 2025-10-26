import Header from "@/components/layout/header"
import Footer from "@/components/layout/footer"
import WheelOfFortune from "@/components/games/wheel-of-fortune"

export default function WheelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black cyber-grid">
      <Header />
      <main className="pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white neon-glow mb-4 font-mono">
              <span className="text-green-400">Fortune</span> <span className="text-emerald-400">Wheel</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Wheel of fortune with multipliers up to x50 and exciting animations
            </p>
            <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg max-w-md mx-auto">
              <p className="text-yellow-400 text-sm">⚠️ Demo game: Only virtual NeonCoins are used</p>
            </div>
          </div>

          <WheelOfFortune />
        </div>
      </main>
      <Footer />
    </div>
  )
}
