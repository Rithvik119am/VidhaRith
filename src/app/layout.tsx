import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ConvexClientProvider from "./ConvexClientProvider";
import "./globals.css";
import { Toaster } from "sonner";

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
        <link rel="icon" href="/favicon.ico"></link> 
      </head>
      <body className={inter.className}>
      <Toaster />
        <div className="flex flex-col min-h-screen">
        
          <ConvexClientProvider>
            

            <main>
              {children}
            </main>

          </ConvexClientProvider>
          <footer className="flex justify-center items-center p-4 text-sm text-muted-foreground">
            Made by K. Sai Rithvik Reddy
          </footer>
        </div>
      </body>
    </html>
  );
}