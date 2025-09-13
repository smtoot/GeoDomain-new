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
  return (
    <div className="min-h-screen bg-gray-50">
      {}
