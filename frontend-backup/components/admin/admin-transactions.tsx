"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CreditCard, TrendingUp, TrendingDown, DollarSign } from "lucide-react"

export default function AdminTransactions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Transaction Management
        </CardTitle>
        <CardDescription>
          Monitoring all transactions in the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">All</Button>
            <Button variant="outline" className="flex-1">Deposits</Button>
            <Button variant="outline" className="flex-1">Withdrawals</Button>
            <Button variant="outline" className="flex-1">Games</Button>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium">user@example.com</p>
                  <p className="text-gray-400 text-sm">Deposit: 15.08.2024 14:30</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                  <DollarSign className="h-3 w-3 mr-1" />
                  +1000 NC
                </Badge>
                <Button size="sm" variant="outline">Details</Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                  <TrendingDown className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium">player@example.com</p>
                  <p className="text-gray-400 text-sm">Game: 15.08.2024 13:45</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-red-500/20 text-red-400">
                  <DollarSign className="h-3 w-3 mr-1" />
                  -250 NC
                </Badge>
                <Button size="sm" variant="outline">Details</Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
