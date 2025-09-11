"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  role: z.enum(["BUYER", "SELLER"]),
  acceptTerms: z.boolean().refine((val) => val === true, "You must accept the terms"),
  acceptPrivacy: z.boolean().refine((val) => val === true, "You must accept the privacy policy"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  // Redirect if already logged in
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      console.log('🔍 [REGISTER FORM] User already authenticated, redirecting...', {
        user: session.user.email,
        role: (session.user as any).role
      });
      
      // Redirect based on user role
      if ((session.user as any).role === 'ADMIN' || (session.user as any).role === 'SUPER_ADMIN') {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    }
  }, [session, status, router]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "BUYER",
      acceptTerms: false,
      acceptPrivacy: false,
    },
  });

  // const selectedRole = watch("role");

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          role: data.role,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Registration successful! Please check your email to verify your account.");
        router.push("/login");
      } else {
        toast.error(result.message || "Registration failed");
      }
    } catch {
      toast.error("An error occurred during registration");
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking session
  if (status === 'loading') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render form if user is already authenticated (will redirect)
  if (status === 'authenticated') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Full Name
        </label>
        <Input
          id="name"
          type="text"
          autoComplete="name"
          {...register("name")}
          className={`h-12 px-4 text-base ${errors.name ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-red-500 focus:ring-red-500"}`}
          placeholder="Enter your full name"
        />
        {errors.name && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.name.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email address
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          {...register("email")}
          className={`h-12 px-4 text-base ${errors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-red-500 focus:ring-red-500"}`}
          placeholder="Enter your email"
        />
        {errors.email && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          I want to
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
            watch("role") === "BUYER" 
              ? "border-red-500 bg-red-50" 
              : "border-gray-200 hover:border-gray-300"
          }`}>
            <input
              type="radio"
              value="BUYER"
              {...register("role")}
              className="sr-only"
            />
            <div className="flex items-center">
              <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                watch("role") === "BUYER" 
                  ? "border-red-500 bg-red-500" 
                  : "border-gray-300"
              }`}>
                {watch("role") === "BUYER" && (
                  <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                )}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Buy domains</div>
                <div className="text-xs text-gray-500">Find and purchase</div>
              </div>
            </div>
          </label>
          
          <label className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
            watch("role") === "SELLER" 
              ? "border-red-500 bg-red-50" 
              : "border-gray-200 hover:border-gray-300"
          }`}>
            <input
              type="radio"
              value="SELLER"
              {...register("role")}
              className="sr-only"
            />
            <div className="flex items-center">
              <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                watch("role") === "SELLER" 
                  ? "border-red-500 bg-red-500" 
                  : "border-gray-300"
              }`}>
                {watch("role") === "SELLER" && (
                  <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                )}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Sell domains</div>
                <div className="text-xs text-gray-500">List and sell</div>
              </div>
            </div>
          </label>
        </div>
        {errors.role && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.role.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
          Password
        </label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          {...register("password")}
          className={`h-12 px-4 text-base ${errors.password ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-red-500 focus:ring-red-500"}`}
          placeholder="Create a password"
        />
        {errors.password && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.password.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
          Confirm Password
        </label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          {...register("confirmPassword")}
          className={`h-12 px-4 text-base ${errors.confirmPassword ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-red-500 focus:ring-red-500"}`}
          placeholder="Confirm your password"
        />
        {errors.confirmPassword && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <label className="flex items-start">
          <input
            type="checkbox"
            {...register("acceptTerms")}
            className="mt-1 mr-3 h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
          />
          <span className="text-sm text-gray-700">
            I accept the{" "}
            <a href="/terms" className="text-red-600 hover:text-red-500 font-medium">
              Terms of Service
            </a>
          </span>
        </label>
        {errors.acceptTerms && (
          <p className="text-sm text-red-600 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.acceptTerms.message}
          </p>
        )}

        <label className="flex items-start">
          <input
            type="checkbox"
            {...register("acceptPrivacy")}
            className="mt-1 mr-3 h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
          />
          <span className="text-sm text-gray-700">
            I accept the{" "}
            <a href="/privacy" className="text-red-600 hover:text-red-500 font-medium">
              Privacy Policy
            </a>
          </span>
        </label>
        {errors.acceptPrivacy && (
          <p className="text-sm text-red-600 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.acceptPrivacy.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-12 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium text-base rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Creating account...
          </div>
        ) : (
          "Create account"
        )}
      </Button>
    </form>
  );
}
