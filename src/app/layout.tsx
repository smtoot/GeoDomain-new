import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/session-provider";
import { TRPCProvider } from "@/components/providers/trpc-provider";
import { Toaster } from "react-hot-toast";
import { pageMetadata, structuredData } from "@/lib/seo";
import { OrganizationStructuredData, WebsiteStructuredData } from "@/components/seo/StructuredData";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Generate comprehensive metadata for the root layout
export const metadata: Metadata = pageMetadata.home();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Additional meta tags for better SEO */}
        <meta name="author" content="GeoDomain" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="msapplication-TileColor" content="#ffffff" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="GeoDomain" />
        
        {/* Favicon and app icons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS prefetch for performance */}
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        <link rel="dns-prefetch" href="//www.googletagmanager.com" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        {/* Structured Data for SEO */}
        <OrganizationStructuredData
          data={{
            name: "GeoDomain",
            url: "https://geodomain.com",
            logo: "https://geodomain.com/logo.png",
            description: "Premium domain marketplace for businesses and investors",
            contactPoint: {
              telephone: "+1-555-0123",
              contactType: "customer service",
              email: "support@geodomain.com",
            },
            sameAs: [
              "https://twitter.com/geodomain",
              "https://linkedin.com/company/geodomain",
              "https://facebook.com/geodomain",
            ],
          }}
        />
        
        <WebsiteStructuredData
          data={{
            name: "GeoDomain",
            url: "https://geodomain.com",
            description: "Premium domain marketplace",
            potentialAction: {
              "@type": "SearchAction",
              target: "https://geodomain.com/search?q={search_term_string}",
              "query-input": "required name=search_term_string",
            },
          }}
        />

        <ErrorBoundary>
          <TRPCProvider>
            <AuthProvider>
              {children}
              <Toaster position="top-right" />
            </AuthProvider>
          </TRPCProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
