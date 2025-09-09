import { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { StandardPageLayout } from "@/components/layout/StandardPageLayout";
import { QueryErrorBoundary } from "@/components/error";

export const metadata: Metadata = {
  title: "Register - GeoDomainLand",
  description: "Create your GeoDomainLand account",
};

export default function RegisterPage() {
  return (
    <QueryErrorBoundary context="Register Page">
      <StandardPageLayout
        title="Create your account"
        description="Join GeoDomainLand and start trading domains"
        showHeader={false}
        className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-md w-full space-y-8">
          <div>
            <p className="mt-2 text-center text-sm text-gray-600">
              Or{" "}
              <a
                href="/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                sign in to your existing account
              </a>
            </p>
          </div>
          <RegisterForm />
        </div>
      </StandardPageLayout>
    </QueryErrorBoundary>
  );
}
