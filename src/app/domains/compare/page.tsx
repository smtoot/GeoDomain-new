'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  Database,
  Zap,
  Globe,
  MapPin,
  Building,
  Tag
} from 'lucide-react';

export default function DomainFormComparisonPage() {
  const [selectedForm, setSelectedForm] = useState<'old' | 'new'>('new');

  const improvements = [
    {
      category: "User Experience",
      icon: Users,
      items: [
        { title: "Progressive Disclosure", old: false, new: true, description: "Multi-step form reduces cognitive load" },
        { title: "Visual Progress Indicator", old: false, new: true, description: "Clear progress tracking through steps" },
        { title: "Required Field Indicators", old: false, new: true, description: "Clear visual distinction of required vs optional" },
        { title: "Smart Field Dependencies", old: false, new: true, description: "Conditional fields show/hide based on selections" },
        { title: "Better Error Handling", old: false, new: true, description: "Comprehensive validation with helpful messages" }
      ]
    },
    {
      category: "Data Management",
      icon: Database,
      items: [
        { title: "Database-Driven Data", old: false, new: true, description: "Real-time data from database instead of static files" },
        { title: "Consistent Data Sources", old: false, new: true, description: "Single source of truth for categories, states, cities" },
        { title: "Dynamic City Filtering", old: false, new: true, description: "Cities filtered based on selected state" },
        { title: "Category Suggestions", old: false, new: true, description: "Smart category filtering based on industry" }
      ]
    },
    {
      category: "Form Structure",
      icon: Zap,
      items: [
        { title: "Unified Form Implementation", old: false, new: true, description: "Single form instead of two different implementations" },
        { title: "React Hook Form Integration", old: false, new: true, description: "Better form state management and validation" },
        { title: "Zod Schema Validation", old: false, new: true, description: "Type-safe validation with comprehensive rules" },
        { title: "Step Completion Tracking", old: false, new: true, description: "Visual indicators for completed steps" }
      ]
    },
    {
      category: "Geographic Classification",
      icon: MapPin,
      items: [
        { title: "Clear Geographic Scope", old: false, new: true, description: "NATIONAL/STATE/CITY instead of boolean flag" },
        { title: "Comprehensive State/City Data", old: false, new: true, description: "All 50 states and major cities supported" },
        { title: "Geographic Validation", old: false, new: true, description: "Proper validation for geographic requirements" }
      ]
    }
  ];

  const formSteps = [
    { id: "basic", title: "Basic Information", icon: Globe, description: "Domain name, pricing, and type" },
    { id: "geographic", title: "Geographic Classification", icon: MapPin, description: "Target location and scope" },
    { id: "category", title: "Category & Description", icon: Building, description: "Industry, category, and description" },
    { id: "seo", title: "SEO & Tags", icon: Tag, description: "Meta information and tags" }
  ];

  return (
    <StandardPageLayout
      title="Domain Form Comparison"
      description="Compare the old and new domain creation forms"
      isLoading={false}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Link href="/dashboard/domains">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Domains
          </Button>
        </Link>
        
        <div className="flex items-center gap-2">
          <Button
            variant={selectedForm === 'old' ? 'default' : 'outline'}
            onClick={() => setSelectedForm('old')}
          >
            View Old Form
          </Button>
          <Button
            variant={selectedForm === 'new' ? 'default' : 'outline'}
            onClick={() => setSelectedForm('new')}
          >
            View New Form
          </Button>
        </div>
      </div>

      {/* Form Selection */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {selectedForm === 'new' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
              {selectedForm === 'new' ? 'Improved Domain Form' : 'Legacy Domain Form'}
            </CardTitle>
            <CardDescription>
              {selectedForm === 'new' 
                ? 'The new form features progressive disclosure, better validation, and database-driven data'
                : 'The old form has basic functionality but lacks modern UX patterns and data consistency'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Link href={selectedForm === 'new' ? '/domains/new-improved' : '/domains/new'}>
                <Button className="flex items-center gap-2">
                  {selectedForm === 'new' ? 'Try New Form' : 'Try Old Form'}
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </Button>
              </Link>
              <Badge variant={selectedForm === 'new' ? 'default' : 'secondary'}>
                {selectedForm === 'new' ? 'Recommended' : 'Legacy'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Improvements Overview */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6">Key Improvements</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {improvements.map((category) => (
            <Card key={category.category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <category.icon className="h-5 w-5" />
                  {category.category}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {category.items.map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex items-center gap-2 mt-1">
                        {item.old ? (
                          <XCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        {item.new ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{item.title}</h4>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Form Steps Preview */}
      {selectedForm === 'new' && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Progressive Disclosure Steps</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {formSteps.map((step, index) => (
              <Card key={step.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600">
                      <step.icon className="h-4 w-4" />
                    </div>
                    <Badge variant="outline">Step {index + 1}</Badge>
                  </div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                  <CardDescription className="text-sm">{step.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground">
                    {index < 3 ? 'Required' : 'Optional'}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Technical Comparison */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6">Technical Comparison</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                Legacy Form Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                  <span>Two different form implementations</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                  <span>Static data sources (outdated)</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                  <span>Basic HTML5 validation only</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                  <span>Inconsistent geographic handling</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                  <span>Manual state management (error-prone)</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                  <span>Long, overwhelming single form</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Improved Form Benefits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Single, unified form implementation</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Database-driven real-time data</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Comprehensive Zod schema validation</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Consistent geographic classification</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>React Hook Form state management</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Progressive disclosure (multi-step)</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="text-xl font-bold mb-2">Ready to Try the Improved Form?</h3>
            <p className="text-muted-foreground mb-4">
              Experience the enhanced domain creation process with better UX, validation, and data management.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/domains/new-improved">
                <Button size="lg" className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Create Domain (New Form)
                </Button>
              </Link>
              <Link href="/domains/new">
                <Button variant="outline" size="lg">
                  View Legacy Form
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </StandardPageLayout>
  );
}
