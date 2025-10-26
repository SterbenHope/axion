import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Simple stub for Telegram webhook
    console.log("Telegram webhook received:", body)

    return NextResponse.json({ 
      success: true, 
      message: "Webhook received" 
    })
  } catch (error) {
    console.error("Telegram webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: "Telegram webhook endpoint is active" })
}
