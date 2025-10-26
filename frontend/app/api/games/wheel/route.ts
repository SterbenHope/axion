import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { bet } = await request.json()

    // Simple wheel of fortune logic for demonstration
    const segments = [
      { multiplier: 2, probability: 0.4 },
      { multiplier: 3, probability: 0.3 },
      { multiplier: 5, probability: 0.2 },
      { multiplier: 10, probability: 0.1 }
    ]

          // Simple winning segment determination
    const random = Math.random()
    let selectedSegment = segments[0]
    let cumulativeProbability = 0

    for (const segment of segments) {
      cumulativeProbability += segment.probability
      if (random <= cumulativeProbability) {
        selectedSegment = segment
        break
      }
    }

    const winAmount = bet * (selectedSegment?.multiplier || 1)

    return NextResponse.json({
      success: true,
      multiplier: selectedSegment?.multiplier || 1,
      winAmount,
      message: `Multiplier: x${selectedSegment?.multiplier || 1}! Win: ${winAmount} NC`
    })
  } catch (error) {
    console.error("Wheel game error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
