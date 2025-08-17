// NextAuth type declarations

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: string;
      status: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    role: string;
    status: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    status: string;
  }
}
