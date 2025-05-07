import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ConvexClientProvider from "./ConvexClientProvider";
// ClerkProvider is imported but not fully used in this snippet, keeping it as is
// import { ClerkProvider, useAuth } from "@clerk/clerk-react";
// import { ConvexProviderWithClerk } from "convex/react-clerk";
import "./globals.css";
// Header is imported but not used in the provided snippet, keeping it as is
// import Header from "./Header";
import { Toaster } from "sonner"; // Assuming this is the shadcn/sonner wrapper

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VidhaRith",
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
        <link rel="icon" href="/favicon.ico"></link> {/* Added a basic favicon link */}
      </head>
      <body className={inter.className}>
      <Toaster />
        <div className="flex flex-col min-h-screen">
        
          <ConvexClientProvider>
            {/* Moved Toaster here, before the main content */}
            

            <main>
              {children}
            </main>

          </ConvexClientProvider>
          <footer className="flex justify-center items-center p-4 text-sm text-muted-foreground">
            Made by K. Sai Rithvik Reddy
          </footer>
          {/* Removed the empty div */}
        </div>
      </body>
    </html>
  );
}