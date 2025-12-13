import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "../auth.config"; // Import the config we just made
import { db } from "@/lib/db/db";
import { users } from "@/lib/drizzle/schema"; // Adjust path if needed
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig, // Spread the config here
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // 1. Validate input
        if (!credentials?.email || !credentials?.password) return null;

        try {
          // 2. Fetch User (ensure email is string)
          const email = credentials.email as string;
          
          const result = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          const user = result[0];

          if (!user || !user.password) return null;

          // 3. Verify Password
          const passwordsMatch = await bcrypt.compare(
            credentials.password as string, 
            user.password
          );

          if (passwordsMatch) {
            return {
              id: user.id.toString(),
              name: user.name,
              email: user.email,
              role: user.role ?? "user",
            };
          }
          return null;
        } catch (error) {
          console.error("Auth Error:", error);
          return null;
        }
      },
    }),
  ],
});