import { ReactNode } from "react";
import { Header } from "@/components/layout/header";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50">
      {/* Use the main header for consistency */}
      <Header />
      
      {/* Main content area */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
