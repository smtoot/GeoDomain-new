"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StandardPageLayout } from "@/components/layout/StandardPageLayout";
import { QueryErrorBoundary } from "@/components/error";
import { LoadingCardSkeleton } from "@/components/ui/loading/LoadingSkeleton";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Globe, MessageCircle, User, Building, DollarSign, Calendar, Clock } from "lucide-react";
import { toast } from "react-hot-toast";
import { formatPrice } from "@/lib/utils";

const inquirySchema = z.object({
  buyerName: z.string().min(2, "Name must be at least 2 characters"),
  buyerEmail: z.string().email("Invalid email address"),
  buyerPhone: z.string().optional(),
  buyerCompany: z.string().optional(),
  budgetRange: z.enum(["UNDER_5K", "5K_10K", "10K_25K", "25K_50K", "50K_100K", "OVER_100K"]),
  intendedUse: z.string().min(10, "Please describe your intended use (at least 10 characters)"),
  timeline: z.enum(["IMMEDIATE", "WITHIN_30_DAYS", "WITHIN_90_DAYS", "FLEXIBLE"]),
  message: z.string().min(20, "Message must be at least 20 characters"),
});

type InquiryFormData = z.infer<typeof inquirySchema>;

const budgetRanges = [
  { value: "UNDER_5K", label: "Under $5,000" },
  { value: "5K_10K", label: "$5,000 - $10,000" },
  { value: "10K_25K", label: "$10,000 - $25,000" },
  { value: "25K_50K", label: "$25,000 - $50,000" },
  { value: "50K_100K", label: "$50,000 - $100,000" },
  { value: "OVER_100K", label: "Over $100,000" },
];

const timelines = [
  { value: "IMMEDIATE", label: "Immediate" },
  { value: "WITHIN_30_DAYS", label: "Within 30 days" },
  { value: "WITHIN_90_DAYS", label: "Within 90 days" },
  { value: "FLEXIBLE", label: "Flexible" },
];

export default function DomainInquiryPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const domainName = params.domain as string;

  // Get domain by name instead of ID
  const { data: domainResponse, isLoading, error } = trpc.domains.getByName.useQuery(
    { name: domainName },
    {
      enabled: !!domainName,
    }
  );

  const domain = domainResponse?.data?.data || domainResponse?.data || domainResponse;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<InquiryFormData>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      buyerName: session?.user?.name || "",
      buyerEmail: session?.user?.email || "",
      buyerCompany: session?.user?.company || "",
    },
  });

  const createInquiryMutation = trpc.inquiries.create.useMutation();

  const onSubmit = async (data: InquiryFormData) => {
    if (!domain) {
      toast.error("Domain information not available");
      return;
    }

    setIsSubmitting(true);
    try {
      await createInquiryMutation.mutateAsync({
        domainId: domain.id,
        buyerName: data.buyerName,
        buyerEmail: data.buyerEmail,
        buyerPhone: data.buyerPhone,
        buyerCompany: data.buyerCompany,
        budgetRange: data.budgetRange,
        intendedUse: data.intendedUse,
        timeline: data.timeline,
        message: data.message,
      });

      toast.success("Inquiry submitted successfully! The seller will contact you soon.");
      router.push(`/domains/${encodeURIComponent(domainName)}`);
    } catch (error) {
      toast.error("Failed to submit inquiry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-200 rounded-lg"></div>
              <div className="h-96 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !domain) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Domain Not Found</h1>
            <p className="text-gray-600 mb-6">
              The domain "{domainName}" could not be found.
            </p>
            <Button onClick={() => router.push('/domains')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Domains
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <QueryErrorBoundary context="Domain Inquiry Page">
      <StandardPageLayout
        title="Make an Inquiry"
        description={`Interested in purchasing ${domain?.name || 'this domain'}? Send a message to the seller.`}
        isLoading={isLoading}
        loadingText="Loading domain details..."
        error={error || (!domain ? new Error('Domain not found') : undefined)}
        className="min-h-screen bg-gray-50 py-8"
      >
        {/* Navigation */}
        <div className="mb-6">
          <Button 
            onClick={() => router.push(`/domains/${encodeURIComponent(domainName)}`)} 
            variant="ghost" 
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Domain
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Domain Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Domain Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {domain.name}
                </h3>
                <p className="text-gray-600 mb-4">
                  {domain.description}
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Price</span>
                  <span className="font-semibold text-lg">
                    {formatPrice(domain.price)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Price Type</span>
                  <Badge variant="outline">
                    {domain.priceType.replace('_', ' ')}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status</span>
                  <Badge 
                    className={
                      domain.status === 'VERIFIED' 
                        ? 'bg-green-100 text-green-800 border-green-200' 
                        : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                    }
                  >
                    {domain.status}
                  </Badge>
                </div>
                
                {domain.category && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Category</span>
                    <span className="font-medium">
                      {domain.category.name || domain.category}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Geographic Scope</span>
                  <span className="font-medium">
                    {domain.geographicScope}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inquiry Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Send Inquiry
              </CardTitle>
              <CardDescription>
                Fill out the form below to express your interest in this domain.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Buyer Information */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Your Information
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <Input
                        {...register("buyerName")}
                        placeholder="Your full name"
                        className={errors.buyerName ? "border-red-500" : ""}
                      />
                      {errors.buyerName && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.buyerName.message}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address *
                      </label>
                      <Input
                        type="email"
                        {...register("buyerEmail")}
                        placeholder="your@email.com"
                        className={errors.buyerEmail ? "border-red-500" : ""}
                      />
                      {errors.buyerEmail && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.buyerEmail.message}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <Input
                        {...register("buyerPhone")}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company
                      </label>
                      <Input
                        {...register("buyerCompany")}
                        placeholder="Your company name"
                      />
                    </div>
                  </div>
                </div>

                {/* Purchase Details */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Purchase Details
                  </h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Budget Range *
                    </label>
                    <Select onValueChange={(value) => setValue("budgetRange", value as any)}>
                      <SelectTrigger className={errors.budgetRange ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select your budget range" />
                      </SelectTrigger>
                      <SelectContent>
                        {budgetRanges.map((range) => (
                          <SelectItem key={range.value} value={range.value}>
                            {range.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.budgetRange && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.budgetRange.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Timeline *
                    </label>
                    <Select onValueChange={(value) => setValue("timeline", value as any)}>
                      <SelectTrigger className={errors.timeline ? "border-red-500" : ""}>
                        <SelectValue placeholder="When do you need the domain?" />
                      </SelectTrigger>
                      <SelectContent>
                        {timelines.map((timeline) => (
                          <SelectItem key={timeline.value} value={timeline.value}>
                            {timeline.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.timeline && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.timeline.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Intended Use *
                    </label>
                    <Textarea
                      {...register("intendedUse")}
                      placeholder="Describe how you plan to use this domain..."
                      rows={3}
                      className={errors.intendedUse ? "border-red-500" : ""}
                    />
                    {errors.intendedUse && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.intendedUse.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message *
                  </label>
                  <Textarea
                    {...register("message")}
                    placeholder="Write your message to the seller..."
                    rows={4}
                    className={errors.message ? "border-red-500" : ""}
                  />
                  {errors.message && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.message.message}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Send Inquiry
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </StandardPageLayout>
    </QueryErrorBoundary>
  );
}
