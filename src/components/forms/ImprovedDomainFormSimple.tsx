"use client"

import React, { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { trpc } from "@/lib/trpc"
import { 
  Globe, 
  ChevronRight, 
  ChevronLeft, 
  DollarSign, 
  MapPin, 
  Tag, 
  Info,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  TrendingUp
} from "lucide-react"

interface ImprovedDomainFormSimpleProps {
  onSubmit: (data: any) => void
  isLoading?: boolean
  mode?: "create" | "edit"
}

export function ImprovedDomainFormSimple({ 
  onSubmit, 
  isLoading = false, 
  mode = "create" 
}: ImprovedDomainFormSimpleProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    priceType: "FIXED" as "FIXED" | "NEGOTIABLE" | "MAKE_OFFER",
    geographicScope: "STATE" as "NATIONAL" | "STATE" | "CITY",
    state: "",
    city: "",
    category: "",
    description: ""
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [suggestions, setSuggestions] = useState<Record<string, string[]>>({})
  const [selectedStateId, setSelectedStateId] = useState<string>("")

  // Fetch form options from the database
  const { data: formOptionsData, isLoading: isLoadingFormOptions } = trpc.domains.getFormOptions.useQuery(undefined, {
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })
  const { data: citiesData, isLoading: isLoadingCities } = trpc.domains.getCitiesByState.useQuery(
    { stateId: selectedStateId },
    { 
      enabled: !!selectedStateId,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    }
  )

  const formOptions = formOptionsData?.data || { categories: [], states: [] }
  const cities = citiesData?.data || []

  const steps = [
    { 
      id: "basic", 
      title: "Basic Information", 
      icon: Globe, 
      description: "Domain name and pricing details",
      fields: ["name", "price", "priceType"]
    },
    { 
      id: "geographic", 
      title: "Geographic Scope", 
      icon: MapPin, 
      description: "Target location and coverage area",
      fields: ["geographicScope", "state", "city"]
    },
    { 
      id: "details", 
      title: "Details & Description", 
      icon: Tag, 
      description: "Category and detailed description",
      fields: ["category", "description"]
    }
  ]

  // Smart suggestions based on domain name
  useEffect(() => {
    if (formData.name) {
      const domainName = formData.name.toLowerCase()
      const newSuggestions: Record<string, string[]> = {}
      
      // Category suggestions based on domain name
      if (domainName.includes('tech') || domainName.includes('app') || domainName.includes('dev')) {
        newSuggestions.category = ['Technology', 'Software', 'Development', 'Apps']
      } else if (domainName.includes('shop') || domainName.includes('store') || domainName.includes('buy')) {
        newSuggestions.category = ['E-commerce', 'Retail', 'Shopping', 'Business']
      } else if (domainName.includes('news') || domainName.includes('blog') || domainName.includes('media')) {
        newSuggestions.category = ['Media', 'News', 'Blogging', 'Content']
      } else if (domainName.includes('health') || domainName.includes('medical') || domainName.includes('care')) {
        newSuggestions.category = ['Healthcare', 'Medical', 'Wellness', 'Fitness']
      } else {
        newSuggestions.category = ['Business', 'General', 'Professional', 'Corporate']
      }
      
      // Price suggestions based on domain length and type
      if (domainName.length <= 6) {
        newSuggestions.price = ['Premium short domain - consider $5,000+']
      } else if (domainName.length <= 10) {
        newSuggestions.price = ['Good length domain - consider $1,000-$5,000']
      } else {
        newSuggestions.price = ['Longer domain - consider $500-$2,000']
      }
      
      setSuggestions(newSuggestions)
    }
  }, [formData.name])

  // Form validation
  const validateStep = (stepIndex: number): boolean => {
    const step = steps[stepIndex]
    const newErrors: Record<string, string> = {}
    
    step.fields.forEach(field => {
      const value = formData[field as keyof typeof formData]
      
      if (field === 'name') {
        if (!value || (value as string).trim().length === 0) {
          newErrors.name = 'Domain name is required'
        } else if (!(value as string).includes('.')) {
          newErrors.name = 'Please enter a valid domain name (e.g., example.com)'
        }
      } else if (field === 'price') {
        if (!value || (value as number) <= 0) {
          newErrors.price = 'Price must be greater than $0'
        }
      } else if (field === 'state' && formData.geographicScope !== 'NATIONAL') {
        if (!value || (value as string).trim().length === 0) {
          newErrors.state = 'State is required for state/city scope'
        }
      } else if (field === 'city' && formData.geographicScope === 'CITY') {
        if (!value || (value as string).trim().length === 0) {
          newErrors.city = 'City is required for city scope'
        }
      } else if (field === 'category') {
        if (!value || (value as string).trim().length === 0) {
          newErrors.category = 'Category is required'
        }
      } else if (field === 'description') {
        if (!value || (value as string).trim().length === 0) {
          newErrors.description = 'Description is required'
        } else if ((value as string).trim().length < 10) {
          newErrors.description = 'Description must be at least 10 characters'
        }
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateStep(currentStep)) {
      onSubmit(formData)
    }
  }

  const goToNextStep = () => {
    if (validateStep(currentStep) && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const progressPercentage = ((currentStep + 1) / steps.length) * 100

  // Show loading state if form options are not loaded yet
  if (isLoadingFormOptions) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-8"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Enhanced Progress Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              {mode === "create" ? "Create Domain Listing" : "Edit Domain Listing"}
            </h2>
            <p className="text-gray-600 mt-1">
              {mode === "create" ? "List your domain for sale in just a few steps" : "Update your domain listing details"}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">
              Step {currentStep + 1} of {steps.length}
            </div>
            <div className="text-xs text-gray-500">
              {Math.round(progressPercentage)}% complete
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-gray-500">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-1">
                {index <= currentStep ? (
                  <CheckCircle className="h-3 w-3 text-green-600" />
                ) : (
                  <div className="h-3 w-3 rounded-full border-2 border-gray-300" />
                )}
                <span className={index <= currentStep ? "text-green-600 font-medium" : ""}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Current Step Content */}
        <Card className="border-2 border-gray-100 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-blue-100 rounded-lg">
                {React.createElement(steps[currentStep].icon, { className: "h-5 w-5 text-blue-600" })}
              </div>
              <div>
                <div>{steps[currentStep].title}</div>
                <CardDescription className="text-sm text-gray-600 mt-1">
                  {steps[currentStep].description}
                </CardDescription>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {currentStep === 0 && (
              <div className="space-y-6">
                {/* Domain Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Domain Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="example.com"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className={`h-12 text-lg ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                    required
                  />
                  {errors.name && (
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      {errors.name}
                    </div>
                  )}
                  {suggestions.price && (
                    <Alert className="border-blue-200 bg-blue-50">
                      <Lightbulb className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800">
                        {suggestions.price[0]}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Price */}
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Price (USD)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      id="price"
                      type="number"
                      placeholder="1000"
                      value={formData.price || ''}
                      onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                      className={`h-12 text-lg pl-8 ${errors.price ? 'border-red-500' : 'border-gray-300'}`}
                      required
                    />
                  </div>
                  {errors.price && (
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      {errors.price}
                    </div>
                  )}
                </div>

                {/* Price Type */}
                <div className="space-y-2">
                  <Label htmlFor="priceType" className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Price Type
                  </Label>
                  <Select
                    value={formData.priceType}
                    onValueChange={(value: "FIXED" | "NEGOTIABLE" | "MAKE_OFFER") => 
                      setFormData({...formData, priceType: value})
                    }
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIXED">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-green-600">Fixed</Badge>
                          <span>Set a fixed price</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="NEGOTIABLE">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-blue-600">Negotiable</Badge>
                          <span>Open to negotiations</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="MAKE_OFFER">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-orange-600">Make Offer</Badge>
                          <span>Accept offers only</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            
            {currentStep === 1 && (
              <div className="space-y-6">
                {/* Geographic Scope */}
                <div className="space-y-2">
                  <Label htmlFor="geographicScope" className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Geographic Scope
                  </Label>
                  <Select
                    value={formData.geographicScope}
                    onValueChange={(value: "NATIONAL" | "STATE" | "CITY") => 
                      setFormData({...formData, geographicScope: value})
                    }
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NATIONAL">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-blue-600">National</Badge>
                          <span>Available across the entire USA</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="STATE">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-green-600">State</Badge>
                          <span>Limited to a specific state</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="CITY">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-orange-600">City</Badge>
                          <span>Limited to a specific city</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* State (conditional) */}
                {formData.geographicScope !== "NATIONAL" && (
                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      State
                    </Label>
                    <Select
                      value={formData.state}
                      onValueChange={(value) => {
                        setFormData({...formData, state: value, city: ""})
                        // Find the state ID for the selected state
                        const selectedState = formOptions.states.find(s => s.value === value)
                        setSelectedStateId(selectedState?.id || "")
                      }}
                      disabled={isLoadingFormOptions}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder={
                          isLoadingFormOptions ? "Loading states..." : "Select a state"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {formOptions.states.map((state) => (
                          <SelectItem key={state.value} value={state.value}>
                            <div className="flex items-center gap-2">
                              <span>{state.label}</span>
                              <Badge variant="outline" className="text-xs">
                                {state.abbreviation}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.state && (
                      <div className="flex items-center gap-2 text-red-600 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {errors.state}
                      </div>
                    )}
                  </div>
                )}

                {/* City (conditional) */}
                {formData.geographicScope === "CITY" && (
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      City
                    </Label>
                    <Select
                      value={formData.city}
                      onValueChange={(value) => setFormData({...formData, city: value})}
                      disabled={!selectedStateId || cities.length === 0 || isLoadingCities}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder={
                          isLoadingCities
                            ? "Loading cities..."
                            : !selectedStateId 
                              ? "Select a state first" 
                              : cities.length === 0 
                                ? "No cities available" 
                                : "Select a city"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city.value} value={city.value}>
                            {city.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.city && (
                      <div className="flex items-center gap-2 text-red-600 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {errors.city}
                      </div>
                    )}
                    {selectedStateId && cities.length === 0 && (
                      <Alert className="border-yellow-200 bg-yellow-50">
                        <Info className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-800 text-sm">
                          No cities available for the selected state. Please contact support to add cities for this state.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {currentStep === 2 && (
              <div className="space-y-6">
                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-medium flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Category
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({...formData, category: value})}
                    disabled={isLoadingFormOptions}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder={
                        isLoadingFormOptions ? "Loading categories..." : "Select a category"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {formOptions.categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          <div className="flex flex-col">
                            <span>{category.label}</span>
                            {category.description && (
                              <span className="text-xs text-gray-500">{category.description}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      {errors.category}
                    </div>
                  )}
                  {suggestions.category && formOptions.categories.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs text-gray-600 flex items-center gap-1">
                        <Lightbulb className="h-3 w-3" />
                        Suggested categories based on your domain:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {suggestions.category
                          .filter(suggestion => formOptions.categories.some(cat => cat.value === suggestion))
                          .map((suggestion, index) => (
                            <Badge 
                              key={index}
                              variant="outline" 
                              className="cursor-pointer hover:bg-blue-50 hover:border-blue-300"
                              onClick={() => setFormData({...formData, category: suggestion})}
                            >
                              {suggestion}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the domain, its potential uses, and why it's valuable..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className={`min-h-[120px] resize-none ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
                    required
                  />
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>
                      {errors.description && (
                        <span className="flex items-center gap-1 text-red-600">
                          <AlertCircle className="h-3 w-3" />
                          {errors.description}
                        </span>
                      )}
                    </span>
                    <span>{formData.description.length}/500 characters</span>
                  </div>
                  <Alert className="border-blue-200 bg-blue-50">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 text-sm">
                      A good description helps buyers understand the domain's value and potential uses. Include keywords, target audience, and any special features.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Navigation Buttons */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={goToPreviousStep}
            disabled={currentStep === 0}
            className="h-12 px-6"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex items-center gap-4">
            {Object.keys(errors).length > 0 && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                Please fix the errors above
              </div>
            )}
            
            {currentStep < steps.length - 1 ? (
              <Button
                type="button"
                onClick={goToNextStep}
                className="h-12 px-8 bg-blue-600 hover:bg-blue-700"
                disabled={Object.keys(errors).length > 0}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button 
                type="submit" 
                disabled={isLoading || Object.keys(errors).length > 0}
                className="h-12 px-8 bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    {mode === "create" ? "Create Domain Listing" : "Update Domain Listing"}
                  </div>
                )}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

// Export with dynamic import to prevent hydration issues
export const ImprovedDomainFormSimpleClient = dynamic(
  () => Promise.resolve(ImprovedDomainFormSimple),
  { 
    ssr: false,
    loading: () => (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-8"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }
)
