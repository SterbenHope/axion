'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Zap, Shield, Users, Gamepad2, Globe, Award } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function AboutPage() {
  const t = useTranslations('about')

  const features = [
    {
      icon: Zap,
      title: t('features.innovation.title'),
      description: t('features.innovation.description')
    },
    {
      icon: Shield,
      title: t('features.security.title'),
      description: t('features.security.description')
    },
    {
      icon: Users,
      title: t('features.community.title'),
      description: t('features.community.description')
    },
    {
      icon: Gamepad2,
      title: t('features.quality.title'),
      description: t('features.quality.description')
    },
    {
      icon: Globe,
      title: t('features.multilingual.title'),
      description: t('features.multilingual.description')
    },
    {
      icon: Award,
      title: t('features.rewards.title'),
      description: t('features.rewards.description')
    }
  ]

  const stats = [
    { label: t('stats.games'), value: "3+" },
    { label: t('stats.languages'), value: "10" },
    { label: t('stats.players'), value: "1000+" },
    { label: t('stats.uptime'), value: "24/7" }
  ]

  return (
    <div className="min-h-screen bg-black text-white py-20">
      <div className="max-w-6xl mx-auto px-4">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center mb-6">
            <Zap className="h-16 w-16 text-cyan-400 animate-pulse-neon" />
          </div>
          <h1 className="text-5xl font-bold text-white neon-glow mb-6">
            {t('title')}
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
        >
          {stats.map((stat, index) => (
            <Card key={stat.label} className="bg-black/50 border-cyan-500/30 text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-cyan-400 mb-2">{stat.value}</div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            {t('ourAdvantages')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={feature.title} className="bg-black/50 border-cyan-500/30 hover:border-cyan-400/50 transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-3">
                      <Icon className="h-8 w-8 text-cyan-400" />
                      <CardTitle className="text-white text-lg">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </motion.div>

        {/* Mission */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mb-16"
        >
          <Card className="bg-black/50 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-white text-2xl text-center">{t('ourMission')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <p className="text-gray-300 text-lg leading-relaxed">
                  {t('missionText')}
                </p>
                <p className="text-gray-400">
                  {t('missionSubtext')}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center"
        >
          <Card className="bg-black/50 border-cyan-500/30">
            <CardContent className="pt-6">
              <p className="text-gray-400 mb-6">
                {t('readyToJoin')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/games">
                  <Button className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700">
                    <Gamepad2 className="mr-2 h-4 w-4" />
                    {t('startPlaying')}
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button variant="outline" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
                    <Users className="mr-2 h-4 w-4" />
                    {t('register')}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

















