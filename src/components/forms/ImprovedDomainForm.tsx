"use client"

import React, { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Globe, DollarSign, Tag, MapPin, Building, ChevronRight, ChevronLeft, CheckCircle, AlertCircle } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { toast } from "react-hot-toast"

// Enhanced validation schema
const domainFormSchema = z.object({
  name: z.string()
    .min(1, "Domain name is required")
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/, "Please enter a valid domain name"),
  price: z.number()
    .min(1, "Price must be at least $1")
    .max(1000000, "Price cannot exceed $1,000,000"),
  priceType: z.enum(["FIXED", "NEGOTIABLE", "MAKE_OFFER"]),
  
  // Enhanced Geographic Classification
  geographicScope: z.enum(["NATIONAL", "STATE", "CITY"]),
  state: z.string().optional(),
  city: z.string().optional(),
  
  // Enhanced Category Classification
  industry: z.string().min(1, "Industry is required"),
  category: z.string().optional(),
  
  description: z.string().max(1000, "Description cannot exceed 1000 characters"),
  metaTitle: z.string().max(60, "Meta title cannot exceed 60 characters").optional(),
  metaDescription: z.string().max(160, "Meta description cannot exceed 160 characters").optional(),
  tags: z.array(z.string()).max(10, "Maximum 10 tags allowed").optional(),
}).refine((data) => {
  // Validate geographic scope requirements
  if (data.geographicScope === "STATE" && !data.state) {
    return false;
  }
  if (data.geographicScope === "CITY" && (!data.state || !data.city)) {
    return false;
  }
  return true;
}, {
  message: "Please fill in all required geographic fields for your selected scope",
  path: ["geographicScope"]
});

type DomainFormData = z.infer<typeof domainFormSchema>

interface ImprovedDomainFormProps {
  initialData?: Partial<DomainFormData>
  onSubmit: (data: DomainFormData) => void
  isLoading?: boolean
  mode?: "create" | "edit"
}

// Form steps configuration
const FORM_STEPS = [
  {
    id: "basic",
    title: "Basic Information",
    description: "Domain name, pricing, and type",
    icon: Globe,
    required: true
  },
  {
    id: "geographic",
    title: "Geographic Classification",
    description: "Target location and scope",
    icon: MapPin,
    required: true
  },
  {
    id: "category",
    title: "Category & Description",
    description: "Industry, category, and description",
    icon: Building,
    required: true
  },
  {
    id: "seo",
    title: "SEO & Tags",
    description: "Meta information and tags",
    icon: Tag,
    required: false
  }
] as const;

type FormStep = typeof FORM_STEPS[number]["id"];

