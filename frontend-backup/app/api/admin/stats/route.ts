import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Demo statistics
    const demoStats = {
      total_users: 1250,
      active_users_today: 89,
      total_games_played: 5670,
      total_neon_coins_circulation: 125000,
      revenue_today: 2500,
      revenue_week: 18500,
      revenue_month: 72000,
      top_games: [
        { name: "Neon Slots", plays: 2340, revenue: 45000 },
        { name: "Cyber Blackjack", plays: 1890, revenue: 38000 },
        { name: "Fortune Wheel", plays: 1440, revenue: 42000 }
      ]
    }

    return NextResponse.json(demoStats)
  } catch (error) {
    console.error("Admin stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
