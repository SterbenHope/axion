"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Users, Gift, CreditCard, BarChart3, AlertTriangle, LogOut } from "lucide-react"
import AdminDashboard from "@/components/admin/admin-dashboard"
import AdminUsers from "@/components/admin/admin-users"
import AdminKYC from "@/components/admin/admin-kyc"
import AdminPromoCodes from "@/components/admin/admin-promo-codes"
import AdminTransactions from "@/components/admin/admin-transactions"

export default function AdminPage() {
  const { user, isAuthenticated, isLoading, signOut } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (isLoading) return
      
      if (!isAuthenticated) {
        router.push('/login')
        return
      }

      try {
        const token = localStorage.getItem('token')
        const response = await fetch('http://localhost:8000/api/admin/stats/', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.status === 403) {
          router.push('/dashboard')
          return
        }

        if (response.ok) {
          setIsAdmin(true)
        } else {
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Failed to check admin access:', error)
        router.push('/dashboard')
      } finally {
        setCheckingAuth(false)
      }
    }

    checkAdminAccess()
  }, [isAuthenticated, isLoading, router])

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  if (isLoading || checkingAuth) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-cyan-400">Проверка прав доступа...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-400 mb-2">Доступ запрещен</h1>
          <p className="text-gray-400 mb-4">У вас нет прав для доступа к админ-панели</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Вернуться в казино
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
      <div className="bg-black/50 border-b border-cyan-500/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                NeonCasino Admin Panel
              </h1>
              <p className="text-gray-400 mt-1">Управление казино</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-400">Администратор</p>
                <p className="text-cyan-400 font-medium">{user?.username || 'Admin'}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg border border-red-500/30 transition-all hover:border-red-400"
              >
                <LogOut className="h-4 w-4" />
                Выйти
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="bg-black/50 border border-cyan-500/30 backdrop-blur-sm p-1">
            <TabsTrigger
              value="dashboard"
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border-cyan-400/50 transition-all"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border-cyan-400/50 transition-all"
            >
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger 
              value="kyc" 
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border-cyan-400/50 transition-all"
            >
              <Shield className="h-4 w-4 mr-2" />
              KYC Queue
            </TabsTrigger>
            <TabsTrigger
              value="promos"
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border-cyan-400/50 transition-all"
            >
              <Gift className="h-4 w-4 mr-2" />
              Promo Codes
            </TabsTrigger>
            <TabsTrigger
              value="transactions"
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border-cyan-400/50 transition-all"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Transactions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <AdminDashboard />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <AdminUsers />
          </TabsContent>

          <TabsContent value="kyc" className="space-y-6">
            <AdminKYC />
          </TabsContent>

          <TabsContent value="promos" className="space-y-6">
            <AdminPromoCodes />
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <AdminTransactions />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
