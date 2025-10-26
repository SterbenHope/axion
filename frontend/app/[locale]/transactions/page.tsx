"use client"

import { useState, useEffect } from "react"

import Header from "@/components/layout/header"
import Footer from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Search,

  Download,
  Calendar
} from "lucide-react"

interface Transaction {
  id: string
  type: "deposit" | "withdrawal" | "game" | "bonus"
  amount: number
  status: "pending" | "completed" | "failed" | "cancelled"
  created_at: string
  description: string
  reference_id?: string
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  useEffect(() => {
    fetchTransactions()
  }, [])

  useEffect(() => {
    filterTransactions()
  }, [transactions, searchTerm, statusFilter, typeFilter])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      // Mock data for now - replace with actual API call
      const mockTransactions: Transaction[] = [
        {
          id: "1",
          type: "deposit",
          amount: 1000,
          status: "completed",
          created_at: "2024-08-15T14:30:00Z",
          description: "Credit card deposit",
          reference_id: "DEP-001"
        },
        {
          id: "2",
          type: "game",
          amount: -250,
          status: "completed",
          created_at: "2024-08-15T13:15:00Z",
          description: "Neon Slots game",
          reference_id: "GAME-002"
        },
        {
          id: "3",
          type: "withdrawal",
          amount: -500,
          status: "pending",
          created_at: "2024-08-15T12:00:00Z",
          description: "Bank transfer withdrawal",
          reference_id: "WTH-003"
        },
        {
          id: "4",
          type: "bonus",
          amount: 100,
          status: "completed",
          created_at: "2024-08-15T10:00:00Z",
          description: "Welcome bonus",
          reference_id: "BONUS-004"
        },
        {
          id: "5",
          type: "game",
          amount: 150,
          status: "completed",
          created_at: "2024-08-14T18:30:00Z",
          description: "Cyber Blackjack win",
          reference_id: "GAME-005"
        }
      ]
      
      setTransactions(mockTransactions)
    } catch (error) {
      console.error("Failed to fetch transactions:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterTransactions = () => {
    let filtered = transactions

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(tx => 
        tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.reference_id?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(tx => tx.status === statusFilter)
    }

    // Filter by type
    if (typeFilter !== "all") {
      filtered = filtered.filter(tx => tx.type === typeFilter)
    }

    setFilteredTransactions(filtered)
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <TrendingUp className="h-5 w-5 text-green-400" />
      case "withdrawal":
        return <TrendingDown className="h-5 w-5 text-red-400" />
      case "game":
        return <DollarSign className="h-5 w-5 text-blue-400" />
      case "bonus":
        return <DollarSign className="h-5 w-5 text-yellow-400" />
      default:
        return <CreditCard className="h-5 w-5 text-gray-400" />
    }
  }

  const getTransactionColor = (type: string, amount: number) => {
    if (type === "deposit" || type === "bonus" || (type === "game" && amount > 0)) {
      return "bg-green-500/20 text-green-400 border-green-500/30"
    } else {
      return "bg-red-500/20 text-red-400 border-red-500/30"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "failed":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "cancelled":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const formatAmount = (amount: number) => {
    const sign = amount >= 0 ? "+" : ""
    return `${sign}${amount} NC`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black cyber-grid">
        <Header />
        <main className="pt-20 pb-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
              <p className="text-white mt-4">Loading transactions...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black cyber-grid">
      <Header />
      <main className="pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white neon-glow mb-2 font-mono">
              Transaction <span className="text-cyan-400">History</span>
            </h1>
            <p className="text-gray-300">Track all your deposits, withdrawals, and gaming transactions</p>
          </div>

          {/* Filters and Search */}
          <Card className="bg-black/50 border-purple-500/30 mb-6">
            <CardHeader>
              <CardTitle className="text-white">Filters & Search</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-black/50 border-purple-500/30 text-white"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-black/50 border-purple-500/30 text-white">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="bg-black/50 border-purple-500/30 text-white">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="deposit">Deposits</SelectItem>
                    <SelectItem value="withdrawal">Withdrawals</SelectItem>
                    <SelectItem value="game">Games</SelectItem>
                    <SelectItem value="bonus">Bonuses</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Transactions List */}
          <Card className="bg-black/50 border-purple-500/30">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-white">Transactions</CardTitle>
                <div className="text-sm text-gray-400">
                  {filteredTransactions.length} of {transactions.length} transactions
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No transactions found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-purple-500/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div>
                          <p className="text-white font-medium">{transaction.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span>{transaction.reference_id}</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(transaction.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge className={getTransactionColor(transaction.type, transaction.amount)}>
                          {formatAmount(transaction.amount)}
                        </Badge>
                        <Badge className={getStatusColor(transaction.status)}>
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </Badge>
                        <Button size="sm" variant="outline" className="border-purple-500/30 text-purple-400">
                          Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}

