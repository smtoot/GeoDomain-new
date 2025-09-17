import { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";
import { QueryErrorBoundary } from "@/components/error";

export const metadata: Metadata = {
  title: "Login - GeoDomainLand",
  description: "Login to your GeoDomainLand account",
};

export default function LoginPage() {
  return (
    <QueryErrorBoundary context="Login Page">
      <div className="space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-gradient-to-r from-red-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Welcome back</h2>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to your GeoDomainLand account
            </p>
          </div>

          {/* Login Form Card */}
          <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-gray-100">
            <LoginForm />
            
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">New to GeoDomainLand?</span>
                </div>
              </div>

              <div className="mt-6">
                <a
                  href="/register"
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  Create your account
                </a>
              </div>
            </div>
            </div>

            {/* Footer Links */}
            <div className="text-center">
              <a
                href="/forgot-password"
                className="text-sm text-gray-600 hover:text-red-500 transition-colors"
              >
                Forgot your password?
              </a>
        </div>
        </div>
    </QueryErrorBoundary>
  );
}
