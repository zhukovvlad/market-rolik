import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner"; // <--- 1. Импорт

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Market-Rolik | AI Video Generator",
  description: "Create viral videos for marketplaces",
};

import { AuthProvider } from "@/components/auth/AuthProvider"; // <--- Import

// ...

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}