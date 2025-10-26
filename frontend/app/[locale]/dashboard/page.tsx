"use client"

import { useState, useEffect } from "react"
import { useTranslations, useLocale } from "next-intl"
import Header from "@/components/layout/header"
import Footer from "@/components/layout/footer"
import BalanceCard from "@/components/dashboard/balance-card"
import RecentGames from "@/components/dashboard/recent-games"
import Achievements from "@/components/dashboard/achievements"
import DepositOverview from "@/components/dashboard/deposit-overview"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Gift, Gamepad2 } from "lucide-react"

import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { getRecentGames, getAchievements, getUserStats, getUserBalance } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface Game {
  id: number
  bet_amount: string
  result_amount: string
  started_at: string
  game: {
    title: string
    game_type: string
  }
  is_win: boolean
  profit_loss: string
}

interface Achievement {
  id: number
  earned_at: string
  achievements: {
    name: string
    description: string
    icon: string
    reward_coins: number
  }
}

export default function DashboardPage() {
  const t = useTranslations()
  const locale = useLocale()
  const { user, setUser, isLoading: authLoading } = useAuth()
  const { toast } = useToast()
  const [recentGames, setRecentGames] = useState<Game[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    console.log('Dashboard useEffect: user =', user, 'authLoading =', authLoading, 'loading =', loading)
    
    // Check JWT token
    const token = localStorage.getItem('token')
    console.log('Dashboard: JWT token check:', token ? 'Token found' : 'No token')
    
    // Only fetch data once when user is authenticated, auth is not loading, and token exists
    if (user && !authLoading && loading && token) {
      console.log('Dashboard: User authenticated and token present, fetching data...')
      fetchDashboardData()
    } else if (!user && !authLoading) {
      console.log('Dashboard: No user, clearing data...')
      // No user - don't fetch any data and don't show loading
      setLoading(false)
      setRecentGames([])
      setAchievements([])
      setStats(null)
    } else if (user && !token) {
      console.log('Dashboard: User exists but no token, but not clearing data yet...')
      setLoading(false)
      // Don't clear data immediately, give system time to restore token
      // setRecentGames([])
      // setAchievements([])
      // setStats(null)
      
      // Don't send clear event as this might be a temporary issue
      // window.dispatchEvent(new CustomEvent('clearUserState'))
    } else if (!user && !token) {
      console.log('Dashboard: No user and no token, clearing data...')
      setLoading(false)
      setRecentGames([])
      setAchievements([])
      setStats(null)
    }
  }, [user, authLoading, loading]) // Added loading back to prevent stale state

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Check if user has JWT token
      const token = localStorage.getItem('token')
      console.log('Dashboard: Checking JWT token:', token ? token.substring(0, 20) + '...' : 'No token')
      
      if (!token) {
        console.error('No JWT token found')
        toast({
          title: "Authentication Error",
          description: "Please sign in again",
          variant: "destructive"
        })
        return
      }
      
      // Fetch real data from API
      const [gamesData, achievementsData, statsData, balanceData] = await Promise.allSettled([
        getRecentGames(),
        getAchievements(),
        getUserStats(),
        getUserBalance()
      ])

      if (gamesData.status === 'fulfilled' && gamesData.value) {
        const games = gamesData.value || []
        setRecentGames(games)
        
        // If no games, show encouraging message
        if (games.length === 0) {
          console.log('No recent games found - showing encouraging message')
        }
      } else if (gamesData.status === 'rejected') {
        console.error('Failed to fetch recent games:', gamesData.reason)
        setRecentGames([])
      }

      if (achievementsData.status === 'fulfilled' && achievementsData.value) {
        const achievements = achievementsData.value || []
        setAchievements(achievements)
        
        // If no achievements, show encouraging message
        if (achievements.length === 0) {
          console.log('No achievements found - showing encouraging message')
        }
      } else if (achievementsData.status === 'rejected') {
        console.error('Failed to fetch achievements:', achievementsData.reason)
        setAchievements([])
      }

      if (statsData.status === 'fulfilled' && statsData.value) {
        setStats(statsData.value)
      } else if (statsData.status === 'rejected') {
        console.error('Failed to fetch user stats:', statsData.reason)
        setStats(null)
      }

      if (balanceData.status === 'fulfilled') {
        // Balance data received successfully
        console.log('Balance data:', balanceData.value)
      } else {
        console.error('Failed to fetch user balance:', balanceData.reason)
      }

    } catch (error) {
      console.error('Dashboard data fetch error:', error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black cyber-grid">
        <Header />
        <main className="pt-20 pb-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
              <p className="text-white mt-4">Loading...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Show message for unauthenticated users
  if (!user && !authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black cyber-grid">
        <Header />
        <main className="pt-20 pb-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white mb-4">Dashboard</h1>
              <p className="text-gray-400 mb-6">Please log in to view your dashboard</p>
              <Link href="/login" className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-3 rounded-lg font-medium">
                Login
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black cyber-grid">
        <Header />
        <main className="pt-20 pb-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white mb-4">Dashboard</h1>
              <p className="text-gray-400 mb-6">Please log in to view your dashboard</p>
              <Link href="/login" className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-3 rounded-lg font-medium">
                Login
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black cyber-grid">
      <Header />
      <main className="pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2 font-mono">
              {t('dashboard.welcome')}, <span className="text-cyan-400">{user.username}</span>!
            </h1>
            <p className="text-gray-300">{t('dashboard.manageAccount')}</p>
            <div className="mt-2 p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg inline-block">
              <p className="text-cyan-400 text-sm font-mono">
                💰 {t('dashboard.currencyInfo')}
              </p>
            </div>
          </div>

          {/* Balance Card */}
          <div className="mb-8">
            <BalanceCard 
              balance={user.balance_neon || 0}
              totalWinnings={stats?.total_winnings || 0}
              totalLosses={stats?.total_losses || 0}
            />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-black/50 border-purple-500/30 hover:border-purple-400/50 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg flex items-center">
                  <Plus className="h-5 w-5 mr-2 text-green-400" />
                  {t('dashboard.deposit')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm mb-4">
                  {t('dashboard.depositDescription')}
                </p>
                <Link href={`/${locale}/payments`}>
                  <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                    {t('dashboard.depositNow')}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-black/50 border-purple-500/30 hover:border-purple-400/50 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg flex items-center">
                  <Gift className="h-5 w-5 mr-2 text-yellow-400" />
                  {t('dashboard.promoCode')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm mb-4">
                  {t('dashboard.promoCodeDescription')}
                </p>
                <Link href={`/${locale}/dashboard#promo`}>
                  <Button className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700">
                    {t('dashboard.enterPromo')}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-black/50 border-purple-500/30 hover:border-purple-400/50 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg flex items-center">
                  <Gamepad2 className="h-5 w-5 mr-2 text-blue-400" />
                  {t('dashboard.playGames')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm mb-4">
                  {t('dashboard.playGamesDescription')}
                </p>
                <Link href={`/${locale}/games`}>
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700">
                    {t('dashboard.browseGames')}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Dashboard Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Games */}
            <div>
              <RecentGames games={recentGames} loading={loading} />
            </div>

            {/* Achievements */}
            <div>
              <Achievements achievements={achievements} loading={loading} />
            </div>
          </div>

          {/* Promo Code Section */}
          <div id="promo" className="mt-12">
            <Card className="bg-black/50 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white text-2xl flex items-center">
                  <Gift className="h-6 w-6 mr-3 text-yellow-400" />
                  {t('promoCode.title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-gray-300 mb-6">
                    {t('promoCode.info.title')}
                  </p>
                  <div className="max-w-md mx-auto">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder={t('promoCode.placeholder')}
                        className="flex-1 px-4 py-2 bg-black/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                      />
                      <Button className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700">
                        {t('promoCode.activate')}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {t('promoCode.info.oneTime')} • {t('promoCode.info.expiration')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Deposit Section */}
          <DepositOverview />
        </div>
      </main>
      <Footer />
    </div>
  )
}
