"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

import Header from "@/components/layout/header"
import Footer from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import KYCForm from "@/components/profile/kyc-form"

interface UserProfile {
  id: string
  email: string
  username: string
  full_name: string
  avatar_url: string
  neon_coins: number
  level: number
  experience: number
  kyc_status: string
  created_at: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    full_name: "",
    avatar_url: "",
  })
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      // Get user data from localStorage or context
      const userData = localStorage.getItem('user')
      if (!userData) {
        setProfile(null)
        setLoading(false)
        return
      }
      
      const user = JSON.parse(userData)
      const profile: UserProfile = {
        id: user.id || "1",
        email: user.email || "",
        username: user.username || "",
        full_name: user.fullName || user.username || "",
        avatar_url: "",
        neon_coins: user.balance_neon || 0,
        level: 1,
        experience: 0,
        kyc_status: "pending",
        created_at: new Date().toISOString()
      }
      
      setProfile(profile)
      setFormData({
        username: profile.username || "",
        full_name: profile.full_name || "",
        avatar_url: profile.avatar_url || "",
      })
    } catch (error) {
      console.error("Failed to fetch profile:", error)
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Update profile in localStorage
      if (profile) {
        const updatedProfile = { ...profile, ...formData }
        setProfile(updatedProfile)
        
        // Update user in localStorage
        const userData = localStorage.getItem('user')
        if (userData) {
          const user = JSON.parse(userData)
          const updatedUser = { ...user, ...formData }
          localStorage.setItem('user', JSON.stringify(updatedUser))
        }
        
        toast({
          title: "Success",
          description: "Profile updated successfully",
        })
      }
    } catch (error) {
      console.error("Failed to update profile:", error)
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const getKycStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "rejected":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getKycStatusText = (status: string) => {
    switch (status) {
      case "verified":
        return "Verified"
      case "pending":
        return "Pending"
      case "rejected":
        return "Rejected"
      default:
        return "Not Verified"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black cyber-grid flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-cyan-400 animate-spin mx-auto mb-4" />
          <div className="text-white text-lg">Loading profile...</div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black cyber-grid flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Profile not found</h1>
          <Button onClick={() => router.push("/dashboard")} className="bg-cyan-500 hover:bg-cyan-600">
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black cyber-grid">
      <Header />
      <main className="pt-20 pb-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white neon-glow mb-2 font-mono">
              User <span className="text-cyan-400">Profile</span>
            </h1>
            <p className="text-gray-300">Manage your personal data and settings</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Info */}
            <div className="lg:col-span-1">
              <Card className="bg-black/50 border-purple-500/30">
                <CardHeader className="text-center">
                  <Avatar className="w-20 h-20 mx-auto mb-4">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback className="bg-purple-500 text-white text-2xl">
                      {profile.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-white">{profile.username || "User"}</CardTitle>
                  <p className="text-gray-400">{profile.email}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Level</span>
                    <span className="text-cyan-400 font-semibold">{profile.level}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Experience</span>
                    <span className="text-purple-400 font-semibold">{profile.experience} XP</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">KYC Status</span>
                    <span className={`px-2 py-1 rounded text-xs border ${getKycStatusColor(profile.kyc_status)}`}>
                      {getKycStatusText(profile.kyc_status)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Registration</span>
                    <span className="text-gray-300 text-sm">
                      {new Date(profile.created_at).toLocaleDateString("en-US")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Edit Form */}
            <div className="lg:col-span-2">
              <Card className="bg-black/50 border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-white">Edit Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        disabled
                        className="bg-gray-800/50 border-gray-600 text-gray-400"
                      />
                      <p className="text-xs text-gray-500">Email cannot be changed</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-white">Username</Label>
                      <Input
                        id="username"
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="bg-black/50 border-purple-500/30 text-white focus:border-purple-400 focus:ring-purple-400/20"
                        placeholder="Enter username"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="full_name" className="text-white">Full Name</Label>
                      <Input
                        id="full_name"
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        className="bg-black/50 border-purple-500/30 text-white focus:border-purple-400 focus:ring-purple-400/20"
                        placeholder="Enter full name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="avatar_url" className="text-white">Avatar URL</Label>
                      <Input
                        id="avatar_url"
                        type="url"
                        value={formData.avatar_url}
                        onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                        className="bg-black/50 border-purple-500/30 text-white focus:border-purple-400 focus:ring-purple-400/20"
                        placeholder="https://example.com/avatar.jpg"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={saving}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* KYC Verification */}
            <div className="lg:col-span-3">
              <KYCForm 
                kycStatus={profile?.kyc_status || 'NONE'} 
                onSubmit={async (data) => {
                  console.log('KYC data:', data)
                  // KYC submission is handled by the component itself
                }}
              />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
