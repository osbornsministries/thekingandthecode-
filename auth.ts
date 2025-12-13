import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { db } from "@/lib/db/db";
import { users } from "@/lib/drizzle/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
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

        const email = credentials.email as string;
        const passwordInput = credentials.password as string;

        // 🛑 TEMPORARY BYPASS FOR DEVELOPMENT 🛑
        // This check allows 'admin@gmail.com' / 'admin123' to sign in without
        // checking the database or password hash.
        if (email.toLowerCase() === "admin@gmail.com" && passwordInput === "admin123") {
          console.log("--- DEVELOPMENT BYPASS ACTIVATED ---");
          // Return a temporary user object to authorize the session
          return {
            id: "temp-admin-id", // Use a unique ID for the temp user
            name: "Temp Admin",
            email: email,
            role: "admin",
          };
        }
        // 🛑 END TEMPORARY BYPASS 🛑

        try {
          // 2. Fetch User (Optimized to select only necessary fields)
          const result = await db
            .select({
              id: users.id,
              name: users.name,
              email: users.email,
              password: users.password,
              role: users.role,
            })
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          const user = result[0];

          // Check if user exists AND has a password hash saved
          if (!user || !user.password) {
            console.log("Authorization Failed: User not found or no password hash.");
            return null; 
          }

          // 3. Verify Password
          const passwordsMatch = await bcrypt.compare(
            passwordInput,
            user.password
          );

          if (passwordsMatch) {
            // SUCCESS: Return the actual user object
            return {
              id: user.id.toString(),
              name: user.name,
              email: user.email,
              role: user.role ?? "user",
            };
          }
          
          // 4. Failed password check
          console.log("Authorization Failed: Password mismatch.");
          return null; 
          
        } catch (error) {
          console.error("Auth Error (Database/Bcrypt issue):", error);
          return null; 
        }
      },
    }),
  ],
});