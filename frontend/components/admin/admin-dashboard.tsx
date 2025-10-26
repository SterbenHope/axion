"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, GamepadIcon, CreditCard, Shield, Gift, TrendingUp } from "lucide-react"

interface AdminStats {
  users: {
    total: number
    today: number
    week: number
  }
  games: {
    total: number
    today: number
    week: number
  }
  transactions: {
    total: number
    todayVolume: number
  }
  kyc: {
    pending: number
  }
  promoCodes: {
    active: number
  }
  recentUsers: Array<{
    id: string
    email: string
    username: string
    created_at: string
    neon_coins: number
  }>
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const response = await fetch("http://localhost:8000/api/admin/stats/", {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      })
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading dashboard...</div>
  }

  if (!stats) {
    return <div className="text-center py-8 text-red-400">Failed to load dashboard data</div>
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats?.users?.total || 0,
      change: `+${stats?.users?.today || 0} today`,
      icon: Users,
      color: "text-cyan-400",
    },
    {
      title: "Games Played",
      value: stats?.games?.total || 0,
      change: `+${stats?.games?.today || 0} today`,
      icon: GamepadIcon,
      color: "text-purple-400",
    },
    {
      title: "Transactions",
      value: stats?.transactions?.total || 0,
      change: `${stats?.transactions?.todayVolume || 0} NC today`,
      icon: CreditCard,
      color: "text-green-400",
    },
    {
      title: "Pending KYC",
      value: stats?.kyc?.pending || 0,
      change: "Requires review",
      icon: Shield,
      color: "text-yellow-400",
    },
    {
      title: "Active Promos",
      value: stats?.promoCodes?.active || 0,
      change: "Currently active",
      icon: Gift,
      color: "text-pink-400",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="bg-black/50 border-cyan-500/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <p className="text-xs text-gray-500">{stat.change}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Users */}
      <Card className="bg-black/50 border-cyan-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-cyan-400">
            <TrendingUp className="h-5 w-5" />
            Recent Registrations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats?.recentUsers?.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                <div>
                  <div className="font-medium text-white">{user.username}</div>
                  <div className="text-sm text-gray-400">{user.email}</div>
                </div>
                <div className="text-right">
                  <div className="text-cyan-400 font-medium">{user.neon_coins} NC</div>
                  <div className="text-xs text-gray-500">{new Date(user.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            )) || (
              <div className="text-center py-4 text-gray-400">
                No recent users data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
