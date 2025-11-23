import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner"; // <--- 1. Импорт

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Market-Rolik | AI Video Generator",
  description: "Create viral videos for marketplaces",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster /> {/* <--- 2. Вставка компонента */}
      </body>
    </html>
  );
}