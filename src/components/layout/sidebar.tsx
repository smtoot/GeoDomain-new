"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
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
  Bell
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

  const isAdmin = (session?.user as any)?.role === "ADMIN"

  const navigation: SidebarItem[] = [
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
      name: "Inquiries",
      href: "/dashboard/inquiries",
      icon: MessageSquare,
      badge: "3",
    },
    {
      name: "Analytics",
      href: "/dashboard/analytics",
      icon: BarChart3,
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ]

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

  const currentNavigation = isAdmin ? adminNavigation : navigation

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-gray-200">
        <Link href="/" className="flex items-center space-x-2">
          <Globe className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold text-gray-900">GeoDomainLand</span>
        </Link>
      </div>

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
                  ? "bg-primary text-white"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0",
                  isActive ? "text-white" : "text-gray-400 group-hover:text-gray-500"
                )}
              />
              <span className="flex-1">{item.name}</span>
              {item.badge && (
                <span
                  className={cn(
                    "ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full",
                    isActive
                      ? "bg-white text-primary"
                      : "bg-primary text-white"
                  )}
                >
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
              <span className="text-sm font-medium text-white">
                {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || "U"}
              </span>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">
              {session?.user?.name || session?.user?.email}
            </p>
            <p className="text-xs text-gray-500 capitalize">
                             {(session?.user as any)?.role?.toLowerCase() || "user"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
