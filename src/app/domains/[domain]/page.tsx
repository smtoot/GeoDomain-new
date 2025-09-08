"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { trpc } from "@/lib/trpc"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft, 
  MapPin, 
  Building, 
  Globe, 
  Calendar,
  Eye,
  MessageCircle,
  CheckCircle,
  Clock,
  AlertCircle,
  Star,
  TrendingUp,
  Users,
  Tag
} from "lucide-react"
import { formatPrice, formatDate, formatDateOnly } from "@/lib/utils"
import { getCategoryById, getGeographicScopeByValue } from "@/lib/categories"
import { MainLayout } from "@/components/layout/main-layout"

export default function DomainDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()

  const domainName = params.domain as string

  // Use a custom query to get domain by name instead of ID
  const { data: domainResponse, isLoading, error } = trpc.domains.getByName.useQuery(
    { name: domainName },
    {
      enabled: !!domainName,
    }
  )

  // Extract domain data from tRPC response
  const domain = domainResponse?.data?.data || domainResponse?.data || domainResponse

  // Debug logging
  console.log('🔍 [DOMAIN DETAILS] Domain Name:', domainName);
  console.log('🔍 [DOMAIN DETAILS] Domain Response:', domainResponse);
  console.log('🔍 [DOMAIN DETAILS] Domain Data:', domain);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <div className="h-96 bg-gray-200 rounded-lg mb-6"></div>
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
                <div>
                  <div className="h-64 bg-gray-200 rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error || !domain) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Domain Not Found</h1>
              <p className="text-gray-600 mb-6">
                The domain "{domainName}" could not be found or may have been removed.
              </p>
              <Button onClick={() => router.push('/domains')} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Domains
              </Button>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  const handleInquiry = () => {
    if (!session) {
      router.push('/login?redirect=/domains/' + encodeURIComponent(domainName) + '/inquiry')
      return
    }
    router.push('/domains/' + encodeURIComponent(domainName) + '/inquiry')
  }

  const handleEdit = () => {
    if (!session || session.user.id !== domain.sellerId) {
      return
    }
    router.push('/domains/' + encodeURIComponent(domainName) + '/edit')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return <CheckCircle className="h-4 w-4" />
      case 'PENDING':
        return <Clock className="h-4 w-4" />
      case 'REJECTED':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getPriceTypeColor = (priceType: string) => {
    switch (priceType) {
      case 'FIXED':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'NEGOTIABLE':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'MAKE_OFFER':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Button 
              onClick={() => router.push('/domains')} 
              variant="ghost" 
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Domains
            </Button>
            
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {domain.name}
                </h1>
                <div className="flex items-center gap-4 mb-4">
                  <Badge className={`${getStatusColor(domain.status)} border`}>
                    {getStatusIcon(domain.status)}
                    <span className="ml-1">{domain.status}</span>
                  </Badge>
                  <Badge className={`${getPriceTypeColor(domain.priceType)} border`}>
                    {domain.priceType.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
              
              <div className="flex gap-3">
                {session && session.user.id === domain.sellerId && (
                  <Button onClick={handleEdit} variant="outline">
                    Edit Domain
                  </Button>
                )}
                <Button onClick={handleInquiry} className="bg-blue-600 hover:bg-blue-700">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Make Inquiry
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Domain Image/Preview */}
              <Card>
                <CardContent className="p-6">
                  <div className="aspect-video bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Globe className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {domain.name}
                      </h3>
                      <p className="text-gray-600">
                        Premium domain available for purchase
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    About This Domain
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">
                    {domain.description}
                  </p>
                </CardContent>
              </Card>

              {/* Domain Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Domain Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Domain Name</label>
                      <p className="text-gray-900 font-mono">{domain.name}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Category</label>
                      <p className="text-gray-900">
                        {domain.category?.name || domain.category || 'Uncategorized'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Geographic Scope</label>
                      <p className="text-gray-900">
                        {getGeographicScopeByValue(domain.geographicScope)?.label || domain.geographicScope}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Location</label>
                      <p className="text-gray-900 flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {domain.city?.name || domain.city ? 
                          `${domain.city?.name || domain.city}, ${domain.state?.name || domain.state}` :
                          domain.state?.name || domain.state || 
                          'National'
                        }
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Listed Date</label>
                      <p className="text-gray-900 flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDateOnly(domain.createdAt)}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Last Updated</label>
                      <p className="text-gray-900 flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDateOnly(domain.updatedAt)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Price Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Pricing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      {formatPrice(domain.price)}
                    </div>
                    <Badge className={`${getPriceTypeColor(domain.priceType)} border mb-4`}>
                      {domain.priceType.replace('_', ' ')}
                    </Badge>
                    <Button 
                      onClick={handleInquiry} 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      size="lg"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Make Inquiry
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Views</span>
                    <span className="font-semibold">0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Inquiries</span>
                    <span className="font-semibold">{domain.inquiryCount || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Status</span>
                    <Badge className={`${getStatusColor(domain.status)} border`}>
                      {getStatusIcon(domain.status)}
                      <span className="ml-1">{domain.status}</span>
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Seller Info */}
              {domain.seller && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Seller Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900">
                        {domain.seller.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Verified Seller
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
