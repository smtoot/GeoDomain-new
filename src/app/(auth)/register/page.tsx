import { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { QueryErrorBoundary } from "@/components/error";

export const metadata: Metadata = {
  title: "Register - GeoDomainLand",
  description: "Create your GeoDomainLand account",
};

export default function RegisterPage() {
  return (
    <QueryErrorBoundary context="Register Page">
      <div className="space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-gradient-to-r from-red-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Join GeoDomainLand</h2>
            <p className="mt-2 text-sm text-gray-600">
              Create your account and start trading domains
            </p>
          </div>

          {/* Register Form Card */}
          <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-gray-100">
            <RegisterForm />
            
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Already have an account?</span>
                </div>
              </div>

              <div className="mt-6">
                <a
                  href="/login"
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  Sign in to your account
                </a>
              </div>
            </div>
            </div>

            {/* Footer Links */}
            <div className="text-center text-xs text-gray-500">
              By creating an account, you agree to our{" "}
              <a href="/terms" className="text-red-500 hover:text-red-600">Terms of Service</a>
              {" "}and{" "}
              <a href="/privacy" className="text-red-500 hover:text-red-600">Privacy Policy</a>
        </div>
      </div>
    </QueryErrorBoundary>
  );
}
