"use client"

import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { trpc } from "@/lib/trpc"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Header } from "@/components/layout/header"
import { QueryErrorBoundary } from "@/components/error"

export default function DomainDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()

  const domainId = params.domain as string

  // Mock domain data that matches the domains page
  const mockDomains = [
    {
      id: 1,
      name: "techstartup.com",
      price: 2500,
      priceType: "FIXED",
      category: "technology",
      state: "california",
      city: "los-angeles",
      geographicScope: "CITY",
      status: "VERIFIED",
      description: "Perfect for tech startups and innovation companies",
      createdAt: "2024-01-15T10:30:00Z",
      updatedAt: "2024-01-15T10:30:00Z",
      inquiryCount: 5,
      ownerId: "mock-owner-1",
      owner: {
        id: "mock-owner-1",
        name: "John Smith",
        email: "john@example.com",
        company: "Tech Ventures LLC"
      }
    },
    {
      id: 2,
      name: "businesshub.com",
      price: 1800,
      priceType: "NEGOTIABLE",
      category: "business",
      state: "new-york",
      city: "new-york-city",
      geographicScope: "CITY",
      status: "VERIFIED",
      description: "Ideal for business consulting and corporate services",
      createdAt: "2024-01-20T14:45:00Z",
      updatedAt: "2024-01-20T14:45:00Z",
      inquiryCount: 3,
      ownerId: "mock-owner-2",
      owner: {
        id: "mock-owner-2",
        name: "Sarah Johnson",
        email: "sarah@example.com",
        company: "Business Solutions Inc"
      }
    },
    {
      id: 3,
      name: "realestatepro.com",
      price: 3200,
      priceType: "MAKE_OFFER",
      category: "real-estate",
      state: "florida",
      city: "miami",
      geographicScope: "CITY",
      status: "VERIFIED",
      description: "Great for real estate professionals and agencies",
      createdAt: "2024-01-25T09:15:00Z",
      updatedAt: "2024-01-25T09:15:00Z",
      inquiryCount: 8,
      ownerId: "mock-owner-3",
      owner: {
        id: "mock-owner-3",
        name: "Mike Rodriguez",
        email: "mike@example.com",
        company: "Miami Real Estate Group"
      }
    },
    {
      id: 4,
      name: "texasrestaurants.com",
      price: 4200,
      priceType: "FIXED",
      category: "restaurants",
      state: "texas",
      city: "houston",
      geographicScope: "STATE",
      status: "VERIFIED",
      description: "Premium domain for Texas restaurant chains and food services",
      createdAt: "2024-01-10T08:20:00Z",
      updatedAt: "2024-01-10T08:20:00Z",
      inquiryCount: 12,
      ownerId: "mock-owner-4",
      owner: {
        id: "mock-owner-4",
        name: "Lisa Chen",
        email: "lisa@example.com",
        company: "Texas Food Group"
      }
    },
    {
      id: 5,
      name: "miamitravel.com",
      price: 2800,
      priceType: "NEGOTIABLE",
      category: "travel",
      state: "florida",
      city: "miami",
      geographicScope: "CITY",
      status: "VERIFIED",
      description: "Perfect for Miami-based travel agencies and tourism businesses",
      createdAt: "2024-01-28T16:10:00Z",
      updatedAt: "2024-01-28T16:10:00Z",
      inquiryCount: 7,
      ownerId: "mock-owner-5",
      owner: {
        id: "mock-owner-5",
        name: "Carlos Martinez",
        email: "carlos@example.com",
        company: "Miami Travel Services"
      }
    },
    {
      id: 6,
      name: "atlantamarketing.com",
      price: 3500,
      priceType: "FIXED",
      category: "marketing",
      state: "georgia",
      city: "atlanta",
      geographicScope: "CITY",
      status: "VERIFIED",
      description: "Premium domain for Atlanta-based marketing agencies and digital marketing services. Perfect for local businesses looking to establish a strong online presence in the Atlanta market.",
      createdAt: "2024-01-30T11:45:00Z",
      updatedAt: "2024-01-30T11:45:00Z",
      inquiryCount: 9,
      ownerId: "mock-owner-6",
      owner: {
        id: "mock-owner-6",
        name: "Jennifer Williams",
        email: "jennifer@example.com",
        company: "Atlanta Marketing Solutions"
      }
    }
  ];

  // Always fetch domain data from API using ID
  const { data: domainResponse, isLoading, error } = trpc.domains.getById.useQuery(
    { id: domainId },
    {
      enabled: !!domainId,
    }
  )

  // Extract domain data from tRPC response
  const domain = domainResponse?.data?.data || domainResponse?.data || domainResponse

  // Debug logging
  console.log('🔍 [DOMAIN DETAILS] Domain ID:', domainId);
  console.log('🔍 [DOMAIN DETAILS] Domain Response:', domainResponse);
  console.log('🔍 [DOMAIN DETAILS] Loading State:', isLoading);
  console.log('🔍 [DOMAIN DETAILS] Error State:', error);
  console.log('🔍 [DOMAIN DETAILS] Final Domain Data:', domain);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50">
        <Header />
        <div className="py-8">
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
      </div>
    )
  }

  if (error || (!domain && !isLoading)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50">
        <Header />
        <div className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Domain Not Found</h1>
              <p className="text-gray-600 mb-6">
                The domain could not be found or may have been removed.
              </p>
              <Button onClick={() => router.push('/domains')} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Domains
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleInquiry = () => {
    if (!session) {
      router.push('/login?redirect=/domains/' + encodeURIComponent(domainId) + '/inquiry')
      return
    }
    router.push('/domains/' + encodeURIComponent(domainId) + '/inquiry')
  }

  const handleEdit = () => {
    if (!session || !domain || session.user.id !== domain.ownerId) {
      return
    }
    router.push('/domains/' + encodeURIComponent(domainId) + '/edit')
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

  // Safety check - ensure domain data is available
  if (!domain) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50">
        <Header />
        <div className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Domain Not Found</h1>
              <p className="text-gray-600 mb-6">
                The domain could not be found or may have been removed.
              </p>
              <Button onClick={() => router.push('/domains')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Domains
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <QueryErrorBoundary context="Domain Details Page">
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50">
        <Header />
        <div className="py-8">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
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
                    {domain.priceType?.replace('_', ' ') || domain.priceType || 'Unknown'}
                  </Badge>
                </div>
              </div>
              
              <div className="flex gap-3">
                {session && session.user.id === domain.ownerId && (
                  <Button onClick={handleEdit} variant="outline">
                    Edit Domain
                  </Button>
                )}
                <Button onClick={handleInquiry} className="bg-red-600 hover:bg-red-700">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Make Inquiry
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="xl:col-span-3 space-y-6">
              {/* Domain Image/Preview */}
              <Card className="border-2 border-red-200">
                <CardContent className="p-8">
                  <div className="aspect-[16/6] bg-gradient-to-br from-red-50 to-blue-50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Globe className="h-20 w-20 text-red-500 mx-auto mb-6" />
                      <h3 className="text-3xl font-bold text-gray-900 mb-3">
                        {domain.name}
                      </h3>
                      <p className="text-lg text-gray-600">
                        Premium domain available for purchase
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              <Card className="border-2 border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-red-600" />
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
              <Card className="border-2 border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5 text-red-600" />
                    Domain Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <Card className="border-2 border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-red-600" />
                    Pricing
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900 mb-3">
                      {formatPrice(domain.price)}
                    </div>
                    <Badge className={`${getPriceTypeColor(domain.priceType)} border mb-6`}>
                      {domain.priceType?.replace('_', ' ') || domain.priceType || 'Unknown'}
                    </Badge>
                    <Button 
                      onClick={handleInquiry} 
                      className="w-full bg-red-600 hover:bg-red-700"
                      size="lg"
                    >
                      <MessageCircle className="h-5 w-5 mr-2" />
                      Make Inquiry
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Stats */}
              <Card className="border-2 border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-red-600" />
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

              {/* Owner Info */}
              {domain.owner && (
                <Card className="border-2 border-red-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-red-600" />
                      Seller Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Users className="h-6 w-6 text-red-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900">
                        {domain.owner.name}
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
      </div>
    </QueryErrorBoundary>
  )
}
