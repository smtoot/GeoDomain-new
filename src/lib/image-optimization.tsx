import Image from 'next/image'
import React, { useState, useEffect, useRef, useCallback } from 'react'

// Image optimization configuration
export const IMAGE_OPTIMIZATION_CONFIG = {
  // Quality settings
  QUALITY: {
    HIGH: 90,
    MEDIUM: 75,
    LOW: 50,
    THUMBNAIL: 30,
  },
  // Format priorities
  FORMATS: {
    WEBP: 'webp',
    AVIF: 'avif',
    JPEG: 'jpeg',
    PNG: 'png',
  },
  // Responsive breakpoints
  BREAKPOINTS: {
    MOBILE: 640,
    TABLET: 1024,
    DESKTOP: 1280,
    LARGE: 1920,
  },
  // Lazy loading settings
  LAZY_LOADING: {
    THRESHOLD: 0.1,
    ROOT_MARGIN: '50px',
    DEBOUNCE_DELAY: 100,
  },
  // Preload settings
  PRELOAD: {
    ENABLED: true,
    CRITICAL_IMAGES: ['logo', 'hero', 'favicon'],
    VIEWPORT_THRESHOLD: 0.5,
  },
}

// Image size presets for different use cases
export const IMAGE_SIZES = {
  THUMBNAIL: { width: 150, height: 150 },
  SMALL: { width: 300, height: 200 },
  MEDIUM: { width: 600, height: 400 },
  LARGE: { width: 1200, height: 800 },
  HERO: { width: 1920, height: 1080 },
  AVATAR: { width: 64, height: 64 },
  ICON: { width: 32, height: 32 },
} as const

// Responsive image sizes for different breakpoints
export const RESPONSIVE_SIZES = {
  MOBILE: [320, 480, 640],
  TABLET: [768, 1024],
  DESKTOP: [1280, 1440, 1920],
  ALL: [320, 480, 640, 768, 1024, 1280, 1440, 1920],
} as const

// Image optimization utilities
export class ImageOptimizer {
  // Generate responsive srcSet
  static generateSrcSet(
    src: string,
    sizes: number[] = RESPONSIVE_SIZES.ALL,
    format: string = IMAGE_OPTIMIZATION_CONFIG.FORMATS.WEBP
  ): string {
    return sizes
      .map(size => `${src}?w=${size}&f=${format} ${size}w`)
      .join(', ')
  }

  // Generate sizes attribute for responsive images
  static generateSizes(breakpoints: typeof RESPONSIVE_SIZES.ALL): string {
    return breakpoints
      .map((size, index) => {
        if (index === 0) return `${size}px`
        if (index === breakpoints.length - 1) return `(min-width: ${breakpoints[index - 1]}px) ${size}px`
        return `(min-width: ${breakpoints[index - 1]}px) ${size}px`
      })
      .join(', ')
  }

  // Optimize image URL with parameters
  static optimizeUrl(
    url: string,
    options: {
      width?: number
      height?: number
      quality?: number
      format?: string
      fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
    } = {}
  ): string {
    const params = new URLSearchParams()
    
    if (options.width) params.append('w', options.width.toString())
    if (options.height) params.append('h', options.height.toString())
    if (options.quality) params.append('q', options.quality.toString())
    if (options.format) params.append('f', options.format)
    if (options.fit) params.append('fit', options.fit)

    return params.toString() ? `${url}?${params.toString()}` : url
  }

  // Get optimal image format based on browser support
  static getOptimalFormat(): string {
    // In a real implementation, you would check browser support
    // For now, we'll return WebP as it has good support
    return IMAGE_OPTIMIZATION_CONFIG.FORMATS.WEBP
  }

  // Calculate optimal quality based on image size
  static getOptimalQuality(width: number, height: number): number {
    const pixels = width * height
    
    if (pixels < 100000) return IMAGE_OPTIMIZATION_CONFIG.QUALITY.HIGH
    if (pixels < 500000) return IMAGE_OPTIMIZATION_CONFIG.QUALITY.MEDIUM
    if (pixels < 1000000) return IMAGE_OPTIMIZATION_CONFIG.QUALITY.LOW
    return IMAGE_OPTIMIZATION_CONFIG.QUALITY.THUMBNAIL
  }
}

