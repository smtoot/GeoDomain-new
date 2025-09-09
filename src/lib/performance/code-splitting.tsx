import dynamic from 'next/dynamic'
import React, { Suspense, lazy, ComponentType } from 'react'

// Code splitting configuration
export const CODE_SPLITTING_CONFIG = {
  // Bundle size thresholds
  THRESHOLDS: {
    CRITICAL: 50,    // 50KB - Critical for initial load
    HIGH: 100,       // 100KB - High priority
    MEDIUM: 200,     // 200KB - Medium priority
    LOW: 500,        // 500KB - Low priority
  },
  // Loading strategies
  STRATEGIES: {
    IMMEDIATE: 'immediate',     // Load immediately
    LAZY: 'lazy',              // Load on demand
    PRELOAD: 'preload',        // Preload when idle
    INTERSECTION: 'intersection', // Load when visible
  },
  // Preload triggers
  PRELOAD_TRIGGERS: {
    HOVER: 'hover',
    FOCUS: 'focus',
    INTERSECTION: 'intersection',
    IDLE: 'idle',
  },
}

// Dynamic import wrapper with loading states
export function createLazyComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options: {
    loading?: ComponentType<any>
    ssr?: boolean
    preload?: boolean
    threshold?: number
  } = {}
) {
  const { loading, ssr = true, preload = false, threshold } = options

  const LazyComponent = dynamic(importFunc, {
    ssr,
    loading: loading || (() => <div>Loading...</div>),
  })

  // Add preload capability
  if (preload) {
    LazyComponent.preload = importFunc
  }

  return LazyComponent
}

// Lazy load components with specific loading strategies
export const lazyComponents = {
  // Dashboard components - load on demand
  DashboardAnalytics: createLazyComponent(
    () => import('@/components/dashboard/RealAnalyticsCharts'),
    { ssr: false, preload: true }
  ),
  
  DashboardNotifications: createLazyComponent(
    () => import('@/components/dashboard/RealTimeNotifications'),
    { ssr: false, preload: true }
  ),

  // Form components - load when needed
  DomainForm: createLazyComponent(
    () => import('@/components/forms/DomainForm'),
    { ssr: false }
  ),

  InquiryForm: createLazyComponent(
    () => import('@/components/forms/InquiryForm'),
    { ssr: false }
  ),

  // Modal components - load on demand
  DomainModal: createLazyComponent(
    () => import('@/components/modals/DomainModal'),
    { ssr: false }
  ),

  PaymentModal: createLazyComponent(
    () => import('@/components/modals/PaymentModal'),
    { ssr: false }
  ),

  // Admin components - load when admin role is detected
  AdminDashboard: createLazyComponent(
    () => import('@/components/admin/AdminDashboard'),
    { ssr: false, preload: true }
  ),

  AdminModeration: createLazyComponent(
    () => import('@/components/admin/AdminModeration'),
    { ssr: false, preload: true }
  ),
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  callback: IntersectionObserverCallback,
  options: IntersectionObserverInit = {}
) {
  return {
    observe: (element: Element) => {
      const observer = new IntersectionObserver(callback, {
        root: options.root || null,
        rootMargin: options.rootMargin || '0px',
        threshold: options.threshold || 0.1,
      })
      
      observer.observe(element)
      return observer
    },
  }
}

// Preload manager for intelligent resource loading
export class PreloadManager {
  private preloadQueue: Array<() => Promise<void>> = []
  private isProcessing = false
  private maxConcurrent = 3

  // Add component to preload queue
  addToQueue(preloadFunc: () => Promise<void>): void {
    this.preloadQueue.push(preloadFunc)
    this.processQueue()
  }

