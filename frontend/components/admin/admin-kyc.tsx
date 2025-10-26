"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, CheckCircle, XCircle, Clock } from "lucide-react"

export default function AdminKYC() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          KYC Management
        </CardTitle>
        <CardDescription>
          User document verification
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">All</Button>
            <Button variant="outline" className="flex-1">Pending</Button>
            <Button variant="outline" className="flex-1">Approved</Button>
            <Button variant="outline" className="flex-1">Rejected</Button>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium">jane.smith@example.com</p>
                  <p className="text-gray-400 text-sm">Submitted: 14.08.2024</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
                    <Clock className="h-3 w-3 mr-1" />
                    Pending
                  </Badge>
                                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Approve
                  </Button>
                                  <Button size="sm" variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    Reject
                  </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
