import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    }
  },
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock Next.js server types
jest.mock('next/server', () => ({
  NextRequest: class MockNextRequest {
    constructor(url = 'http://localhost:3000') {
      this.url = url
      this.nextUrl = { pathname: new URL(url).pathname }
      this.headers = new Map()
    }
    
    get(name) {
      return this.headers.get(name) || null
    }
    
    has(name) {
      return this.headers.has(name)
    }
    
    keys() {
      return Array.from(this.headers.keys())
    }
  },
  
  NextResponse: {
    next: () => ({
      headers: new Map(),
      set: jest.fn(),
      setHeader: jest.fn(),
      headers: {
        set: jest.fn()
      }
    }),
    redirect: jest.fn(),
    rewrite: jest.fn(),
    json: jest.fn()
  }
}))

// Mock tRPC - will be mocked in individual test files as needed

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession() {
    return { data: null, status: 'unauthenticated' }
  },
  signIn: jest.fn(),
  signOut: jest.fn(),
}))

// Mock environment variables
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

global.matchMedia = jest.fn().mockImplementation((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}))
