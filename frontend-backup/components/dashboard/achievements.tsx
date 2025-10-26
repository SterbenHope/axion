"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Star } from "lucide-react"
import { motion } from "framer-motion"

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

interface AchievementsProps {
  achievements: Achievement[]
  loading?: boolean
}

export default function Achievements({ achievements, loading = false }: AchievementsProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="bg-black/50 border-yellow-500/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-medium text-white flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-400" />
            Achievements
          </CardTitle>
          <Badge variant="outline" className="text-yellow-400 border-yellow-500/30">
            {achievements?.length || 0}
          </Badge>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading achievements...</p>
            </div>
          ) : !achievements || !Array.isArray(achievements) || achievements.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
          <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium text-white mb-2">Your achievements await!</p>
          <p className="text-gray-400 mb-4">All achievements are ahead, but every great journey starts with a single step!</p>
          <p className="text-sm text-gray-500">Win games, complete challenges, and build your legacy</p>
        </div>
          ) : (
            <div className="space-y-3">
              {achievements?.map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30"
                >
                  <div className="text-2xl">{achievement.achievements.icon || '🏆'}</div>
                  <div className="flex-1">
                    <div className="font-medium text-white flex items-center gap-2">
                      {achievement.achievements.name}
                      <Star className="h-4 w-4 text-yellow-400" />
                    </div>
                    <div className="text-sm text-gray-400 mb-1">{achievement.achievements.description}</div>
                    <div className="text-xs text-gray-500">Earned: {formatDate(achievement.earned_at)}</div>
                  </div>
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                    +{achievement.achievements.reward_coins} NC
                  </Badge>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