  // Process preload queue
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.preloadQueue.length === 0) return

    this.isProcessing = true
    const batch = this.preloadQueue.splice(0, this.maxConcurrent)

    try {
      await Promise.all(batch.map(fn => fn()))
    } catch (error) {
      console.error('Preload error:', error)
    } finally {
      this.isProcessing = false
      
      // Continue processing if there are more items
      if (this.preloadQueue.length > 0) {
        this.processQueue()
      }
    }
  }

  // Preload when idle
  preloadOnIdle(preloadFunc: () => Promise<void>): void {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => this.addToQueue(preloadFunc))
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => this.addToQueue(preloadFunc), 1000)
    }
  }

  // Preload on hover
  preloadOnHover(element: HTMLElement, preloadFunc: () => Promise<void>): void {
    let timeoutId: NodeJS.Timeout

    const handleMouseEnter = () => {
      timeoutId = setTimeout(() => {
        this.addToQueue(preloadFunc)
      }, 100) // Small delay to avoid unnecessary preloading
    }

    const handleMouseLeave = () => {
      clearTimeout(timeoutId)
    }

    element.addEventListener('mouseenter', handleMouseEnter)
    element.addEventListener('mouseleave', handleMouseLeave)

    // Return cleanup function
    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter)
      element.removeEventListener('mouseleave', handleMouseLeave)
      clearTimeout(timeoutId)
    }
  }

  // Get queue status
  getStatus() {
    return {
      queueLength: this.preloadQueue.length,
      isProcessing: this.isProcessing,
      maxConcurrent: this.maxConcurrent,
    }
  }
}

export const preloadManager = new PreloadManager()

// Bundle analyzer utilities
export const bundleAnalysis = {
  // Estimate bundle size impact
  estimateSize: (importPath: string): Promise<number> => {
    return new Promise((resolve) => {
      // This is a placeholder - in a real implementation,
      // you would use webpack-bundle-analyzer or similar tools
      const estimatedSize = Math.random() * 100 + 50 // 50-150KB estimate
      resolve(estimatedSize)
    })
  },

  // Get bundle optimization recommendations
  getOptimizationTips: (bundleSize: number): string[] => {
    const tips: string[] = []

    if (bundleSize > CODE_SPLITTING_CONFIG.THRESHOLDS.CRITICAL) {
      tips.push('Consider code splitting for large components')
    }

    if (bundleSize > CODE_SPLITTING_CONFIG.THRESHOLDS.HIGH) {
      tips.push('Use lazy loading for non-critical components')
    }

    if (bundleSize > CODE_SPLITTING_CONFIG.THRESHOLDS.MEDIUM) {
      tips.push('Implement tree shaking to remove unused code')
    }

    return tips
  },
}

// Performance monitoring for code splitting
export class CodeSplittingMonitor {
  private loadTimes: Map<string, number> = new Map()
  private bundleSizes: Map<string, number> = new Map()

  recordLoadTime(componentName: string, loadTime: number): void {
    this.loadTimes.set(componentName, loadTime)
  }

  recordBundleSize(componentName: string, size: number): void {
    this.bundleSizes.set(componentName, size)
  }

  getMetrics() {
    return {
      loadTimes: Object.fromEntries(this.loadTimes),
      bundleSizes: Object.fromEntries(this.bundleSizes),
      averageLoadTime: this.getAverageLoadTime(),
      totalBundleSize: this.getTotalBundleSize(),
    }
  }

  private getAverageLoadTime(): number {
    const times = Array.from(this.loadTimes.values())
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0
  }

  private getTotalBundleSize(): number {
    return Array.from(this.bundleSizes.values()).reduce((a, b) => a + b, 0)
  }

  reset(): void {
    this.loadTimes.clear()
    this.bundleSizes.clear()
  }
}

export const codeSplittingMonitor = new CodeSplittingMonitor()

// Export all utilities
export {
  CODE_SPLITTING_CONFIG,
  createLazyComponent,
  lazyComponents,
  useIntersectionObserver,
  PreloadManager,
  preloadManager,
  bundleAnalysis,
  CodeSplittingMonitor,
  codeSplittingMonitor,
}
