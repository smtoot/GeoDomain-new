"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"

interface BreadcrumbItem {
  name: string
  href: string
  current?: boolean
}

export function BreadcrumbNavigation() {
  const pathname = usePathname()
  
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split('/').filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = [
      { name: 'Home', href: '/' }
    ]

    let currentPath = ''
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`
      const name = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
      
      breadcrumbs.push({
        name,
        href: currentPath,
        current: index === segments.length - 1
      })
    })

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {breadcrumbs.map((item, index) => (
          <li key={item.href} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
            )}
            <Link
              href={item.href}
              className={cn(
                "text-sm font-medium transition-colors",
                item.current
                  ? "text-gray-900 cursor-default"
                  : "text-gray-500 hover:text-gray-700"
              )}
              aria-current={item.current ? "page" : undefined}
            >
              {index === 0 ? (
                <Home className="h-4 w-4" />
              ) : (
                item.name
              )}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  )
}

interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  breadcrumbs?: boolean
}

export function PageHeader({ title, description, actions, breadcrumbs = true }: PageHeaderProps) {
  return (
    <div className="mb-8">
      {breadcrumbs && (
        <div className="mb-4">
          <BreadcrumbNavigation />
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {description && (
            <p className="mt-2 text-sm text-gray-600">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center space-x-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}

interface TabNavigationProps {
  tabs: {
    name: string
    href: string
    current: boolean
    badge?: string
  }[]
}

export function TabNavigation({ tabs }: TabNavigationProps) {
  return (
    <nav className="flex space-x-8 border-b border-gray-200">
      {tabs.map((tab) => (
        <Link
          key={tab.name}
          href={tab.href}
          className={cn(
            "flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors",
            tab.current
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          )}
          aria-current={tab.current ? "page" : undefined}
        >
          {tab.name}
          {tab.badge && (
            <span
              className={cn(
                "ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                tab.current
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-900"
              )}
            >
              {tab.badge}
            </span>
          )}
        </Link>
      ))}
    </nav>
  )
}