// Lazy loading hook for images
export function useLazyImage(
  src: string,
  options: {
    threshold?: number
    rootMargin?: string
    fallback?: string
  } = {}
) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const {
    threshold = IMAGE_OPTIMIZATION_CONFIG.LAZY_LOADING.THRESHOLD,
    rootMargin = IMAGE_OPTIMIZATION_CONFIG.LAZY_LOADING.ROOT_MARGIN,
    fallback = '/placeholder-image.jpg',
  } = options

  // Intersection Observer for lazy loading
  useEffect(() => {
    const img = imgRef.current
    if (!img) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.unobserve(img)
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(img)
    return () => observer.unobserve(img)
  }, [threshold, rootMargin])

  // Load image when in view
  useEffect(() => {
    if (!isInView) return

    const img = new window.Image()
    
    img.onload = () => setIsLoaded(true)
    img.onerror = () => setError('Failed to load image')
    
    img.src = src
  }, [isInView, src])

  return {
    ref: imgRef,
    isLoaded,
    isInView,
    error,
    src: isInView ? src : fallback,
  }
}

// Optimized Image component with lazy loading
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  quality = IMAGE_OPTIMIZATION_CONFIG.QUALITY.MEDIUM,
  priority = false,
  placeholder = 'blur',
  blurDataURL,
  sizes,
  className,
  ...props
}: {
  src: string
  alt: string
  width: number
  height: number
  quality?: number
  priority?: boolean
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  sizes?: string
  className?: string
  [key: string]: any
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  const handleLoad = useCallback(() => {
    setIsLoading(false)
  }, [])

  const handleError = useCallback(() => {
    setError(true)
    setIsLoading(false)
  }, [])

  // Generate optimized image URL
  const optimizedSrc = ImageOptimizer.optimizeUrl(src, {
    width,
    height,
    quality,
    format: ImageOptimizer.getOptimalFormat(),
  })

  // Generate responsive sizes if not provided
  const responsiveSizes = sizes || ImageOptimizer.generateSizes(RESPONSIVE_SIZES.ALL)

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-200 text-gray-500 ${className}`}
        style={{ width, height }}
      >
        <span>Failed to load image</span>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <Image
        src={optimizedSrc}
        alt={alt}
        width={width}
        height={height}
        quality={quality}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        sizes={responsiveSizes}
        onLoad={handleLoad}
        onError={handleError}
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        {...props}
      />
      
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
    </div>
  )
}

// Background image component with optimization
export function OptimizedBackgroundImage({
  src,
  alt,
  children,
  className = '',
  ...props
}: {
  src: string
  alt: string
  children: React.ReactNode
  className?: string
  [key: string]: any
}) {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const img = new window.Image()
    img.onload = () => setIsLoaded(true)
    img.src = src
  }, [src])

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      {...props}
    >
      {/* Background image */}
      <div
        className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          backgroundImage: `url(${src})`,
        }}
        role="img"
        aria-label={alt}
      />
      
      {/* Loading placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

// Image preloader for critical images
export function ImagePreloader({
  images,
  onComplete,
}: {
  images: string[]
  onComplete?: () => void
}) {
  const [loadedCount, setLoadedCount] = useState(0)
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    if (images.length === 0) {
      onComplete?.()
      return
    }

    const loadImage = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const img = new window.Image()
        img.onload = () => resolve()
        img.onerror = () => reject(new Error(`Failed to load ${src}`))
        img.src = src
      })
    }

    const preloadImages = async () => {
      const promises = images.map(src => 
        loadImage(src)
          .then(() => {
            setLoadedCount(prev => prev + 1)
          })
          .catch(error => {
            setErrors(prev => [...prev, error.message])
            setLoadedCount(prev => prev + 1)
          })
      )

      await Promise.allSettled(promises)
      onComplete?.()
    }

    preloadImages()
  }, [images, onComplete])

  return null // This component doesn't render anything
}

// Export all utilities and components
export {
  IMAGE_OPTIMIZATION_CONFIG,
  IMAGE_SIZES,
  RESPONSIVE_SIZES,
  ImageOptimizer,
  useLazyImage,
  OptimizedImage,
  OptimizedBackgroundImage,
  ImagePreloader,
}
