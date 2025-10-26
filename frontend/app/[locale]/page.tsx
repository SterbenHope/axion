import Header from "@/components/layout/header"
import Footer from "@/components/layout/footer"
import HeroSection from "@/components/home/hero-section"
import GamesPreview from "@/components/home/games-preview"
import StarrySky from "@/components/home/starry-sky"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white relative">
      <StarrySky />
      <Header />
      <main className="relative z-10">
        <HeroSection />
        <GamesPreview />
      </main>
      <Footer />
    </div>
  )
}
