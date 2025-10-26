'use client'

import { useState } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Bitcoin, Copy, CheckCircle } from 'lucide-react'
import { Label } from '@/components/ui/label'



interface CryptoPaymentFormProps {
  amount: number
  cryptoType: string
  walletAddress: string
  onSubmit: (cryptoType: string, network: string) => void
  loading?: boolean
}

export default function CryptoPaymentForm({ 
  amount, 
  cryptoType, 
  walletAddress, 
  onSubmit, 
  loading = false 
}: CryptoPaymentFormProps) {

  const [copied, setCopied] = useState(false)
  const [selectedCrypto, setSelectedCrypto] = useState(cryptoType)
  const [selectedNetwork, setSelectedNetwork] = useState('mainnet')

  const getCryptoIcon = (type: string) => {
    switch (type) {
      case 'btc':
        return <Bitcoin className="h-5 w-5" />
      case 'eth':
        return <div className="h-5 w-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">Ξ</div>
      case 'ltc':
        return <div className="h-5 w-5 bg-gray-500 rounded-full flex items-center justify-center text-white text-xs font-bold">Ł</div>
      case 'usdc':
        return <div className="h-5 w-5 bg-blue-400 rounded-full flex items-center justify-center text-white text-xs font-bold">$</div>
      case 'usdt':
        return <div className="h-5 w-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">₮</div>
      case 'trx':
        return <div className="h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">T</div>
      case 'bnb':
        return <div className="h-5 w-5 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold">B</div>
      case 'ada':
        return <div className="h-5 w-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">₳</div>
      case 'sol':
        return <div className="h-5 w-5 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">◎</div>
      case 'dot':
        return <div className="h-5 w-5 bg-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">●</div>
      case 'matic':
        return <div className="h-5 w-5 bg-purple-400 rounded-full flex items-center justify-center text-white text-xs font-bold">M</div>
      default:
        return <div className="h-5 w-5 bg-gray-600 rounded-full flex items-center justify-center text-white text-xs font-bold">?</div>
    }
  }

  const getCryptoName = (type: string) => {
    switch (type) {
      case 'btc':
        return 'Bitcoin'
      case 'eth':
        return 'Ethereum'
      case 'ltc':
        return 'Litecoin'
      case 'usdc':
        return 'USDC'
      case 'usdt':
        return 'USDT'
      case 'trx':
        return 'TRON'
      case 'bnb':
        return 'BNB'
      case 'ada':
        return 'Cardano'
      case 'sol':
        return 'Solana'
      case 'dot':
        return 'Polkadot'
      case 'matic':
        return 'Polygon'
      default:
        return type.toUpperCase()
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          {getCryptoIcon(selectedCrypto)}
          <span>{getCryptoName(selectedCrypto)} Payment</span>
        </CardTitle>
        <CardDescription className="text-gray-400">
          Send {amount.toFixed(2)} EUR worth of {getCryptoName(selectedCrypto)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Crypto Selection */}
        <div className="space-y-2">
          <Label className="text-white">Select Cryptocurrency:</Label>
          <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
            <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
              <SelectValue placeholder="Choose cryptocurrency" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              <SelectItem value="btc">Bitcoin (BTC)</SelectItem>
              <SelectItem value="eth">Ethereum (ETH)</SelectItem>
              <SelectItem value="ltc">Litecoin (LTC)</SelectItem>
              <SelectItem value="usdc">USDC</SelectItem>
              <SelectItem value="usdt">USDT</SelectItem>
              <SelectItem value="trx">TRON (TRX)</SelectItem>
              <SelectItem value="bnb">BNB</SelectItem>
              <SelectItem value="ada">Cardano (ADA)</SelectItem>
              <SelectItem value="sol">Solana (SOL)</SelectItem>
              <SelectItem value="dot">Polkadot (DOT)</SelectItem>
              <SelectItem value="matic">Polygon (MATIC)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Network Selection */}
        <div className="space-y-2">
          <Label className="text-white">Select Network:</Label>
          <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
            <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
              <SelectValue placeholder="Choose network" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              {selectedCrypto === 'eth' && (
                <>
                  <SelectItem value="mainnet">Ethereum Mainnet</SelectItem>
                  <SelectItem value="polygon">Polygon</SelectItem>
                  <SelectItem value="arbitrum">Arbitrum</SelectItem>
                  <SelectItem value="optimism">Optimism</SelectItem>
                  <SelectItem value="bsc">Binance Smart Chain</SelectItem>
                </>
              )}
              {selectedCrypto === 'usdc' && (
                <>
                  <SelectItem value="mainnet">Ethereum Mainnet</SelectItem>
                  <SelectItem value="polygon">Polygon</SelectItem>
                  <SelectItem value="arbitrum">Arbitrum</SelectItem>
                  <SelectItem value="bsc">Binance Smart Chain</SelectItem>
                </>
              )}
              {selectedCrypto === 'usdt' && (
                <>
                  <SelectItem value="mainnet">Ethereum Mainnet</SelectItem>
                  <SelectItem value="polygon">Polygon</SelectItem>
                  <SelectItem value="bsc">Binance Smart Chain</SelectItem>
                  <SelectItem value="tron">TRON Network</SelectItem>
                </>
              )}
              {selectedCrypto === 'btc' && (
                <>
                  <SelectItem value="mainnet">Bitcoin Mainnet</SelectItem>
                  <SelectItem value="lightning">Lightning Network</SelectItem>
                </>
              )}
              {selectedCrypto === 'ltc' && (
                <>
                  <SelectItem value="mainnet">Litecoin Mainnet</SelectItem>
                </>
              )}
              {selectedCrypto === 'trx' && (
                <>
                  <SelectItem value="mainnet">TRON Mainnet</SelectItem>
                </>
              )}
              {selectedCrypto === 'bnb' && (
                <>
                  <SelectItem value="mainnet">Binance Smart Chain</SelectItem>
                </>
              )}
              {selectedCrypto === 'ada' && (
                <>
                  <SelectItem value="mainnet">Cardano Mainnet</SelectItem>
                </>
              )}
              {selectedCrypto === 'sol' && (
                <>
                  <SelectItem value="mainnet">Solana Mainnet</SelectItem>
                </>
              )}
              {selectedCrypto === 'dot' && (
                <>
                  <SelectItem value="mainnet">Polkadot Mainnet</SelectItem>
                </>
              )}
              {selectedCrypto === 'matic' && (
                <>
                  <SelectItem value="mainnet">Polygon Mainnet</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Payment Instructions */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-white font-medium mb-2">Payment Instructions:</h3>
          <ol className="text-gray-300 text-sm space-y-2 list-decimal list-inside">
            <li>Copy the wallet address below</li>
            <li>Send exactly {amount.toFixed(2)} EUR worth of {getCryptoName(selectedCrypto)}</li>
            <li>Wait for confirmation (usually takes 5-10 minutes)</li>
            <li>Your account will be credited automatically</li>
          </ol>
        </div>

        {/* Wallet Address */}
        <div className="space-y-2">
          <Label className="text-white text-sm">Wallet Address:</Label>
          <div className="flex items-center space-x-2 p-3 bg-gray-800 rounded-lg border border-gray-600">
            <code className="text-green-400 text-sm flex-1 break-all">
              {walletAddress}
            </code>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={copyToClipboard}
              className="text-gray-400 hover:text-white"
            >
              {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          {copied && (
            <p className="text-green-400 text-xs">Address copied to clipboard!</p>
          )}
        </div>

        {/* Important Notes */}
        <div className="bg-yellow-900/20 border border-yellow-700/50 p-4 rounded-lg">
          <h4 className="text-yellow-400 font-medium mb-2">⚠️ Important Notes:</h4>
          <ul className="text-yellow-200 text-sm space-y-1 list-disc list-inside">
            <li>Only send {getCryptoName(selectedCrypto)} to this address</li>
            <li>Send the exact amount specified</li>
            <li>Double-check the address before sending</li>
            <li>Payments are processed automatically</li>
          </ul>
        </div>

        {/* Confirm Button */}
        <Button
          onClick={() => onSubmit(selectedCrypto, selectedNetwork)}
          disabled={loading}
          className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
        >
          {loading ? 'Processing...' : 'I have sent the payment'}
        </Button>

        {/* Status */}
        <div className="text-center">
          <Badge variant="secondary" className="bg-gray-700 text-gray-300">
            Processing time: 5-10 minutes
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

