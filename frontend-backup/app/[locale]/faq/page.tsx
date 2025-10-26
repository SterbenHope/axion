'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface FAQItem {
  question: string
  answer: string
}

export default function FAQPage() {
  const t = useTranslations('faq')
  const [openItems, setOpenItems] = useState<number[]>([])

  const faqItems: FAQItem[] = [
    {
      question: "Что такое NeonCoins?",
      answer: "NeonCoins - это виртуальная валюта NeonCasino, используемая для игры в наши киберпанк игры. 1 NC = 1 EUR = 1 USD."
    },
    {
      question: "Как пополнить баланс?",
      answer: "Вы можете пополнить баланс через раздел 'Платежи', используя банковские карты, криптовалюты или банковские переводы."
    },
    {
      question: "Что такое KYC верификация?",
      answer: "KYC (Know Your Customer) - это процесс верификации личности, необходимый для вывода средств и обеспечения безопасности."
    },
    {
      question: "Как использовать промокоды?",
      answer: "Введите промокод в разделе 'Промокоды' и нажмите 'Активировать'. Бонус будет зачислен на ваш баланс."
    },
    {
      question: "Какие игры доступны?",
      answer: "У нас есть слоты, блэкджек, колесо фортуны и другие игры в киберпанк стиле."
    },
    {
      question: "Как вывести выигрыши?",
      answer: "Для вывода средств необходимо пройти KYC верификацию. После одобрения вы можете вывести средства через раздел 'Транзакции'."
    }
  ]

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  return (
    <div className="min-h-screen bg-black text-white py-20">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <HelpCircle className="h-12 w-12 text-cyan-400" />
          </div>
          <h1 className="text-4xl font-bold text-white neon-glow mb-4">
            {t('title')}
          </h1>
          <p className="text-xl text-gray-300">
            {t('subtitle')}
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
            >
              <Card className="bg-black/50 border-cyan-500/30 hover:border-cyan-400/50 transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">
                    <Button
                      variant="ghost"
                      onClick={() => toggleItem(index)}
                      className="w-full justify-between p-0 h-auto text-left text-white hover:bg-transparent"
                    >
                      <span>{item.question}</span>
                      {openItems.includes(index) ? (
                        <ChevronUp className="h-5 w-5 text-cyan-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-cyan-400" />
                      )}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <AnimatePresence>
                  {openItems.includes(index) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <CardContent className="pt-0">
                        <p className="text-gray-300 leading-relaxed">
                          {item.answer}
                        </p>
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center mt-12"
        >
          <p className="text-gray-400 mb-4">
            {t('noAnswer')}
          </p>
          <Button
            variant="outline"
            className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
          >
            {t('contactSupport')}
          </Button>
        </motion.div>
      </div>
    </div>
  )
}

















