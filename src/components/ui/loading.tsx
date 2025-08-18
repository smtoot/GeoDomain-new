import * as React from "react"
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg"
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ className, size = "md", ...props }, ref) => {
    const sizeClasses = {
      sm: "h-4 w-4",
      md: "h-6 w-6",
      lg: "h-8 w-8",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "animate-spin rounded-full border-2 border-current border-t-transparent",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        <span className="sr-only">Loading...</span>
      </div>
    )
  }
)
LoadingSpinner.displayName = "LoadingSpinner"

interface LoadingDotsProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg"
}

const LoadingDots = React.forwardRef<HTMLDivElement, LoadingDotsProps>(
  ({ className, size = "md", ...props }, ref) => {
    const sizeClasses = {
      sm: "h-1 w-1",
      md: "h-2 w-2",
      lg: "h-3 w-3",
    }

    return (
      <div
        ref={ref}
        className={cn("flex space-x-1", className)}
        {...props}
      >
        <div
          className={cn(
            "animate-bounce rounded-full bg-current",
            sizeClasses[size]
          )}
          style={{ animationDelay: "0ms" }}
        />
        <div
          className={cn(
            "animate-bounce rounded-full bg-current",
            sizeClasses[size]
          )}
          style={{ animationDelay: "150ms" }}
        />
        <div
          className={cn(
            "animate-bounce rounded-full bg-current",
            sizeClasses[size]
          )}
          style={{ animationDelay: "300ms" }}
        />
      </div>
    )
  }
)
LoadingDots.displayName = "LoadingDots"

interface LoadingSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

const LoadingSkeleton = React.forwardRef<HTMLDivElement, LoadingSkeletonProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "animate-pulse rounded-md bg-muted",
          className
        )}
        {...props}
      />
    )
  }
)
LoadingSkeleton.displayName = "LoadingSkeleton"

interface LoadingPageProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string
}

const LoadingPage = React.forwardRef<HTMLDivElement, LoadingPageProps>(
  ({ className, message = "Loading...", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex min-h-[400px] w-full items-center justify-center",
          className
        )}
        {...props}
      >
        <div className="flex flex-col items-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    )
  }
)
LoadingPage.displayName = "LoadingPage"

export { LoadingSpinner, LoadingDots, LoadingSkeleton, LoadingPage }
