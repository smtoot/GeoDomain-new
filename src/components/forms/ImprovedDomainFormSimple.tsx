"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Globe, ChevronRight, ChevronLeft } from "lucide-react"

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
    industry: "",
    category: "",
    description: ""
  })

  const steps = [
    { id: "basic", title: "Basic Information", icon: Globe },
    { id: "geographic", title: "Geographic", icon: Globe },
    { id: "details", title: "Details", icon: Globe }
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">
            {mode === "create" ? "Create Domain Listing" : "Edit Domain Listing"}
          </h2>
          <div className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Current Step Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {steps[currentStep].title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentStep === 0 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Domain Name</Label>
                  <Input
                    id="name"
                    placeholder="example.com"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price (USD)</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="1000"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="priceType">Price Type</Label>
                  <select
                    id="priceType"
                    value={formData.priceType}
                    onChange={(e) => setFormData({...formData, priceType: e.target.value as "FIXED" | "NEGOTIABLE" | "MAKE_OFFER"})}
                    className="w-full p-2 border rounded-md"
                    required
                  >
                    <option value="FIXED">Fixed Price</option>
                    <option value="NEGOTIABLE">Negotiable</option>
                    <option value="MAKE_OFFER">Make Offer</option>
                  </select>
                </div>
              </div>
            )}
            
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="geographicScope">Geographic Scope</Label>
                  <select
                    id="geographicScope"
                    value={formData.geographicScope}
                    onChange={(e) => setFormData({...formData, geographicScope: e.target.value as "NATIONAL" | "STATE" | "CITY"})}
                    className="w-full p-2 border rounded-md"
                    required
                  >
                    <option value="NATIONAL">National (USA)</option>
                    <option value="STATE">State</option>
                    <option value="CITY">City</option>
                  </select>
                </div>
                {formData.geographicScope !== "NATIONAL" && (
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      placeholder="California"
                      value={formData.state}
                      onChange={(e) => setFormData({...formData, state: e.target.value})}
                      required
                    />
                  </div>
                )}
                {formData.geographicScope === "CITY" && (
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="Los Angeles"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      required
                    />
                  </div>
                )}
              </div>
            )}
            
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    placeholder="Technology"
                    value={formData.industry}
                    onChange={(e) => setFormData({...formData, industry: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    placeholder="Software"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="Describe the domain..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    required
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={goToPreviousStep}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button
              type="button"
              onClick={goToNextStep}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : mode === "create" ? "Create Domain Listing" : "Update Domain Listing"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
