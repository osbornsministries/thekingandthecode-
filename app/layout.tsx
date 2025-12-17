import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";


export const metadata: Metadata = {
  title: "TheKingandthecode",
  description: "
The King & The Code is a stage play production by Pastor Tony Osborn Ministries featuring a Swahili drama accompanied with live music, spoken word, dance numbers and so much more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
       
      >
        {children}
      </body>
    </html>
  );
}
