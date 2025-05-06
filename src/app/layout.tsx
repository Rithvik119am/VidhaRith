import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ConvexClientProvider from "./ConvexClientProvider";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import "./globals.css";
import Header from "./Header";
import { Toaster } from "@/components/ui/toaster";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Informal",
  description: "Make forms with Convex and Love",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="https://zany.sh/favicon.svg?emoji=📋"></link>
      </head>
      <body className={inter.className}>
        <div className="flex flex-col min-h-screen">
        <ConvexClientProvider>
        
        <main >
        
        {children}
        </main>
        <Toaster />
        </ConvexClientProvider>
        <footer className="flex justify-center items-center">Made by K. Sai Rithvik Reddy</footer>
        <div className="flex justify-center items-center p-3">  </div>
        </div>
        </body>
    </html>
  );
}
