import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

      // Simple promo code activation logic for demonstration
  const validCodes = {
    "WELCOME2024": { discount: 20, type: "percentage", description: "20% discount on first deposit" },
    "BONUS50": { discount: 50, type: "fixed", description: "50 NC bonus on registration" },
    "FREESPIN": { discount: 10, type: "spins", description: "10 free spins" }
  }

    const promoCode = validCodes[code as keyof typeof validCodes]

    if (!promoCode) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid promo code" 
      }, { status: 400 })
    }

          // In a real application, activation logic would be here
    console.log("Promo code redeemed:", code, promoCode)

    return NextResponse.json({
      success: true,
      code,
      ...promoCode,
              message: "Promo code successfully activated!",
      activated_at: new Date().toISOString()
    })
  } catch (error) {
    console.error("Promo redemption error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
