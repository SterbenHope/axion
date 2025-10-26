"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Gift, Plus, Copy, Edit, Trash2 } from "lucide-react"

export default function AdminPromoCodes() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Promo Codes Management
        </CardTitle>
        <CardDescription>
          Create and manage promo codes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
                          <Button variant="outline">All</Button>
            <Button variant="outline">Active</Button>
            <Button variant="outline">Inactive</Button>
            </div>
                          <Button className="bg-cyan-600 hover:bg-cyan-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Code
              </Button>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                  <Gift className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium">WELCOME2024</p>
                  <p className="text-gray-400 text-sm">20% discount on first deposit</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                    Active
                  </Badge>
                <Button size="sm" variant="outline">
                                      <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                <Button size="sm" variant="outline">
                                      <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                <Button size="sm" variant="destructive">
                  <Trash2 className="h-3 w-3 mr-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
