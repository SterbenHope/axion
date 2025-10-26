import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { betAmount } = await request.json()

    if (!betAmount || betAmount < 10 || betAmount > 500) {
      return NextResponse.json({ error: "Invalid bet amount" }, { status: 400 })
    }

    // Forward request to Django backend
    const response = await fetch('http://localhost:8000/api/games/slots/play/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify({ betAmount }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json({ error: errorData.error || "Game failed" }, { status: response.status })
    }

    const gameResult = await response.json()
    return NextResponse.json(gameResult)
    
  } catch (error) {
    console.error("Slots play error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
