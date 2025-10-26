import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()

      // Simple blackjack logic for demonstration
  let result: any = { success: true, message: "Action completed" }

    if (action === "hit") {
      const card = Math.floor(Math.random() * 13) + 1
      result = { 
        ...result, 
        card: card > 10 ? 10 : card,
        message: `Card received: ${card > 10 ? 10 : card}`
      }
    } else if (action === "stand") {
              result = { ...result, message: "Player stopped" }
    } else if (action === "double") {
              result = { ...result, message: "Double bet" }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Blackjack game error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
