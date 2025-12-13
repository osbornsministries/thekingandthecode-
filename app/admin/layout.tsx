import type { Metadata } from "next";
import { auth } from "@/auth"; // Import the server-side auth function
import AuthProvider from "@/components/providers/AuthProvider"; // Import your new component
import "../globals.css";

export const metadata: Metadata = {
  title: "King & Code",
  description: "Event Management System",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 1. Fetch session on the server
  const session = await auth();

  return (
    <>
        {/* 2. Pass session to the provider */}
        <AuthProvider session={session}>
          {children}
        </AuthProvider>
    </>
  );
}