export function ImprovedDomainForm({ 
  initialData, 
  onSubmit, 
  isLoading = false, 
  mode = "create" 
}: ImprovedDomainFormProps) {
  const [currentStep, setCurrentStep] = useState<FormStep>("basic");
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [completedSteps, setCompletedSteps] = useState<Set<FormStep>>(new Set());

  // Fetch data from database
  const { data: categories, isLoading: categoriesLoading } = trpc.adminData.getCategories.useQuery();
  const { data: states, isLoading: statesLoading } = trpc.adminData.getStates.useQuery();
  const { data: cities, isLoading: citiesLoading } = trpc.adminData.getCities.useQuery({});

  const form = useForm<DomainFormData>({
    resolver: zodResolver(domainFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      price: initialData?.price || 0,
      priceType: initialData?.priceType || "FIXED",
      geographicScope: initialData?.geographicScope || "STATE",
      state: initialData?.state || "",
      city: initialData?.city || "",
      industry: initialData?.industry || "",
      category: initialData?.category || "",
      description: initialData?.description || "",
      metaTitle: initialData?.metaTitle || "",
      metaDescription: initialData?.metaDescription || "",
      tags: initialData?.tags || [],
    },
  });

  const watchedGeographicScope = form.watch("geographicScope");
  const watchedState = form.watch("state");
  const watchedIndustry = form.watch("industry");

  // Filter cities based on selected state
  const filteredCities = cities?.filter(city => city.stateId === watchedState) || [];

  // Filter categories based on industry (simplified for now)
  const filteredCategories = categories?.filter(cat => 
    cat.name.toLowerCase().includes(watchedIndustry.toLowerCase()) || 
    watchedIndustry.toLowerCase().includes(cat.name.toLowerCase())
  ) || [];

  // Calculate progress
  const currentStepIndex = FORM_STEPS.findIndex(step => step.id === currentStep);
  const progress = ((currentStepIndex + 1) / FORM_STEPS.length) * 100;

  // Check if current step is complete
  const isCurrentStepComplete = () => {
    const values = form.getValues();
    
    switch (currentStep) {
      case "basic":
        return values.name && values.price > 0 && values.priceType;
      case "geographic":
        if (values.geographicScope === "NATIONAL") return true;
        if (values.geographicScope === "STATE") return values.state;
        if (values.geographicScope === "CITY") return values.state && values.city;
        return false;
      case "category":
        return values.industry && values.description;
      case "seo":
        return true; // Optional step
      default:
        return false;
    }
  };

  // Handle step navigation
  const goToNextStep = () => {
    if (currentStepIndex < FORM_STEPS.length - 1) {
      const nextStep = FORM_STEPS[currentStepIndex + 1];
      setCurrentStep(nextStep.id);
    }
  };

  const goToPreviousStep = () => {
    if (currentStepIndex > 0) {
      const prevStep = FORM_STEPS[currentStepIndex - 1];
      setCurrentStep(prevStep.id);
    }
  };

  // Update completed steps
  useEffect(() => {
    if (isCurrentStepComplete()) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
    } else {
      setCompletedSteps(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentStep);
        return newSet;
      });
    }
  }, [currentStep, form.watch()]);

  const handleSubmit = (data: DomainFormData) => {
    onSubmit({
      ...data,
      tags,
    });
  };

  const addTag = () => {
    if (tagInput.trim() && tags.length < 10 && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case "basic":
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Domain Name <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="example.com" 
                      {...field}
                      className="text-lg"
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the exact domain name you want to list
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Price (USD) <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="1000"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Set your asking price for this domain
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Pricing Type <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select pricing type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="FIXED">
                          <div>
                            <div className="font-medium">Fixed Price</div>
                            <div className="text-sm text-muted-foreground">Set a specific price</div>
                          </div>
                        </SelectItem>
                        <SelectItem value="NEGOTIABLE">
                          <div>
                            <div className="font-medium">Negotiable</div>
                            <div className="text-sm text-muted-foreground">Open to offers</div>
                          </div>
                        </SelectItem>
                        <SelectItem value="MAKE_OFFER">
                          <div>
                            <div className="font-medium">Make Offer</div>
                            <div className="text-sm text-muted-foreground">Buyers make offers</div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      case "geographic":
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="geographicScope"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Geographic Scope <span className="text-red-500">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select geographic scope" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="NATIONAL">
                        <div>
                          <div className="font-medium">National (USA)</div>
                          <div className="text-sm text-muted-foreground">Targets entire United States</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="STATE">
                        <div>
                          <div className="font-medium">State</div>
                          <div className="text-sm text-muted-foreground">Targets a specific state</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="CITY">
                        <div>
                          <div className="font-medium">City</div>
                          <div className="text-sm text-muted-foreground">Targets a specific city</div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Define the geographic area this domain targets
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchedGeographicScope !== "NATIONAL" && (
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      State <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statesLoading ? (
                          <SelectItem value="" disabled>Loading states...</SelectItem>
                        ) : (
                          states?.map((state) => (
                            <SelectItem key={state.id} value={state.id}>
                              {state.name} ({state.abbreviation})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {watchedGeographicScope === "CITY" && (
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      City <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select city" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {citiesLoading ? (
                          <SelectItem value="" disabled>Loading cities...</SelectItem>
                        ) : filteredCities.length === 0 ? (
                          <SelectItem value="" disabled>No cities available for selected state</SelectItem>
                        ) : (
                          filteredCities.map((city) => (
                            <SelectItem key={city.id} value={city.id}>
                              {city.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        );

      case "category":
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Industry <span className="text-red-500">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categoriesLoading ? (
                        <SelectItem value="" disabled>Loading categories...</SelectItem>
                      ) : (
                        categories?.map((category) => (
                          <SelectItem key={category.id} value={category.name}>
                            <div>
                              <div className="font-medium">{category.name}</div>
                              <div className="text-sm text-muted-foreground">{category.description}</div>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the primary industry this domain represents
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {filteredCategories.length > 0 && (
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category/Keyword (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">No specific category</SelectItem>
                        {filteredCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            <div>
                              <div className="font-medium">{category.name}</div>
                              <div className="text-sm text-muted-foreground">{category.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Optional: Select a specific category for better classification
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Description <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the domain, its potential uses, and value proposition..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a detailed description to help buyers understand the domain's value
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case "seo":
        return (
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Optional SEO Fields</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    These fields help with search engine optimization but are not required.
                  </p>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="metaTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meta Title</FormLabel>
                  <FormControl>
                    <Input placeholder="SEO title for search engines" {...field} />
                  </FormControl>
                  <FormDescription>
                    Title that appears in search engine results (max 60 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="metaDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meta Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description for search engine results"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Description that appears in search engine results (max 160 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <Label>Tags (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <Button type="button" onClick={addTag} disabled={tags.length >= 10}>
                  Add
                </Button>
              </div>
              
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              
              <p className="text-sm text-muted-foreground">
                {tags.length}/10 tags added
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">
            {mode === "create" ? "Create Domain Listing" : "Edit Domain Listing"}
          </h2>
          <div className="text-sm text-muted-foreground">
            Step {currentStepIndex + 1} of {FORM_STEPS.length}
          </div>
        </div>
        
        <Progress value={progress} className="mb-4" />
        
        <div className="flex justify-between">
          {FORM_STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                completedSteps.has(step.id) 
                  ? "bg-green-500 border-green-500 text-white" 
                  : currentStep === step.id 
                    ? "border-blue-500 text-blue-500" 
                    : "border-gray-300 text-gray-400"
              }`}>
                {completedSteps.has(step.id) ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  React.createElement(step.icon, { className: "w-4 h-4" })
                )}
              </div>
              <div className="ml-2">
                <div className={`text-sm font-medium ${
                  currentStep === step.id ? "text-blue-600" : "text-gray-600"
                }`}>
                  {step.title}
                </div>
                <div className="text-xs text-gray-500">
                  {step.required ? "Required" : "Optional"}
                </div>
              </div>
              {index < FORM_STEPS.length - 1 && (
                <ChevronRight className="w-4 h-4 text-gray-400 mx-4" />
              )}
            </div>
          ))}
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          {/* Current Step Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {React.createElement(FORM_STEPS[currentStepIndex].icon, { className: "h-5 w-5" })}
                {FORM_STEPS[currentStepIndex].title}
              </CardTitle>
              <p className="text-muted-foreground">
                {FORM_STEPS[currentStepIndex].description}
              </p>
            </CardHeader>
            <CardContent>
              {renderStepContent()}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={goToPreviousStep}
              disabled={currentStepIndex === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {currentStepIndex < FORM_STEPS.length - 1 ? (
              <Button
                type="button"
                onClick={goToNextStep}
                disabled={!isCurrentStepComplete()}
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
      </Form>
    </div>
  );
}
