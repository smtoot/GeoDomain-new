import NextAuth from "next-auth/next";
import { authOptions } from "@/lib/security/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

// Add error handling for the API route
export async function OPTIONS() {
  return new Response(null, { status: 200 });
}
