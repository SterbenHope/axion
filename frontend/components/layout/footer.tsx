"use client"

import Link from "next/link"
import { Zap, Shield, Info, Mail } from "lucide-react"
import { useLocale } from "next-intl"

export default function Footer() {
  const locale = useLocale()

  return (
    <footer className="bg-black/90 border-t border-cyan-500/30 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Zap className="h-8 w-8 text-cyan-400 animate-pulse-neon" />
              <span className="text-2xl font-bold text-white neon-glow font-mono">NeonCasino</span>
            </div>
            <p className="text-gray-400 mb-4 max-w-md">The casino of the future with virtual NeonCoins currency. Experience the thrill of cyberpunk gaming.</p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Info className="h-4 w-4 text-cyan-400" />
              Information
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href={`/${locale}/about`} className="text-gray-400 hover:text-cyan-400 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/rules`} className="text-gray-400 hover:text-cyan-400 transition-colors">
                  Game Rules
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/faq`} className="text-gray-400 hover:text-cyan-400 transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Mail className="h-4 w-4 text-cyan-400" />
              Contact
            </h3>
            <ul className="space-y-2">
              <li>
                <a href="mailto:support@neoncasino.com" className="text-gray-400 hover:text-cyan-400 transition-colors">
                  support@neoncasino.com
                </a>
              </li>
              <li>
                <span className="text-gray-400">24/7 Support</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-cyan-500/30 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">© 2024 NeonCasino. All rights reserved.</p>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <Shield className="h-4 w-4 text-green-400" />
            <span className="text-green-400 text-sm">Secure Gaming Environment</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
