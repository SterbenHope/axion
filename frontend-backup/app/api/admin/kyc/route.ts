import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    // Demo KYC data
    const demoKYC = [
      {
        id: "1",
        user_id: "1",
        email: "user@example.com",
        status: "pending",
        document_type: "passport",
        submitted_at: "2024-08-15T10:00:00Z"
      },
      {
        id: "2",
        user_id: "2",
        email: "admin@example.com",
        status: "verified",
        document_type: "passport",
        submitted_at: "2024-08-14T09:00:00Z"
      }
    ]

    return NextResponse.json({
      kyc: demoKYC,
      total: demoKYC.length
    })
  } catch (error) {
    console.error("Admin KYC error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { kycId, status } = await request.json()

          // Simple stub for update
    console.log("Update KYC:", kycId, status)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin KYC update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
