"use client"

import { useState, useRef } from "react"
import axios from "axios"
import { API_URL } from "../../http"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { Upload, FileText, Camera, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface KYCFormProps {
  kycStatus: string
  onSubmit: (data: KYCData) => Promise<void>
}

interface KYCData {
  first_name: string
  last_name: string
  date_of_birth: string
  nationality: string
  country_of_residence: string
  address_line_1: string
  city: string
  state_province: string
  postal_code: string
  country: string
  phone_number: string
  id_document_type: string
  id_document_number: string
  id_document_issuing_country: string
  id_document_expiry_date: string
  document_front: File
  document_back?: File
  selfie_with_document: File
}

export default function KYCForm({ kycStatus }: KYCFormProps) {

  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    nationality: "",
    country_of_residence: "",
    address_line_1: "",
    city: "",
    state_province: "",
    postal_code: "",
    country: "",
    phone_number: "",
    id_document_type: "",
    id_document_number: "",
    id_document_issuing_country: "",
    id_document_expiry_date: "",
  })
  
  const [files, setFiles] = useState({
    document_front: null as File | null,
    document_back: null as File | null,
    selfie_with_document: null as File | null,
  })
  
  const fileInputs = {
    document_front: useRef<HTMLInputElement>(null),
    document_back: useRef<HTMLInputElement>(null),
    selfie_with_document: useRef<HTMLInputElement>(null),
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'REJECTED':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'PENDING':
        return <Clock className="h-5 w-5 text-yellow-500" />
      default:
        return <FileText className="h-5 w-5 text-gray-500" />
    }
  }



  const handleFileChange = (field: keyof typeof files, file: File | null) => {
    setFiles(prev => ({ ...prev, [field]: file }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!files.document_front || !files.selfie_with_document) {
      toast({
        title: "Error",
        description: "Please upload required documents",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // Create FormData for file upload
      const formDataToSend = new FormData()
      
      // Add form fields
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key as keyof typeof formData])
      })
      
      // Add files
      if (files.document_front) {
        formDataToSend.append('id_document_front', files.document_front)
      }
      if (files.document_back) {
        formDataToSend.append('id_document_back', files.document_back)
      }
      if (files.selfie_with_document) {
        formDataToSend.append('selfie_with_id', files.selfie_with_document)
      }
      
      // Add proof of address (required)
      if (files.selfie_with_document) {
        formDataToSend.append('proof_of_address', files.selfie_with_document)
      }
      
      const token = localStorage.getItem('token')
      
      // Submit to backend
      const response = await axios.post(`${API_URL}/kyc/submit/`, formDataToSend, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })
      
      toast({
        title: "Success",
        description: response.data.message || "KYC application submitted successfully!",
      })
    } catch (error) {
      console.error('KYC submission error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit KYC application",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (kycStatus === 'VERIFIED') {
    return (
      <Card className="bg-green-500/10 border-green-500/30">
        <CardHeader>
          <CardTitle className="text-green-500 flex items-center gap-2">
            {getStatusIcon('VERIFIED')}
            KYC Verification Complete
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-400">
            Your identity has been verified. You can now withdraw funds and access all features.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (kycStatus === 'PENDING') {
    return (
      <Card className="bg-yellow-500/10 border-yellow-500/30">
        <CardHeader>
          <CardTitle className="text-yellow-500 flex items-center gap-2">
            {getStatusIcon('PENDING')}
            KYC Under Review
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-yellow-400">
            Your KYC application is being reviewed. This usually takes 24-48 hours.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (kycStatus === 'REJECTED') {
    return (
      <Card className="bg-red-500/10 border-red-500/30">
        <CardHeader>
          <CardTitle className="text-red-500 flex items-center gap-2">
            {getStatusIcon('REJECTED')}
            KYC Application Rejected
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-400 mb-4">
            Your KYC application was rejected. Please review the requirements and submit again.
          </p>
          <Button 
            onClick={() => setFormData({
              first_name: "",
              last_name: "",
              date_of_birth: "",
              nationality: "",
              country_of_residence: "",
              address_line_1: "",
              city: "",
              state_province: "",
              postal_code: "",
              country: "",
              phone_number: "",
              id_document_type: "",
              id_document_number: "",
              id_document_issuing_country: "",
              id_document_expiry_date: "",
            })}
            className="bg-red-600 hover:bg-red-700"
          >
            Submit New Application
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-black/50 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <FileText className="h-5 w-5 text-purple-400" />
          Identity Verification (KYC)
        </CardTitle>
        <p className="text-gray-400 text-sm">
          Complete KYC verification to withdraw funds and access all features
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name" className="text-white">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                required
                className="bg-black/50 border-purple-500/30 text-white"
              />
            </div>
            <div>
              <Label htmlFor="last_name" className="text-white">Last Name *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                required
                className="bg-black/50 border-purple-500/30 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date_of_birth" className="text-white">Date of Birth *</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                required
                className="bg-black/50 border-purple-500/30 text-white [&::-webkit-calendar-picker-indicator]:filter-invert"
                style={{
                  colorScheme: 'dark'
                }}
              />
            </div>
            <div>
              <Label htmlFor="nationality" className="text-white">Nationality *</Label>
              <Input
                id="nationality"
                value={formData.nationality}
                onChange={(e) => setFormData(prev => ({ ...prev, nationality: e.target.value }))}
                required
                className="bg-black/50 border-purple-500/30 text-white"
                placeholder="e.g., American, British, German"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="country_of_residence" className="text-white">Country of Residence *</Label>
              <Input
                id="country_of_residence"
                value={formData.country_of_residence}
                onChange={(e) => setFormData(prev => ({ ...prev, country_of_residence: e.target.value }))}
                required
                className="bg-black/50 border-purple-500/30 text-white"
                placeholder="e.g., United States, Germany, Japan"
              />
            </div>
            <div>
              <Label htmlFor="phone_number" className="text-white">Phone Number *</Label>
              <Input
                id="phone_number"
                value={formData.phone_number}
                onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                required
                className="bg-black/50 border-purple-500/30 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="id_document_type" className="text-white">Document Type *</Label>
              <select
                id="id_document_type"
                value={formData.id_document_type}
                onChange={(e) => setFormData(prev => ({ ...prev, id_document_type: e.target.value }))}
                required
                className="w-full px-3 py-2 bg-black/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="">Select document type</option>
                <option value="PASSPORT">Passport</option>
                <option value="NATIONAL_ID">National ID</option>
                <option value="DRIVERS_LICENSE">Driver's License</option>
                <option value="RESIDENCE_PERMIT">Residence Permit</option>
              </select>
            </div>
            <div>
              <Label htmlFor="id_document_number" className="text-white">Document Number *</Label>
              <Input
                id="id_document_number"
                value={formData.id_document_number}
                onChange={(e) => setFormData(prev => ({ ...prev, id_document_number: e.target.value }))}
                required
                className="bg-black/50 border-purple-500/30 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="id_document_issuing_country" className="text-white">Issuing Country *</Label>
              <Input
                id="id_document_issuing_country"
                value={formData.id_document_issuing_country}
                onChange={(e) => setFormData(prev => ({ ...prev, id_document_issuing_country: e.target.value }))}
                required
                className="bg-black/50 border-purple-500/30 text-white"
              />
            </div>
            <div>
              <Label htmlFor="id_document_expiry_date" className="text-white">Expiry Date *</Label>
              <Input
                id="id_document_expiry_date"
                type="date"
                value={formData.id_document_expiry_date}
                onChange={(e) => setFormData(prev => ({ ...prev, id_document_expiry_date: e.target.value }))}
                required
                className="bg-black/50 border-purple-500/30 text-white [&::-webkit-calendar-picker-indicator]:filter-invert"
                style={{
                  colorScheme: 'dark'
                }}
              />
            </div>
          </div>



          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Address Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="address_line_1" className="text-white">Address Line 1 *</Label>
                <Input
                  id="address_line_1"
                  value={formData.address_line_1}
                  onChange={(e) => setFormData(prev => ({ ...prev, address_line_1: e.target.value }))}
                  required
                  className="bg-black/50 border-purple-500/30 text-white"
                />
              </div>
              <div>
                <Label htmlFor="city" className="text-white">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  required
                  className="bg-black/50 border-purple-500/30 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="state_province" className="text-white">State/Province *</Label>
                <Input
                  id="state_province"
                  value={formData.state_province}
                  onChange={(e) => setFormData(prev => ({ ...prev, state_province: e.target.value }))}
                  required
                  className="bg-black/50 border-purple-500/30 text-white"
                />
              </div>
              <div>
                <Label htmlFor="postal_code" className="text-white">Postal Code *</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
                  required
                  className="bg-black/50 border-purple-500/30 text-white"
                />
              </div>
              <div>
                <Label htmlFor="country" className="text-white">Country *</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                  required
                  className="bg-black/50 border-purple-500/30 text-white"
                />
              </div>
            </div>
          </div>

          {/* Document Upload */}
          <div className="space-y-4">
            <h3 className="text-white font-medium">Document Upload</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Document Front */}
              <div>
                <Label className="text-white">Document Front *</Label>
                <div className="mt-2">
                  <input
                    ref={fileInputs.document_front}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange('document_front', e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputs.document_front.current?.click()}
                    className="w-full bg-black/50 border-purple-500/30 text-white hover:bg-purple-500/20"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {files.document_front ? 'File Selected' : 'Upload Front'}
                  </Button>
                </div>
              </div>

              {/* Document Back */}
              <div>
                <Label className="text-white">Document Back</Label>
                <div className="mt-2">
                  <input
                    ref={fileInputs.document_back}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange('document_back', e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputs.document_back.current?.click()}
                    className="w-full bg-black/50 border-purple-500/30 text-white hover:bg-purple-500/20"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {files.document_back ? 'File Selected' : 'Upload Back'}
                  </Button>
                </div>
              </div>

              {/* Selfie */}
              <div>
                <Label className="text-white">Selfie with Document *</Label>
                <div className="mt-2">
                  <input
                    ref={fileInputs.selfie_with_document}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange('selfie_with_document', e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputs.selfie_with_document.current?.click()}
                    className="w-full bg-black/50 border-purple-500/30 text-white hover:bg-purple-500/20"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    {files.selfie_with_document ? 'File Selected' : 'Upload Selfie'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-cyan-600 hover:from-purple-600 hover:to-cyan-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit KYC Application'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
