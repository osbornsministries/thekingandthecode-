import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    // 1. Middleware Logic: Who can access what?
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAdmin = nextUrl.pathname.startsWith('/admin');
      const isOnLogin = nextUrl.pathname.startsWith('/admin/login');

      if (isOnAdmin) {
        if (isOnLogin) {
            // If logged in and trying to login, go to dashboard
            if (isLoggedIn) return Response.redirect(new URL('/admin/dashboard', nextUrl));
            return true; 
        }
        // Admin pages require login
        return isLoggedIn;
      }
      return true;
    },

    // 2. Add Role and ID to Token
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },

    // 3. Expose Role and ID to Session
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  providers: [], // Keep empty here!
} satisfies NextAuthConfig;