import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    // Demo promo codes data
    const demoPromoCodes = [
      {
        id: "1",
        code: "WELCOME2024",
        description: "20% discount on first deposit",
        discount_percent: 20,
        max_uses: 100,
        used_count: 45,
        is_active: true,
        created_at: "2024-08-01T00:00:00Z"
      },
      {
        id: "2",
        code: "BONUS50",
        description: "50 NC bonus on registration",
        discount_percent: 0,
        max_uses: 200,
        used_count: 123,
        is_active: true,
        created_at: "2024-08-05T00:00:00Z"
      }
    ]

    return NextResponse.json({
      promo_codes: demoPromoCodes,
      total: demoPromoCodes.length
    })
  } catch (error) {
    console.error("Admin promo codes error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

          // Simple stub for creation
    console.log("Create promo code:", data)

    return NextResponse.json({ success: true, id: "new-id" })
  } catch (error) {
    console.error("Admin promo code creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, updates } = await request.json()

          // Simple stub for update
    console.log("Update promo code:", id, updates)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin promo code update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
