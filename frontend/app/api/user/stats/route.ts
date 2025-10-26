import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Demo user statistics
    const demoStats = {
      total_games: 45,
      games_won: 28,
      games_lost: 17,
      win_rate: 62.2,
      total_winnings: 5000,
      total_losses: 2500,
      net_profit: 2500,
      favorite_game: "Neon Slots",
      longest_win_streak: 5,
      current_balance: 2500,
      total_deposits: 3000,
      total_withdrawals: 0
    }

    return NextResponse.json(demoStats)
  } catch (error) {
    console.error("User stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
