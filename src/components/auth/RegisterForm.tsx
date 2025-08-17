"use client";

import { useState } from "react";
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

  const {
    register,
    handleSubmit,
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Full Name
        </label>
        <Input
          id="name"
          type="text"
          autoComplete="name"
          {...register("name")}
          className={`mt-1 ${errors.name ? "border-red-500" : ""}`}
          placeholder="Enter your full name"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email address
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          {...register("email")}
          className={`mt-1 ${errors.email ? "border-red-500" : ""}`}
          placeholder="Enter your email"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700">
          I want to
        </label>
        <div className="mt-2 space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              value="BUYER"
              {...register("role")}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Buy domains</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="SELLER"
              {...register("role")}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Sell domains</span>
          </label>
        </div>
        {errors.role && (
          <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          {...register("password")}
          className={`mt-1 ${errors.password ? "border-red-500" : ""}`}
          placeholder="Create a password"
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Confirm Password
        </label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          {...register("confirmPassword")}
          className={`mt-1 ${errors.confirmPassword ? "border-red-500" : ""}`}
          placeholder="Confirm your password"
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
        )}
      </div>

      <div className="space-y-3">
        <label className="flex items-start">
          <input
            type="checkbox"
            {...register("acceptTerms")}
            className="mt-1 mr-2"
          />
          <span className="text-sm text-gray-700">
            I accept the{" "}
            <a href="/terms" className="text-blue-600 hover:text-blue-500">
              Terms of Service
            </a>
          </span>
        </label>
        {errors.acceptTerms && (
          <p className="text-sm text-red-600">{errors.acceptTerms.message}</p>
        )}

        <label className="flex items-start">
          <input
            type="checkbox"
            {...register("acceptPrivacy")}
            className="mt-1 mr-2"
          />
          <span className="text-sm text-gray-700">
            I accept the{" "}
            <a href="/privacy" className="text-blue-600 hover:text-blue-500">
              Privacy Policy
            </a>
          </span>
        </label>
        {errors.acceptPrivacy && (
          <p className="text-sm text-red-600">{errors.acceptPrivacy.message}</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}
