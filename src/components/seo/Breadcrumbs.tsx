'use client'

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { BreadcrumbStructuredData } from './StructuredData'

interface BreadcrumbItem {
  name: string
  url: string
  current?: boolean
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  showHome?: boolean
  className?: string
}

export default function Breadcrumbs({ items, showHome = true, className = '' }: BreadcrumbsProps) {
  // Add home item if requested
  const allItems = showHome 
    ? [{ name: 'Home', url: '/', current: false }, ...items]
    : items

  // Generate structured data
  const structuredDataItems = allItems.map(item => ({
    name: item.name,
    url: `https://geodomain.com${item.url}`,
  }))

  return (
    <>
      {/* Structured Data for SEO */}
      <BreadcrumbStructuredData items={structuredDataItems} />
      
      {/* Visual Breadcrumbs */}
      <nav className={`flex items-center space-x-1 text-sm text-gray-500 ${className}`} aria-label="Breadcrumb">
        <ol className="flex items-center space-x-1">
          {allItems.map((item, index) => (
            <li key={item.url} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 mx-1 text-gray-400" aria-hidden="true" />
              )}
              
              {item.current ? (
                <span 
                  className="text-gray-900 font-medium"
                  aria-current="page"
                >
                  {item.name === 'Home' ? (
                    <Home className="h-4 w-4" />
                  ) : (
                    item.name
                  )}
                </span>
              ) : (
                <Link
                  href={item.url}
                  className="hover:text-gray-700 transition-colors duration-200"
                >
                  {item.name === 'Home' ? (
                    <Home className="h-4 w-4" />
                  ) : (
                    item.name
                  )}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  )
}

// Predefined breadcrumb configurations for common pages
export const breadcrumbConfigs = {
  // Home page (no breadcrumbs needed)
  home: () => [],

  // About page
  about: () => [
    { name: 'About', url: '/about', current: true },
  ],

  // Contact page
  contact: () => [
    { name: 'Contact', url: '/contact', current: true },
  ],

  // Search page
  search: (query?: string) => [
    { name: 'Search', url: '/search', current: true },
    ...(query ? [{ name: `"${query}"`, url: `/search?q=${encodeURIComponent(query)}`, current: true }] : []),
  ],

  // Domains listing page
  domains: () => [
    { name: 'Domains', url: '/domains', current: true },
  ],

  // Individual domain page
  domain: (domainName: string) => [
    { name: 'Domains', url: '/domains' },
    { name: domainName, url: `/domains/${domainName}`, current: true },
  ],

  // Dashboard pages
  dashboard: () => [
    { name: 'Dashboard', url: '/dashboard', current: true },
  ],

  dashboardDomains: () => [
    { name: 'Dashboard', url: '/dashboard' },
    { name: 'Domains', url: '/dashboard/domains', current: true },
  ],

  dashboardInquiries: () => [
    { name: 'Dashboard', url: '/dashboard' },
    { name: 'Inquiries', url: '/dashboard/inquiries', current: true },
  ],

  dashboardAnalytics: () => [
    { name: 'Dashboard', url: '/dashboard' },
    { name: 'Analytics', url: '/dashboard/analytics', current: true },
  ],

  dashboardSettings: () => [
    { name: 'Dashboard', url: '/dashboard' },
    { name: 'Settings', url: '/dashboard/settings', current: true },
  ],

  // Admin pages
  admin: () => [
    { name: 'Admin', url: '/admin', current: true },
  ],

  adminUsers: () => [
    { name: 'Admin', url: '/admin' },
    { name: 'Users', url: '/admin/users', current: true },
  ],

  adminDomains: () => [
    { name: 'Admin', url: '/admin' },
    { name: 'Domains', url: '/admin/domains', current: true },
  ],

  adminInquiries: () => [
    { name: 'Admin', url: '/admin' },
    { name: 'Inquiries', url: '/admin/inquiries', current: true },
  ],

  adminPayments: () => [
    { name: 'Admin', url: '/admin' },
    { name: 'Payments', url: '/admin/payments', current: true },
  ],

  adminPerformance: () => [
    { name: 'Admin', url: '/admin' },
    { name: 'Performance', url: '/admin/performance', current: true },
  ],

  // Category pages
  category: (categoryName: string) => [
    { name: 'Categories', url: '/categories' },
    { name: categoryName, url: `/categories/${categoryName}`, current: true },
  ],

  // User profile pages
  userProfile: (username: string) => [
    { name: 'Users', url: '/users' },
    { name: username, url: `/users/${username}`, current: true },
  ],

  // Blog/Article pages
  blog: () => [
    { name: 'Blog', url: '/blog', current: true },
  ],

  blogPost: (postTitle: string) => [
    { name: 'Blog', url: '/blog' },
    { name: postTitle, url: `/blog/${postTitle}`, current: true },
  ],

  // FAQ pages
  faq: () => [
    { name: 'FAQ', url: '/faq', current: true },
  ],

  faqCategory: (categoryName: string) => [
    { name: 'FAQ', url: '/faq' },
    { name: categoryName, url: `/faq/${categoryName}`, current: true },
  ],
}

// Utility function to generate breadcrumbs from URL path
export function generateBreadcrumbsFromPath(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)
  
  if (segments.length === 0) return []

  const breadcrumbs: BreadcrumbItem[] = []
  let currentPath = ''

  segments.forEach((segment, index) => {
    currentPath += `/${segment}`
    
    // Convert segment to readable name
    const name = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')

    breadcrumbs.push({
      name,
      url: currentPath,
      current: index === segments.length - 1,
    })
  })

  return breadcrumbs
}

// Utility function to generate breadcrumbs for dynamic routes
export function generateDynamicBreadcrumbs(
  baseConfig: BreadcrumbItem[],
  dynamicItems: Array<{ name: string; url: string; current?: boolean }>
): BreadcrumbItem[] {
  return [
    ...baseConfig.slice(0, -1), // Remove the last item (current page)
    ...dynamicItems,
  ]
}
