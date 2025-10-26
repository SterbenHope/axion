import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || ""

    // Demo user data
    const demoUsers = [
      {
        id: "1",
        email: "demo@example.com",
        username: "DemoUser",
        full_name: "Demo User",
        neon_coins: 2500,
        kyc_status: "verified",
        created_at: "2024-08-15T10:00:00Z",
        is_admin: false
      },
      {
        id: "2",
        email: "admin@example.com",
        username: "Admin",
        full_name: "Administrator",
        neon_coins: 10000,
        kyc_status: "verified",
        created_at: "2024-08-14T09:00:00Z",
        is_admin: true
      }
    ]

          // Simple search filtering
    let filteredUsers = demoUsers
    if (search) {
      filteredUsers = demoUsers.filter(user => 
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        user.username.toLowerCase().includes(search.toLowerCase())
      )
    }

          // Simple pagination
    const start = (page - 1) * limit
    const end = start + limit
    const paginatedUsers = filteredUsers.slice(start, end)

    return NextResponse.json({
      users: paginatedUsers,
      pagination: {
        page,
        limit,
        total: filteredUsers.length,
        pages: Math.ceil(filteredUsers.length / limit),
      },
    })
  } catch (error) {
    console.error("Admin users error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId, updates } = await request.json()

          // Simple stub for update
    console.log("Update user:", userId, updates)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin user update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
