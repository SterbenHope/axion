import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { bet } = await request.json()

    // Simple slots logic for demonstration
    const symbols = ["🍒", "🍊", "🍇", "💎", "7️⃣", "🎰"]
    const reels = [
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)]
    ]

          // Simple win logic
    const isWin = reels[0] === reels[1] && reels[1] === reels[2]
    const winAmount = isWin ? bet * 3 : 0

    return NextResponse.json({
      success: true,
      reels,
      isWin,
      winAmount,
              message: isWin ? "Jackpot! 🎉" : "Try again!"
    })
  } catch (error) {
    console.error("Slots game error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
