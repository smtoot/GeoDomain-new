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

  const domainId = params.id as string;

  const { data: domain, isLoading, error } = trpc.domains.getById.useQuery(
    { id: domainId },
    { enabled: !!domainId }
  );

  const createInquiryMutation = trpc.inquiries.create.useMutation();

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
      budgetRange: "10K_25K",
      timeline: "WITHIN_30_DAYS",
    },
  });

  const onSubmit = async (data: InquiryFormData) => {
    if (!domain) return;

    setIsSubmitting(true);
    try {
      await createInquiryMutation.mutateAsync({
        domainId: domain.id,
        buyerName: data.buyerName,
        buyerEmail: data.buyerEmail,
        buyerPhone: data.buyerPhone || "",
        buyerCompany: data.buyerCompany || "",
        budgetRange: data.budgetRange,
        intendedUse: data.intendedUse,
        timeline: data.timeline,
        message: data.message,
      });

      toast.success("Inquiry sent successfully! The seller will be notified.");
      router.push(`/domains/${domain.id}`);
    } catch (error) {
      toast.error("Failed to send inquiry. Please try again.");
      console.error("Inquiry error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
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
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/domains/${domain.id}`)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Domain
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Send Inquiry</h1>
            <p className="text-gray-600">Contact the seller about {domain.name}</p>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {formatPrice(domain.price)}
            </div>
            <Badge variant="outline">{domain.priceType}</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Inquiry Form
              </CardTitle>
              <CardDescription>
                Fill out the form below to send an inquiry to the seller. Your inquiry will be reviewed by our team before being forwarded to the seller.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Personal Information
                  </h3>
                  
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
                        <p className="mt-1 text-sm text-red-600">{errors.buyerName.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address *
                      </label>
                      <Input
                        {...register("buyerEmail")}
                        type="email"
                        placeholder="your@email.com"
                        className={errors.buyerEmail ? "border-red-500" : ""}
                      />
                      {errors.buyerEmail && (
                        <p className="mt-1 text-sm text-red-600">{errors.buyerEmail.message}</p>
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
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Purchase Details
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Budget Range *
                      </label>
                      <Select
                        onValueChange={(value) => setValue("budgetRange", value as any)}
                        defaultValue={watch("budgetRange")}
                      >
                        <SelectTrigger className={errors.budgetRange ? "border-red-500" : ""}>
                          <SelectValue placeholder="Select budget range" />
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
                        <p className="mt-1 text-sm text-red-600">{errors.budgetRange.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Timeline *
                      </label>
                      <Select
                        onValueChange={(value) => setValue("timeline", value as any)}
                        defaultValue={watch("timeline")}
                      >
                        <SelectTrigger className={errors.timeline ? "border-red-500" : ""}>
                          <SelectValue placeholder="Select timeline" />
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
                        <p className="mt-1 text-sm text-red-600">{errors.timeline.message}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Intended Use *
                    </label>
                    <Textarea
                      {...register("intendedUse")}
                      placeholder="Describe how you plan to use this domain (e.g., business website, portfolio, e-commerce store)"
                      rows={3}
                      className={errors.intendedUse ? "border-red-500" : ""}
                    />
                    {errors.intendedUse && (
                      <p className="mt-1 text-sm text-red-600">{errors.intendedUse.message}</p>
                    )}
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Message to Seller
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Your Message *
                    </label>
                    <Textarea
                      {...register("message")}
                      placeholder="Tell the seller more about your interest in this domain, your plans, and any specific questions you have..."
                      rows={5}
                      className={errors.message ? "border-red-500" : ""}
                    />
                    {errors.message && (
                      <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/domains/${domain.id}`)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Send Inquiry
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Domain Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Domain Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="font-semibold text-lg">{domain.name}</div>
                <div className="text-sm text-gray-600">{domain.description}</div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-semibold">{formatPrice(domain.price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <Badge variant="outline">{domain.priceType}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Category:</span>
                  <span className="font-medium">{domain.category}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Process Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                What Happens Next?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-xs font-bold">1</span>
                </div>
                <div>
                  <div className="font-medium text-sm">Review Process</div>
                  <div className="text-xs text-gray-600">Your inquiry will be reviewed by our team within 24-48 hours</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 text-xs font-bold">2</span>
                </div>
                <div>
                  <div className="font-medium text-sm">Seller Notification</div>
                  <div className="text-xs text-gray-600">If approved, the seller will be notified of your interest</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-600 text-xs font-bold">3</span>
                </div>
                <div>
                  <div className="font-medium text-sm">Response</div>
                  <div className="text-xs text-gray-600">The seller will respond through our moderated system</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seller Information */}
          {domain.owner && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
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
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Verified Seller</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
