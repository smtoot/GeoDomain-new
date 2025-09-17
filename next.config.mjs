/** @type {import('next').NextConfig} */
const nextConfig = {
  // Note: All security headers, including CSP, are now managed in `src/middleware.ts`
  // to ensure they are applied correctly and consistently across the application.

  // Security configurations
  poweredByHeader: false,
  compress: true,

  // Image optimization
  images: {
    domains: ['res.cloudinary.com', 'localhost'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: false,
    // The incorrect CSP has been removed from here. It will be handled in middleware.
  },

  // Experimental features for performance and security
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },

  // Redirects for cleaner URLs and security
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/dashboard',
        permanent: false,
      },
      {
        source: '/api/auth/signin',
        destination: '/login',
        permanent: false,
      },
      {
        source: '/api/auth/signout',
        destination: '/logout',
        permanent: false,
      },
    ];
  },

  // Rewrites for internal proxying
  async rewrites() {
    return [
      {
        source: '/api/health',
        destination: '/api/health/check',
      },
    ];
  },
};

export default nextConfig;
