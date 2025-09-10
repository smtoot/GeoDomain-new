"use client";

import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StandardPageLayout } from "@/components/layout/StandardPageLayout";
import { QueryErrorBoundary } from "@/components/error";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (tokenParam) {
      setToken(tokenParam);
      // Validate token
      validateToken(tokenParam);
    } else {
      setIsValidToken(false);
    }
  }, [searchParams]);

  const validateToken = async (token: string) => {
    try {
      const response = await fetch(`/api/auth/reset-password/validate?token=${token}`);
      if (response.ok) {
        setIsValidToken(true);
      } else {
        setIsValidToken(false);
      }
    } catch {
      setIsValidToken(false);
    }
  };

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        const error = await response.json();
        console.error("Error:", error.message);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidToken === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Validating reset link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isValidToken === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <Lock className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="mt-4 text-2xl font-bold text-gray-900">
              Invalid reset link
            </CardTitle>
            <CardDescription className="mt-2 text-gray-600">
              This password reset link is invalid or has expired. Please request a new one.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button
              onClick={() => router.push("/forgot-password")}
              className="w-full"
            >
              Request new reset link
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Lock className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="mt-4 text-2xl font-bold text-gray-900">
              Password reset successfully
            </CardTitle>
            <CardDescription className="mt-2 text-gray-600">
              Your password has been updated. You can now log in with your new password.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button
              onClick={() => router.push("/login")}
              className="w-full"
            >
              Go to login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <QueryErrorBoundary context="Reset Password Page">
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50">
        {/* Navigation Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <a href="/" className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-gradient-to-r from-red-500 to-blue-500 rounded-full flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                    </svg>
                  </div>
                  <span className="text-xl font-bold text-gray-900">GeoDomainLand</span>
                </a>
              </div>
              <div className="flex items-center space-x-4">
                <a
                  href="/"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Home
                </a>
                <a
                  href="/login"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign In
                </a>
                <a
                  href="/register"
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign Up
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            {/* Header */}
            <div className="text-center">
              <div className="mx-auto h-12 w-12 bg-gradient-to-r from-red-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Reset your password</h2>
              <p className="mt-2 text-sm text-gray-600">
                Enter your new password below
              </p>
            </div>

            {/* Form Card */}
            <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-gray-100">
              <div className="flex items-center mb-6">
                <button
                  onClick={() => router.push("/login")}
                  className="flex items-center text-sm text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to login
                </button>
              </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                New password
              </label>
              <Input
                id="password"
                type="password"
                {...register("password")}
                className="mt-1"
                placeholder="Enter your new password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm new password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                {...register("confirmPassword")}
                className="mt-1"
                placeholder="Confirm your new password"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Resetting..." : "Reset password"}
            </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </QueryErrorBoundary>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
