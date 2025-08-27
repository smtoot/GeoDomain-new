"use client"

import { useState, useEffect } from "react"
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
import { Globe, DollarSign, Tag, MapPin, Building } from "lucide-react"
import { 
  domainCategories, 
  industries, 
  geographicScopes, 
  popularStates, 
  popularCities,
  getCategoriesByIndustry,
  getDomainExamples,
  generateDomainName
} from "@/lib/categories"

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

interface DomainFormProps {
  initialData?: Partial<DomainFormData>
  onSubmit: (data: DomainFormData) => void
  isLoading?: boolean
  mode?: "create" | "edit"
}

export function DomainForm({ 
  initialData, 
  onSubmit, 
  isLoading = false, 
  mode = "create" 
}: DomainFormProps) {
  const [tags, setTags] = useState<string[]>(initialData?.tags || [])
  const [tagInput, setTagInput] = useState("")
  const [availableCategories, setAvailableCategories] = useState<typeof domainCategories>([])
  const [domainExamples, setDomainExamples] = useState<string[]>([])

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
  })

  const watchedGeographicScope = form.watch("geographicScope")
  const watchedIndustry = form.watch("industry")
  const watchedCategory = form.watch("category")

  // Update available categories when industry changes
  useEffect(() => {
    if (watchedIndustry) {
      const categories = getCategoriesByIndustry(watchedIndustry)
      setAvailableCategories(categories)
      
      // Reset category if it's no longer valid for the selected industry
      if (watchedCategory && !categories.find(cat => cat.id === watchedCategory)) {
        form.setValue("category", "")
      }
    } else {
      setAvailableCategories([])
    }
  }, [watchedIndustry, watchedCategory, form])

  // Update domain examples when geographic scope or category changes
  useEffect(() => {
    const examples = getDomainExamples(watchedGeographicScope, watchedCategory)
    setDomainExamples(examples)
  }, [watchedGeographicScope, watchedCategory])

  const handleSubmit = (data: DomainFormData) => {
    onSubmit({
      ...data,
      tags,
    })
  }

  const addTag = () => {
    if (tagInput.trim() && tags.length < 10) {
      setTags([...tags, tagInput.trim()])
      setTagInput("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addTag()
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {/* Domain Name Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Domain Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Domain Name</FormLabel>
                  <FormControl>
                    <Input placeholder="example.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter the exact domain name you want to list
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="1000"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pricing Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select pricing type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="FIXED">Fixed Price</SelectItem>
                        <SelectItem value="NEGOTIABLE">Negotiable</SelectItem>
                        <SelectItem value="MAKE_OFFER">Make Offer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Geographic Classification Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Geographic Classification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="geographicScope"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Geographic Scope</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select geographic scope" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {geographicScopes.map((scope) => (
                        <SelectItem key={scope.value} value={scope.value}>
                          <div>
                            <div className="font-medium">{scope.label}</div>
                            <div className="text-sm text-muted-foreground">{scope.description}</div>
                          </div>
                        </SelectItem>
                      ))}
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
                    <FormLabel>State</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {popularStates.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
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
                    <FormLabel>City</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select city" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {popularCities.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Domain Examples */}
            {domainExamples.length > 0 && (
              <div className="mt-4">
                <Label className="text-sm font-medium">Similar Domain Examples</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {domainExamples.slice(0, 3).map((example, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {example}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Classification Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Category Classification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {industries.map((industry) => (
                        <SelectItem key={industry.id} value={industry.name}>
                          <div>
                            <div className="font-medium">{industry.name}</div>
                            <div className="text-sm text-muted-foreground">{industry.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the primary industry this domain represents
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {availableCategories.length > 0 && (
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category/Keyword</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">No specific category</SelectItem>
                        {availableCategories.map((category) => (
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
                      Optional: Select a specific category or keyword for better classification
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        {/* Description Section */}
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Domain Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the domain, its potential uses, and value proposition..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a detailed description to help buyers understand the domain&apos;s value
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* SEO Section */}
        <Card>
          <CardHeader>
            <CardTitle>SEO & Meta Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>

        {/* Tags Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
          </CardContent>
        </Card>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Saving..." : mode === "create" ? "Create Domain Listing" : "Update Domain Listing"}
        </Button>
      </form>
    </Form>
  )
}
