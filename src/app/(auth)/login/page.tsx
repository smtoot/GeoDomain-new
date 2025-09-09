import { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";
import { StandardPageLayout } from "@/components/layout/StandardPageLayout";
import { QueryErrorBoundary } from "@/components/error";

export const metadata: Metadata = {
  title: "Login - GeoDomainLand",
  description: "Login to your GeoDomainLand account",
};

export default function LoginPage() {
  return (
    <QueryErrorBoundary context="Login Page">
      <StandardPageLayout
        title="Sign in to your account"
        description="Access your GeoDomainLand account"
        showHeader={false}
        className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-md w-full space-y-8">
          <div>
            <p className="mt-2 text-center text-sm text-gray-600">
              Or{" "}
              <a
                href="/register"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                create a new account
              </a>
            </p>
          </div>
          <LoginForm />
        </div>
      </StandardPageLayout>
    </QueryErrorBoundary>
  );
}
