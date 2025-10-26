import { NextResponse } from "next/server"

// Mock data that will be replaced with Django API calls
const mockRecentGames = [
  {
    id: "1",
    bet_amount: 50.00,
    result_amount: 125.00,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    games: {
      name: "Neon Slots",
      type: "slots"
    }
  },
  {
    id: "2", 
    bet_amount: 100.00,
    result_amount: 0.00,
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    games: {
      name: "Blackjack",
      type: "blackjack"
    }
  },
  {
    id: "3",
    bet_amount: 75.00,
    result_amount: 300.00,
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    games: {
      name: "Wheel of Fortune",
      type: "wheel"
    }
  }
]

const mockAchievements = [
  {
    id: "1",
    earned_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    achievements: {
      name: "First Victory",
      description: "Win your first game",
      icon: "🏆",
      reward_coins: 100
    }
  },
  {
    id: "2",
    earned_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    achievements: {
      name: "Lucky Streak",
      description: "Win 3 games in a row",
      icon: "🔥",
      reward_coins: 250
    }
  },
  {
    id: "3",
    earned_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    achievements: {
      name: "High Roller",
      description: "Place a bet of 100+ NeonCoins",
      icon: "💎",
      reward_coins: 500
    }
  }
]

const mockUserStats = {
  total_winnings: 4125.00,
  total_losses: 3250.00,
  total_games_played: 47,
  total_wins: 23,
  win_rate: 48.9,
  total_wagered: 3250.00,
  total_won: 4125.00,
  net_profit: 875.00,
  average_bet: 69.15,
  longest_win_streak: 4,
  current_balance: 2875.00
}

export async function GET() {
  try {
    // For now, use mock data while we integrate with Django
    // TODO: Implement proper authentication with Django backend
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return NextResponse.json({
      success: true,
      recentGames: mockRecentGames,
      achievements: mockAchievements,
      stats: mockUserStats
    })
  } catch (error) {
    console.error('Dashboard data error:', error)
    
    return NextResponse.json(
      { success: false, error: 'Failed to load dashboard data' },
      { status: 500 }
    )
  }
}
