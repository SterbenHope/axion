"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Upload, Loader2 } from "lucide-react"

export default function KYCForm() {
  const [files, setFiles] = useState<{
    documentFront: File | null
    documentBack: File | null
    selfie: File | null
  }>({
    documentFront: null,
    documentBack: null,
    selfie: null,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleFileChange = (type: keyof typeof files, file: File | null) => {
    setFiles((prev) => ({ ...prev, [type]: file }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!files.documentFront || !files.selfie) {
      setMessage({ type: "error", text: "Document front and selfie are required" })
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append("documentFront", files.documentFront)
      if (files.documentBack) {
        formData.append("documentBack", files.documentBack)
      }
      formData.append("selfie", files.selfie)

      const response = await fetch("/api/kyc/submit", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: "success", text: data.message })
        setFiles({ documentFront: null, documentBack: null, selfie: null })
      } else {
        setMessage({ type: "error", text: data.error })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to submit KYC documents" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="bg-black/50 border-cyan-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-cyan-400">
          <Shield className="h-5 w-5" />
          KYC Verification
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-cyan-300 mb-2">Document Front (Required)</label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange("documentFront", e.target.files?.[0] || null)}
                className="bg-black/50 border-cyan-500/30 text-white"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-300 mb-2">Document Back (Optional)</label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange("documentBack", e.target.files?.[0] || null)}
                className="bg-black/50 border-cyan-500/30 text-white"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-300 mb-2">Selfie with Document (Required)</label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange("selfie", e.target.files?.[0] || null)}
                className="bg-black/50 border-cyan-500/30 text-white"
                disabled={isLoading}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading || !files.documentFront || !files.selfie}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Submit KYC Documents
              </>
            )}
          </Button>

          {message && (
            <div
              className={`p-3 rounded-lg text-sm ${
                message.type === "success"
                  ? "bg-green-500/10 border border-green-500/50 text-green-400"
                  : "bg-red-500/10 border border-red-500/50 text-red-400"
              }`}
            >
              {message.text}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
