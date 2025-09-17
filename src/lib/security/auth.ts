import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "../prisma";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          // Check if Prisma is available
          if (!prisma) {
            return null;
          }

          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          });

          if (!user || !user.password) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            return null;
          }

          // Check if user is active and email is verified
          if (user.status !== 'ACTIVE') {
            return null;
          }

          if (!user.emailVerified) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            status: user.status,
          };
        } catch (error) {
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 0, // Force session update on every request to fix mismatch
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  callbacks: {
    async jwt({ token, user }: any) {
      try {
        if (user) {
          token.id = user.id;
          token.role = user.role;
          token.status = user.status;
        }
        return token;
      } catch (error) {
        console.error('JWT callback error:', error);
        return token;
      }
    },
    async session({ session, token }: any) {
      try {
        if (token) {
          // Ensure session user data matches token data
          session.user.id = token.id || token.sub!;
          session.user.role = token.role as string;
          session.user.status = token.status as string;
          
          // Add additional token data to session for consistency
          (session.user as any).tokenId = token.id;
          (session.user as any).tokenRole = token.role;
          (session.user as any).tokenStatus = token.status;
        }
        return session;
      } catch (error) {
        console.error('Session callback error:', error);
        return session;
      }
    },
    async redirect({ url, baseUrl }: any) {
      try {
        // If the url is relative, prefix it with the base url
        if (url.startsWith("/")) {
          const redirectUrl = `${baseUrl}${url}`;
          return redirectUrl;
        }
        // If the url is on the same origin, allow it
        else if (new URL(url).origin === baseUrl) {
          return url;
        }
        return baseUrl;
      } catch (error) {
        console.error('Redirect callback error:', error);
        return baseUrl;
      }
    }
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-development",
  // Use dynamic URL for Vercel deployments
  ...(process.env.VERCEL_URL && {
    url: `https://${process.env.VERCEL_URL}`,
  }),
  debug: process.env.NODE_ENV === 'development', // Only enable debug in development
  logger: {
    error(code: string, metadata?: any) {
      },
    warn(code: string) {
      },
    debug(code: string, metadata?: any) {
      }
  },
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = async () => {
  try {
    const { getServerSession } = await import("next-auth/next");
    return await getServerSession(authOptions);
  } catch (error) {
    return null;
  }
};
