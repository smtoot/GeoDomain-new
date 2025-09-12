'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/header";
import { LoadingSpinner } from "@/components/ui/loading/LoadingSpinner";
import { trpc } from "@/lib/trpc";
import { 
  MapPin, 
  Building, 
  Shield, 
  Users, 
  Search,
  Star,
  TrendingUp,
  Globe,
  ArrowRight,
  Target,
  Award
} from "lucide-react";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function Home() {
  // Fetch featured domains
  const { data: featuredData, isLoading: featuredLoading } = trpc.admin.getFeaturedDomains.useQuery({
    limit: 6,
  });

  const featuredDomains = featuredData?.domains || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50">
      {/* Header */}
      <Header />

      {/* Hero Section - US Geo Focused */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <MapPin className="h-4 w-4" />
                US Geographic Domains
              </div>
              
              <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Premium <span className="text-red-600">US Geo</span> Domains
                <br />
                <span className="text-3xl sm:text-4xl text-gray-700">for Every Business</span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 max-w-2xl">
                Find the perfect location-based domain for your US business. From national brands to local services, 
                discover domains that connect with your target market across all 50 states.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="/domains">
                  <Button size="lg" className="text-lg px-8 py-3 bg-red-600 hover:bg-red-700">
                    <Search className="h-5 w-5 mr-2" />
                    Browse US Domains
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                    <Building className="h-5 w-5 mr-2" />
                    List Your Domain
                  </Button>
                </Link>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-red-600">50</div>
                  <div className="text-sm text-gray-600">US States</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">500+</div>
                  <div className="text-sm text-gray-600">Cities</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">100+</div>
                  <div className="text-sm text-gray-600">Categories</div>
                </div>
              </div>
            </div>

            {/* Right Content - Geographic Scope Visual */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
                <h3 className="text-xl font-semibold mb-6 text-center">Geographic Coverage</h3>
                
                {/* Geographic Scope Cards */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                      <Globe className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">National Coverage</h4>
                      <p className="text-sm text-gray-600">USAHotels.com, AmericanRestaurants.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">State Coverage</h4>
                      <p className="text-sm text-gray-600">TexasHotels.com, FloridaRestaurants.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">City Coverage</h4>
                      <p className="text-sm text-gray-600">HoustonHotels.com, MiamiRestaurants.com</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Domains for Every US Business
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From coast to coast, find the perfect domain for your industry and location
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Hospitality & Travel */}
            <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-red-200">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <Building className="h-5 w-5 text-red-600" />
                  </div>
                  <CardTitle className="text-lg">Hospitality & Travel</CardTitle>
                </div>
                <CardDescription>
                  Hotels, restaurants, and tourism businesses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">TexasHotels.com</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">MiamiRestaurants.com</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">USATravel.com</span>
                  </div>
                </div>
                <Link href="/domains?category=hotels">
                  <Button variant="outline" size="sm" className="w-full group-hover:bg-red-50 group-hover:border-red-200">
                    View Hospitality Domains
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Healthcare Services */}
            <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-200">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Shield className="h-5 w-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">Healthcare Services</CardTitle>
                </div>
                <CardDescription>
                  Medical practices, dental care, and wellness
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">CaliforniaHealthcare.com</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">FloridaDentists.com</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">BostonMedical.com</span>
                  </div>
                </div>
                <Link href="/domains?category=healthcare">
                  <Button variant="outline" size="sm" className="w-full group-hover:bg-blue-50 group-hover:border-blue-200">
                    View Healthcare Domains
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Real Estate */}
            <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-green-200">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Building className="h-5 w-5 text-green-600" />
                  </div>
                  <CardTitle className="text-lg">Real Estate</CardTitle>
                </div>
                <CardDescription>
                  Property sales, rentals, and real estate services
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">MiamiRealEstate.com</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">TexasProperties.com</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">USAHomes.com</span>
                  </div>
                </div>
                <Link href="/domains?category=real-estate">
                  <Button variant="outline" size="sm" className="w-full group-hover:bg-green-50 group-hover:border-green-200">
                    View Real Estate Domains
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Professional Services */}
            <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-purple-200">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <CardTitle className="text-lg">Professional Services</CardTitle>
                </div>
                <CardDescription>
                  Legal, accounting, and business consulting
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">TexasLawyers.com</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">CaliforniaAccounting.com</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">NewYorkConsulting.com</span>
                  </div>
                </div>
                <Link href="/domains?category=legal">
                  <Button variant="outline" size="sm" className="w-full group-hover:bg-purple-50 group-hover:border-purple-200">
                    View Professional Domains
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Home Services */}
            <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-orange-200">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Building className="h-5 w-5 text-orange-600" />
                  </div>
                  <CardTitle className="text-lg">Home Services</CardTitle>
                </div>
                <CardDescription>
                  Plumbing, electrical, HVAC, and maintenance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">TexasPlumbers.com</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">FloridaElectricians.com</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">CaliforniaHVAC.com</span>
                  </div>
                </div>
                <Link href="/domains?category=plumbers">
                  <Button variant="outline" size="sm" className="w-full group-hover:bg-orange-50 group-hover:border-orange-200">
                    View Home Service Domains
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Technology */}
            <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-indigo-200">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-indigo-600" />
                  </div>
                  <CardTitle className="text-lg">Technology</CardTitle>
                </div>
                <CardDescription>
                  IT services, software, and tech consulting
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">TexasTech.com</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">SiliconValleyStartups.com</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">USASoftware.com</span>
                  </div>
                </div>
                <Link href="/domains?category=technology">
                  <Button variant="outline" size="sm" className="w-full group-hover:bg-indigo-50 group-hover:border-indigo-200">
                    View Technology Domains
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose GeoDomainLand?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The most trusted marketplace for US geographic domains with verified ownership and secure transactions
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-8 border-2 border-red-200 bg-white">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-xl mb-4">Verified Ownership</CardTitle>
              <CardDescription className="text-base">
                Every domain is verified through DNS or file verification. No fake listings, no scams - just authentic, 
                owned domains ready for legitimate business use.
              </CardDescription>
            </Card>

            <Card className="text-center p-8 border-2 border-blue-200 bg-white">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-xl mb-4">Admin Moderated</CardTitle>
              <CardDescription className="text-base">
                All communications and transactions are professionally moderated by our team. 
                Quality interactions, no spam, and secure negotiations every step of the way.
              </CardDescription>
            </Card>

            <Card className="text-center p-8 border-2 border-green-200 bg-white">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-xl mb-4">Secure Transactions</CardTitle>
              <CardDescription className="text-base">
                Our admin team coordinates payments and verifies all transactions. 
                Secure domain transfers with full documentation and peace of mind.
              </CardDescription>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Simple, secure, and professional domain transactions
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold mb-4">Search & Discover</h3>
              <p className="text-gray-600">
                Browse our verified US geographic domains by location, category, or price. 
                Find the perfect domain for your business needs.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold mb-4">Submit Inquiry</h3>
              <p className="text-gray-600">
                Contact sellers through our moderated system. 
                All inquiries are professionally handled and verified.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold mb-4">Negotiate Terms</h3>
              <p className="text-gray-600">
                Discuss pricing and terms through admin-moderated messaging. 
                Professional guidance throughout the negotiation process.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                4
              </div>
              <h3 className="text-xl font-semibold mb-4">Secure Transfer</h3>
              <p className="text-gray-600">
                Admin coordinates payment and domain transfer. 
                Complete documentation and secure ownership transfer.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Domains Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-red-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Featured US Geo Domains
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Premium domains available now - perfect for your US business
            </p>
          </div>

          {featuredLoading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner />
            </div>
          ) : featuredDomains.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredDomains.map((domain: any) => {
                const getGeographicDisplay = () => {
                  if (domain.geographicScope === 'NATIONAL') return 'National';
                  if (domain.state && domain.city) return `${domain.city}, ${domain.state}`;
                  if (domain.state) return domain.state;
                  if (domain.city) return domain.city;
                  return 'US';
                };

                const getColorClass = (index: number) => {
                  const colors = [
                    'hover:border-red-300',
                    'hover:border-blue-300', 
                    'hover:border-green-300',
                    'hover:border-purple-300',
                    'hover:border-orange-300',
                    'hover:border-pink-300'
                  ];
                  return colors[index % colors.length];
                };

                const getBadgeColor = (index: number) => {
                  const badgeColors = [
                    'bg-red-100 text-red-800',
                    'bg-blue-100 text-blue-800',
                    'bg-green-100 text-green-800',
                    'bg-purple-100 text-purple-800',
                    'bg-orange-100 text-orange-800',
                    'bg-pink-100 text-pink-800'
                  ];
                  return badgeColors[index % badgeColors.length];
                };

                const getButtonColor = (index: number) => {
                  const buttonColors = [
                    'bg-red-600 hover:bg-red-700',
                    'bg-blue-600 hover:bg-blue-700',
                    'bg-green-600 hover:bg-green-700',
                    'bg-purple-600 hover:bg-purple-700',
                    'bg-orange-600 hover:bg-orange-700',
                    'bg-pink-600 hover:bg-pink-700'
                  ];
                  return buttonColors[index % buttonColors.length];
                };

                return (
                  <Card key={domain.id} className={`group hover:shadow-xl transition-all duration-300 border-2 ${getColorClass(featuredDomains.indexOf(domain))}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className={getBadgeColor(featuredDomains.indexOf(domain))}>
                          <MapPin className="h-3 w-3 mr-1" />
                          {getGeographicDisplay()}
                        </Badge>
                        {domain.category && (
                          <Badge variant="outline">{domain.category}</Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl text-gray-900 group-hover:text-gray-700">
                        {domain.name}
                      </CardTitle>
                      <CardDescription>
                        {domain.description || 'Premium domain available for your business'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-2xl font-bold text-green-600">
                          ${domain.price.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>Featured</span>
                        </div>
                      </div>
                      <Link href={`/domains/${encodeURIComponent(domain.name)}`}>
                        <Button className={`w-full ${getButtonColor(featuredDomains.indexOf(domain))}`}>
                          View Details
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No featured domains available at the moment.</p>
              <p className="text-gray-400 text-sm mt-2">Check back soon for premium domain listings!</p>
            </div>
          )}

          <div className="text-center mt-12">
            <Link href="/domains">
              <Button size="lg" variant="outline" className="text-lg px-8 py-3">
                View All Available Domains
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-red-600 to-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Find Your Perfect US Geo Domain?
          </h2>
          <p className="text-xl text-red-100 mb-8">
            Join thousands of US businesses who found their perfect geographic domain on GeoDomainLand
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-3 bg-white text-red-600 hover:bg-gray-100">
                <Building className="h-5 w-5 mr-2" />
                Create Account
              </Button>
            </Link>
            <Link href="/domains">
              <Button size="lg" variant="outline" className="text-lg px-8 py-3 border-white text-white hover:bg-white hover:text-red-600">
                <Search className="h-5 w-5 mr-2" />
                Browse Domains
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">GeoDomainLand</h3>
              <p className="text-gray-400">
                The premier marketplace for US geographic domains. Connect with buyers and sellers 
                in a secure, moderated environment across all 50 states.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">For Buyers</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/domains" className="hover:text-white">Browse US Domains</Link></li>
                <li><Link href="/register" className="hover:text-white">Create Account</Link></li>
                <li><Link href="/login" className="hover:text-white">Login</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">For Sellers</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/register" className="hover:text-white">List Your Domain</Link></li>
                <li><Link href="/dashboard" className="hover:text-white">Seller Dashboard</Link></li>
                <li><Link href="/domains/new" className="hover:text-white">Add New Domain</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 GeoDomainLand. All rights reserved. | US Geographic Domain Marketplace</p>
          </div>
        </div>
      </footer>
    </div>
  );
}