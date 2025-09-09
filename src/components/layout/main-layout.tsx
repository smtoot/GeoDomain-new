"use client"

import { useSession } from "next-auth/react"
import { Header } from "./header"
import { Footer } from "./footer"
import { Sidebar } from "./sidebar"
import { LoadingPage } from "@/components/ui/loading"

interface MainLayoutProps {
  children: React.ReactNode
  showSidebar?: boolean
  showFooter?: boolean
}

export function MainLayout({ 
  children, 
  showSidebar = false, 
  showFooter = true 
}: MainLayoutProps) {
  const { status } = useSession()

  if (status === "loading") {
    return <LoadingPage message="Loading..." />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        {showSidebar && (
          <div className="hidden lg:block">
            <Sidebar />
          </div>
        )}
        
        <main className={cn(
          "flex-1",
          showFooter ? "pb-16" : ""
        )}>
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
      
      {showFooter && <Footer />}
    </div>
  )
}

interface DashboardLayoutProps {
  children: React.ReactNode
  showFooter?: boolean
}

export function DashboardLayout({ children, showFooter = false }: DashboardLayoutProps) {
  console.log('🔍 [DASHBOARD LAYOUT] Rendering DashboardLayout...');
  
  return (
    <div className="min-h-screen bg-gray-50">
      {console.log('🔍 [DASHBOARD LAYOUT] Rendering Header...')}
      <Header />
      
      <div className="flex">
        <div className="hidden lg:block w-56 flex-shrink-0">
          {console.log('🔍 [DASHBOARD LAYOUT] Rendering Sidebar...')}
          <Sidebar />
        </div>
        
        <main className="flex-1 min-w-0">
          <div className="lg:pl-6">
            {console.log('🔍 [DASHBOARD LAYOUT] Rendering children...')}
            {children}
            {console.log('🔍 [DASHBOARD LAYOUT] Children rendered successfully')}
          </div>
        </main>
      </div>
      
      {showFooter && <Footer />}
      {console.log('🔍 [DASHBOARD LAYOUT] DashboardLayout render completed')}
    </div>
  )
}

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <MainLayout showSidebar={false} showFooter={false}>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </MainLayout>
  )
}

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        <div className="hidden lg:block w-56 flex-shrink-0">
          <Sidebar />
        </div>
        
        <main className="flex-1 min-w-0">
          <div className="lg:pl-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

// Helper function for className concatenation
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
