import { NextRequest, NextResponse } from 'next/server'
import { getUserById } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    // Get session from cookie (in production, use proper session management)
    const sessionCookie = request.cookies.get('session')
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    let session
    try {
      session = JSON.parse(sessionCookie.value)
    } catch {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    const user = await getUserById(session.userId)
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Return user profile without sensitive information
    const profile = {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      neon_coins: user.neon_coins,
      level: user.level,
      experience: user.experience,
      kyc_status: user.kyc_status,
      created_at: user.created_at
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get session from cookie
    const sessionCookie = request.cookies.get('session')
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    let session
    try {
      session = JSON.parse(sessionCookie.value)
    } catch {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    const updates = await request.json()
    
    // Import here to avoid circular dependency
    const { updateUser } = await import('@/lib/database')
    const success = await updateUser(session.userId, updates)

    if (success) {
      // Get updated user profile
      const { getUserById } = await import('@/lib/database')
      const user = await getUserById(session.userId)
      
      const profile = {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        neon_coins: user.neon_coins,
        level: user.level,
        experience: user.experience,
        kyc_status: user.kyc_status,
        created_at: user.created_at
      }

      return NextResponse.json({ profile })
    } else {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}





