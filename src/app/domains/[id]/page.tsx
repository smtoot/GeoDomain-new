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

  const domainId = params.id as string

  const { data: domainResponse, isLoading, error } = trpc.domains.getById.useQuery(
    { id: domainId },
    {
      enabled: !!domainId,
    }
  )

  const domain = domainResponse?.json?.data || domainResponse?.data

  const categoryData = domain?.category ? getCategoryById(domain.category) : null
  const geographicScopeData = domain?.geographicScope ? getGeographicScopeByValue(domain.geographicScope) : null

  const getGeographicDisplay = () => {
    if (!domain) return { text: "", icon: "", scope: "", description: "" }
    
    switch (domain.geographicScope) {
      case "NATIONAL":
        return { 
          text: "National (USA)", 
          icon: "🇺🇸", 
          scope: "Targets the entire United States",
          description: "This domain is designed to serve customers across all 50 states"
        }
      case "STATE":
        return { 
          text: domain.state || "State", 
          icon: "🏛️", 
          scope: `Targets ${domain.state}`,
          description: `This domain is specifically designed for businesses in ${domain.state}`
        }
      case "CITY":
        return { 
          text: `${domain.city}, ${domain.state}`, 
          icon: "🏙️", 
          scope: `Targets ${domain.city}, ${domain.state}`,
          description: `This domain is perfect for local businesses in ${domain.city}, ${domain.state}`
        }
      default:
        return { text: "Unknown", icon: "❓", scope: "Unknown scope", description: "" }
    }
  }

  const geographicDisplay = getGeographicDisplay()

  const getStatusInfo = () => {
    if (!domain) return { color: "gray", icon: Clock, text: "Unknown" }
    
    switch (domain.status) {
      case "VERIFIED":
        return { color: "green", icon: CheckCircle, text: "Verified & Active" }

      case "PENDING_VERIFICATION":
        return { color: "yellow", icon: Clock, text: "Pending Verification" }
      case "DRAFT":
        return { color: "gray", icon: Clock, text: "Draft" }
      case "PAUSED":
        return { color: "orange", icon: AlertCircle, text: "Paused" }

      default:
        return { color: "gray", icon: Clock, text: domain.status }
    }
  }

  const statusInfo = getStatusInfo()

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !domain) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Domain Not Found</h1>
          <p className="text-gray-600 mb-4">The domain you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Button onClick={() => router.push("/domains")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Domains
          </Button>
        </div>
      </div>
    )
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/domains")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Domains
        </Button>
        
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{domain.name}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Listed {formatDateOnly(domain.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{domain.analytics && Array.isArray(domain.analytics) && domain.analytics.length > 0 ? domain.analytics[0]?.views || 0 : 0} views</span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {formatPrice(domain.price)}
            </div>
            <Badge variant="outline">{domain.priceType}</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Domain Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Domain Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {domain.description && (
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-gray-700 leading-relaxed">{domain.description}</p>
                </div>
              )}

              <Separator />

              {/* Geographic Information */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Geographic Targeting
                </h3>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{geographicDisplay.icon}</span>
                    <div>
                      <div className="font-semibold text-blue-900">{geographicDisplay.text}</div>
                      <div className="text-sm text-blue-700">{geographicDisplay.scope}</div>
                    </div>
                    <Badge variant="outline" className="ml-auto">
                      {geographicScopeData?.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-blue-600">{geographicDisplay.description}</p>
                </div>
              </div>

              <Separator />

              {/* Category Information */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Business Classification
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{domain.category}</Badge>
                    <span className="text-sm text-gray-600">Category</span>
                  </div>
                  
                  {categoryData && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="default">{categoryData.name}</Badge>
                        <span className="text-sm text-green-700">Specific Category</span>
                      </div>
                      <p className="text-sm text-green-600">{categoryData.description}</p>
                      {categoryData.examples.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-green-600 mb-1">Similar domains:</p>
                          <div className="flex flex-wrap gap-1">
                            {categoryData.examples.slice(0, 3).map((example, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {example}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              {domain.tags && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        try {
                          const tags = typeof domain.tags === 'string' ? JSON.parse(domain.tags) : domain.tags;
                          return Array.isArray(tags) ? tags.map((tag: string, index: number) => (
                            <Badge key={index} variant="outline">
                              {tag}
                            </Badge>
                          )) : null;
                        } catch (error) {
                          console.error('Error parsing tags:', error);
                          return null;
                        }
                      })()}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Domain Analytics */}
          {domain.analytics && Array.isArray(domain.analytics) && domain.analytics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {domain.analytics.reduce((sum: number, day: any) => sum + (day.views || 0), 0)}
                    </div>
                    <div className="text-sm text-gray-600">Total Views</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {domain.analytics.reduce((sum: number, day: any) => sum + (day.inquiries || 0), 0)}
                    </div>
                    <div className="text-sm text-gray-600">Total Inquiries</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {domain.analytics.length}
                    </div>
                    <div className="text-sm text-gray-600">Days Tracked</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {Math.round(domain.analytics.reduce((sum: number, day: any) => sum + (day.views || 0), 0) / domain.analytics.length)}
                    </div>
                    <div className="text-sm text-gray-600">Avg Views/Day</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Status & Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <statusInfo.icon className={`h-4 w-4 text-${statusInfo.color}-600`} />
                <Badge variant={statusInfo.color === "green" ? "default" : "outline"}>
                  {statusInfo.text}
                </Badge>
              </div>

              {session?.user && (
                <div className="space-y-2">
                  <Button 
                    onClick={() => router.push(`/domains/${domain.id}/inquiry`)}
                    className="w-full"
                    size="lg"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Send Inquiry
                  </Button>
                </div>
              )}

              {!session?.user && (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-3">
                    Sign in to contact the seller
                  </p>
                  <Button 
                    onClick={() => router.push("/login")}
                    className="w-full"
                  >
                    Sign In
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seller Information */}
          {domain.owner && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Seller Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="font-semibold">{domain.owner.name}</div>
                  <div className="text-sm text-gray-600">{domain.owner.email}</div>
                </div>
                
                {domain.owner.company && (
                  <div className="text-sm text-gray-600">
                    Company: {domain.owner.company}
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>Verified Seller</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Domain Details */}
          <Card>
            <CardHeader>
              <CardTitle>Domain Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Registrar:</span>
                <span className="font-medium">{domain.registrar || "Unknown"}</span>
              </div>
              
              {domain.expirationDate && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Expires:</span>
                  <span className="font-medium">{formatDateOnly(domain.expirationDate)}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-600">Listed:</span>
                <span className="font-medium">{formatDateOnly(domain.createdAt)}</span>
              </div>
              
              {domain.publishedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Published:</span>
                  <span className="font-medium">{formatDateOnly(domain.publishedAt)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SEO Information */}
          {(domain.metaTitle || domain.metaDescription) && (
            <Card>
              <CardHeader>
                <CardTitle>SEO Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {domain.metaTitle && (
                  <div>
                    <div className="text-sm font-medium text-gray-600 mb-1">Meta Title</div>
                    <div className="text-sm">{domain.metaTitle}</div>
                  </div>
                )}
                
                {domain.metaDescription && (
                  <div>
                    <div className="text-sm font-medium text-gray-600 mb-1">Meta Description</div>
                    <div className="text-sm">{domain.metaDescription}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      </div>
    </MainLayout>
  )
}
