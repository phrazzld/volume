import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { ClerkProvider } from "@clerk/nextjs";
import { Nav } from "@/components/layout/nav";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Footer } from "@/components/layout/footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import { WeightUnitProvider } from "@/contexts/WeightUnitContext";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Volume - Workout Tracker",
  description:
    "Simple workout tracking app for tracking sets, reps, and weight",
  applicationName: "Volume",
  authors: [{ name: "Volume" }],
  generator: "Next.js",
  keywords: ["workout", "fitness", "tracker", "volume", "training"],
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f5" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  icons: {
    icon: [{ url: "/icon", type: "image/png" }],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning className={inter.variable}>
        <body className="antialiased font-sans pb-20 md:pb-12">
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <WeightUnitProvider>
              <ConvexClientProvider>
                <Nav />
                {children}
                <Footer />
                {/* Bottom navigation - mobile only */}
                <div className="md:hidden">
                  <BottomNav />
                </div>
              </ConvexClientProvider>
            </WeightUnitProvider>
          </ThemeProvider>
          <Toaster position="bottom-right" />
        </body>
      </html>
    </ClerkProvider>
  );
}
