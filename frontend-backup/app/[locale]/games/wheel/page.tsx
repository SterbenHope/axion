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
              <span className="text-green-400">Fortune</span> Wheel
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Wheel of fortune with multipliers up to x50
            </p>
          </div>
          
          <WheelOfFortune />
        </div>
      </main>
      <Footer />
    </div>
  )
}
