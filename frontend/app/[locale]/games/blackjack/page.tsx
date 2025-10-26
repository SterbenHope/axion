import Header from "@/components/layout/header"
import Footer from "@/components/layout/footer"
import BlackjackGame from "@/components/games/blackjack-game"

export default function BlackjackPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black cyber-grid">
      <Header />
      <main className="pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white neon-glow mb-4 font-mono">
              <span className="text-purple-400">Cyber</span> Blackjack
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Blackjack in cyberpunk style with intelligent dealer
            </p>
          </div>
          
          <BlackjackGame />
        </div>
      </main>
      <Footer />
    </div>
  )
}
