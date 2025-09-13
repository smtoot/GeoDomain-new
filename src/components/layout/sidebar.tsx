"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { trpc } from "@/lib/trpc"
import { 
  Home, 
  Globe, 
  MessageSquare, 
  Settings, 
  BarChart3, 
  Users, 
  Shield,
  DollarSign,
  FileText,
  Bell,
  Search,
  Heart,
  ShoppingCart,
  Plus
} from "lucide-react"

interface SidebarItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const userRole = (session?.user as any)?.role || "BUYER"
  const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN"
  const isSeller = userRole === "SELLER"

  // Fetch inquiry count for sellers with proper caching
  const { data: inquiryCountResponse } = trpc.inquiries.getSellerInquiryCount.useQuery(
    undefined,
    { 
      enabled: isSeller && !!session?.user,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false
    }
  )

  // Extract data from tRPC response structure - ensure we get the actual data
  const inquiryCount = inquiryCountResponse?.json || inquiryCountResponse?.data || inquiryCountResponse
  
  // Safety check to ensure inquiryCount has the expected structure
  const safeInquiryCount = inquiryCount && typeof inquiryCount === 'object' && 'total' in inquiryCount 
    ? inquiryCount 
    : { total: 0 }

  // Buyer-specific navigation
  const buyerNavigation: SidebarItem[] = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
    },
    {
      name: "Browse Domains",
      href: "/domains",
      icon: Search,
    },
    {
      name: "Saved Domains",
      href: "/dashboard/saved",
      icon: Heart,
    },
    {
      name: "Purchase History",
      href: "/dashboard/purchases",
      icon: ShoppingCart,
    },
    {
      name: "My Inquiries",
      href: "/dashboard/inquiries",
      icon: MessageSquare,
    },
    {
      name: "Support",
      href: "/support",
      icon: MessageSquare,
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ]

  // Seller-specific navigation
  const sellerNavigation: SidebarItem[] = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
    },
    {
      name: "My Domains",
      href: "/dashboard/domains",
      icon: Globe,
    },
    {
      name: "Wholesale",
      href: "/dashboard/wholesale",
      icon: ShoppingCart,
    },
    {
      name: "Add Domain",
      href: "/domains/new",
      icon: Plus,
    },
    {
      name: "Deals",
      href: "/dashboard/deals",
      icon: DollarSign,
    },
    {
      name: "Inquiries",
      href: "/dashboard/inquiries",
      icon: MessageSquare,
      badge: safeInquiryCount?.total && safeInquiryCount.total > 0 ? safeInquiryCount.total.toString() : undefined,
    },
    {
      name: "Support",
      href: "/support",
      icon: MessageSquare,
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ]

  // Admin-specific navigation
  const adminNavigation: SidebarItem[] = [
    {
      name: "Admin Dashboard",
      href: "/admin",
      icon: Shield,
    },
    {
      name: "User Management",
      href: "/admin/users",
      icon: Users,
    },
    {
      name: "Domain Moderation",
      href: "/admin/domains",
      icon: Globe,
    },
    {
      name: "Inquiry Moderation",
      href: "/admin/inquiries",
      icon: MessageSquare,
      badge: "12",
    },
    {
      name: "Support Management",
      href: "/admin/support",
      icon: MessageSquare,
    },
    {
      name: "Wholesale Management",
      href: "/admin/wholesale",
      icon: ShoppingCart,
    },
    {
      name: "Message Moderation",
      href: "/admin/messages",
      icon: FileText,
      badge: "5",
    },
    {
      name: "Deal Management",
      href: "/admin/deals",
      icon: DollarSign,
    },
    {
      name: "Payment Verification",
      href: "/admin/payments",
      icon: DollarSign,
      badge: "8",
    },
    {
      name: "System Analytics",
      href: "/admin/analytics",
      icon: BarChart3,
    },
    {
      name: "Notifications",
      href: "/admin/notifications",
      icon: Bell,
    },
  ]

  // Determine which navigation to show based on user role
  let currentNavigation: SidebarItem[]
  if (isAdmin) {
    currentNavigation = adminNavigation
  } else if (isSeller) {
    currentNavigation = sellerNavigation
  } else {
    // Default to buyer navigation
    currentNavigation = buyerNavigation
  }

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200">
      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {currentNavigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0",
                  isActive ? "text-primary-foreground" : "text-gray-400 group-hover:text-gray-500"
                )}
              />
              <span className="flex-1">{item.name}</span>
              {item.badge && (
                <span className="ml-auto inline-flex items-center rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User Info */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-sm font-medium text-primary-foreground">
                {(session?.user?.name || session?.user?.email || "U")[0].toUpperCase()}
              </span>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">
              {session?.user?.name || "User"}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {userRole.toLowerCase()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
