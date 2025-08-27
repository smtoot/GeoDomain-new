import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Building, DollarSign, Eye, MessageCircle } from "lucide-react"
import { formatPrice } from "@/lib/utils"
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
  }
  onView: (domainId: string) => void
  onInquiry: (domainId: string) => void
  variant?: "default" | "compact" | "detailed"
}

export function DomainCard({ 
  domain, 
  onView, 
  onInquiry, 
  variant = "default" 
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

  if (variant === "compact") {
    return (
      <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer" onClick={() => onView(domain.id)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-primary truncate">{domain.name}</h3>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
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
              <div className="font-bold text-lg">{formatPrice(domain.price)}</div>
              <Badge variant="outline" className="text-xs">
                {domain.priceType}
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
              <CardTitle className="text-xl font-bold text-primary truncate mb-2">
                {domain.name}
              </CardTitle>
              
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

              {/* Industry */}
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{domain.category}</Badge>
                <Badge variant={domain.status === 'VERIFIED' ? 'default' : 'outline'}>
                  {domain.status}
                </Badge>
              </div>
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
              <Badge variant="outline" className="text-xs">
                {domain.priceType}
              </Badge>
            </div>
            
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
          </div>

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
            <CardTitle className="text-lg font-semibold text-primary truncate mb-2">
              {domain.name}
            </CardTitle>
            
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

            {/* Industry and Status */}
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">{domain.category}</Badge>
              <Badge variant={domain.status === 'VERIFIED' ? 'default' : 'outline'} className="text-xs">
                {domain.status}
              </Badge>
            </div>
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
        {/* Price */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="text-xl font-bold text-green-600">
              {formatPrice(domain.price)}
            </span>
            <Badge variant="outline" className="text-xs">
              {domain.priceType}
            </Badge>
          </div>
          
          {/* Stats */}
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
        </div>

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
