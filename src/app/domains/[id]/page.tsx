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

export default function DomainDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()

  const domainId = params.id as string

  const { data: domain, isLoading, error } = trpc.domains.getById.useQuery(
    { id: domainId },
    {
      enabled: !!domainId,
    }
  )

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
      case "PUBLISHED":
        return { color: "blue", icon: CheckCircle, text: "Published" }
      case "PENDING_VERIFICATION":
        return { color: "yellow", icon: Clock, text: "Pending Verification" }
      case "DRAFT":
        return { color: "gray", icon: Clock, text: "Draft" }
      case "PAUSED":
        return { color: "orange", icon: AlertCircle, text: "Paused" }
      case "SOLD":
        return { color: "red", icon: CheckCircle, text: "Sold" }
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

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-2xl font-bold text-blue-400 mb-4">GeoDomainLand</h3>
              <p className="text-gray-300 mb-4">
                The premier marketplace for premium domain names. Connect with buyers and sellers 
                in a secure, moderated environment.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="/domains" className="text-gray-300 hover:text-white transition-colors">Browse Domains</a></li>
                <li><a href="/search" className="text-gray-300 hover:text-white transition-colors">Search</a></li>
                <li><a href="/login" className="text-gray-300 hover:text-white transition-colors">Login</a></li>
                <li><a href="/register" className="text-gray-300 hover:text-white transition-colors">Register</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                © 2024 GeoDomainLand. All rights reserved.
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy</a>
                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Terms</a>
                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Cookies</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
