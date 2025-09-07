import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Building, DollarSign, Eye, MessageCircle, Star, Clock, Shield, TrendingUp, Calendar } from "lucide-react"
import { formatPrice, formatDateOnly } from "@/lib/utils"
import { getCategoryById, getGeographicScopeByValue } from "@/lib/categories"

interface DomainCardProps {
  domain: {
    id: string
    name: string
    price: number
    priceType: string
    category: string
    geographicScope: string
    state?: string
    city?: string
    description?: string
    status: string
    logoUrl?: string
    inquiryCount?: number
    viewCount?: number
    createdAt?: string | Date
    publishedAt?: string | Date
    registrar?: string
    expirationDate?: string | Date
    tags?: string[]
    metaTitle?: string
    metaDescription?: string
    owner?: {
      id: string
      name: string
      company?: string
    }
  }
  onView: (domainId: string) => void
  onInquiry: (domainId: string) => void
  variant?: "default" | "compact" | "detailed"
  showStats?: boolean
  showOwner?: boolean
  showTechnical?: boolean
}

export function DomainCard({ 
  domain, 
  onView, 
  onInquiry, 
  variant = "default",
  showStats = true,
  showOwner = false,
  showTechnical = false
}: DomainCardProps) {
  const categoryData = domain.category ? getCategoryById(domain.category) : null
  const geographicScopeData = getGeographicScopeByValue(domain.geographicScope)
  
  const getGeographicDisplay = () => {
    switch (domain.geographicScope) {
      case "NATIONAL":
        return { text: "National (USA)", icon: "🇺🇸" }
      case "STATE":
        return { text: domain.state || "State", icon: "🏛️" }
      case "CITY":
        return { text: `${domain.city}, ${domain.state}`, icon: "🏙️" }
      default:
        return { text: "Unknown", icon: "❓" }
    }
  }

  const geographicDisplay = getGeographicDisplay()

  const getStatusInfo = () => {
    switch (domain.status) {
      case "VERIFIED":
        return { color: "default", icon: Shield, text: "Verified", bgColor: "bg-green-50", textColor: "text-green-700" }
      case "PENDING_VERIFICATION":
        return { color: "secondary", icon: Clock, text: "Pending", bgColor: "bg-yellow-50", textColor: "text-yellow-700" }
      case "DRAFT":
        return { color: "outline", icon: Clock, text: "Draft", bgColor: "bg-gray-50", textColor: "text-gray-700" }
      case "PAUSED":
        return { color: "outline", icon: Clock, text: "Paused", bgColor: "bg-orange-50", textColor: "text-orange-700" }
      default:
        return { color: "outline", icon: Clock, text: domain.status, bgColor: "bg-gray-50", textColor: "text-gray-700" }
    }
  }

  const getPriceTypeInfo = () => {
    switch (domain.priceType) {
      case "FIXED":
        return { color: "default", text: "Fixed Price", icon: DollarSign }
      case "NEGOTIABLE":
        return { color: "secondary", text: "Negotiable", icon: TrendingUp }
      case "MAKE_OFFER":
        return { color: "outline", text: "Make Offer", icon: MessageCircle }
      default:
        return { color: "outline", text: domain.priceType, icon: DollarSign }
    }
  }

  const statusInfo = getStatusInfo()
  const priceTypeInfo = getPriceTypeInfo()

  if (variant === "compact") {
    return (
      <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer" onClick={() => onView(domain.id)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg text-primary truncate">{domain.name}</h3>
                <Badge variant={statusInfo.color} className="text-xs">
                  <statusInfo.icon className="h-3 w-3 mr-1" />
                  {statusInfo.text}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{geographicDisplay.text}</span>
                {categoryData && (
                  <>
                    <Building className="h-3 w-3 ml-2" />
                    <span>{categoryData.name}</span>
                  </>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-lg text-green-600">{formatPrice(domain.price)}</div>
              <Badge variant={priceTypeInfo.color} className="text-xs">
                <priceTypeInfo.icon className="h-3 w-3 mr-1" />
                {priceTypeInfo.text}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (variant === "detailed") {
    return (
      <Card className="group hover:shadow-lg transition-all duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-xl font-bold text-primary truncate">
                  {domain.name}
                </CardTitle>
                <Badge variant={statusInfo.color} className="text-xs">
                  <statusInfo.icon className="h-3 w-3 mr-1" />
                  {statusInfo.text}
                </Badge>
              </div>
              
              {/* Geographic and Category Info */}
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <span className="text-lg">{geographicDisplay.icon}</span>
                  <span>{geographicDisplay.text}</span>
                  <Badge variant="outline" className="ml-1 text-xs">
                    {geographicScopeData?.label}
                  </Badge>
                </div>
                
                {categoryData && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Building className="h-4 w-4" />
                    <span>{categoryData.name}</span>
                  </div>
                )}
              </div>

              {/* Tags */}
              {domain.tags && domain.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {domain.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {domain.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{domain.tags.length - 3} more
                    </Badge>
                  )}
                </div>
              )}
            </div>
            
            {domain.logoUrl && (
              <img
                src={domain.logoUrl}
                alt={`${domain.name} logo`}
                className="w-16 h-16 rounded-lg object-cover ml-4"
              />
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {/* Description */}
          {domain.description && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {domain.description}
            </p>
          )}

          {/* Price and Stats */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-2xl font-bold text-green-600">
                {formatPrice(domain.price)}
              </span>
              <Badge variant={priceTypeInfo.color} className="text-xs">
                <priceTypeInfo.icon className="h-3 w-3 mr-1" />
                {priceTypeInfo.text}
              </Badge>
            </div>
            
            {showStats && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {domain.viewCount !== undefined && (
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>{domain.viewCount}</span>
                  </div>
                )}
                {domain.inquiryCount !== undefined && (
                  <div className="flex items-center gap-1">
                    <MessageCircle className="h-4 w-4" />
                    <span>{domain.inquiryCount}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Technical Info */}
          {showTechnical && (
            <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
              {domain.registrar && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Registrar:</span>
                  <div className="font-medium">{domain.registrar}</div>
                </div>
              )}
              {domain.expirationDate && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Expires:</span>
                  <div className="font-medium">{formatDateOnly(domain.expirationDate)}</div>
                </div>
              )}
              {domain.createdAt && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Listed:</span>
                  <div className="font-medium">{formatDateOnly(domain.createdAt)}</div>
                </div>
              )}
            </div>
          )}

          {/* Owner Info */}
          {showOwner && domain.owner && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm">
                <span className="text-muted-foreground">Seller:</span>
                <div className="font-medium">{domain.owner.name}</div>
                {domain.owner.company && (
                  <div className="text-xs text-muted-foreground">{domain.owner.company}</div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={() => onView(domain.id)}
              variant="outline"
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
            <Button
              onClick={() => onInquiry(domain.id)}
              className="flex-1"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Contact Seller
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Default variant
  return (
    <Card className="group hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg font-semibold text-primary truncate">
                {domain.name}
              </CardTitle>
              <Badge variant={statusInfo.color} className="text-xs">
                <statusInfo.icon className="h-3 w-3 mr-1" />
                {statusInfo.text}
              </Badge>
            </div>
            
            {/* Geographic and Category Info */}
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <span className="text-base">{geographicDisplay.icon}</span>
                <span>{geographicDisplay.text}</span>
              </div>
              
              {categoryData && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Building className="h-3 w-3" />
                  <span>{categoryData.name}</span>
                </div>
              )}
            </div>

            {/* Tags */}
            {domain.tags && domain.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {domain.tags.slice(0, 2).map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {domain.tags.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{domain.tags.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>
          
          {domain.logoUrl && (
            <img
              src={domain.logoUrl}
              alt={`${domain.name} logo`}
              className="w-12 h-12 rounded-lg object-cover ml-3"
            />
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Description */}
        {domain.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {domain.description}
          </p>
        )}

        {/* Price */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="text-xl font-bold text-green-600">
              {formatPrice(domain.price)}
            </span>
            <Badge variant={priceTypeInfo.color} className="text-xs">
              <priceTypeInfo.icon className="h-3 w-3 mr-1" />
              {priceTypeInfo.text}
            </Badge>
          </div>
          
          {/* Stats */}
          {showStats && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {domain.viewCount !== undefined && (
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  <span>{domain.viewCount}</span>
                </div>
              )}
              {domain.inquiryCount !== undefined && (
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" />
                  <span>{domain.inquiryCount}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Technical Info (condensed) */}
        {showTechnical && (domain.registrar || domain.expirationDate) && (
          <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
            {domain.registrar && (
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                <span>{domain.registrar}</span>
              </div>
            )}
            {domain.expirationDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Expires {formatDateOnly(domain.expirationDate)}</span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={() => onView(domain.id)}
            variant="outline"
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
          <Button
            onClick={() => onInquiry(domain.id)}
            className="flex-1"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Contact Seller
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
