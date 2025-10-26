"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChevronDown, Globe } from "lucide-react"
import { useLocale } from "next-intl"

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' }
]

export default function LanguageSelector() {
  const locale = useLocale()
  const [isOpen, setIsOpen] = useState(false)

  const currentLanguage = languages.find((lang) => lang.code === locale)

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-black/50 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 flex items-center gap-2"
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">
          {currentLanguage?.flag} {currentLanguage?.name}
        </span>
        <span className="sm:hidden">{currentLanguage?.flag}</span>
        <ChevronDown className="h-4 w-4" />
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <Card className="absolute top-full mt-2 right-0 z-20 bg-black/90 border-cyan-500/30 backdrop-blur-sm min-w-[200px]">
            <div className="p-2">
              {languages.map((lang) => (
                <Button
                  key={lang.code}
                  variant="ghost"
                  onClick={() => {
                    // Redirect to selected locale root
                    window.location.href = `/${lang.code}`
                    setIsOpen(false)
                  }}
                  className={`w-full justify-start text-left hover:bg-cyan-500/10 ${
                    locale === lang.code ? "bg-cyan-500/20 text-cyan-400" : "text-gray-300"
                  }`}
                >
                  <span className="mr-2">{lang.flag}</span>
                  {lang.name}
                </Button>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
