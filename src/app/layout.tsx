import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { ClerkProvider } from "@clerk/nextjs";
import { Nav } from "@/components/layout/nav";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Footer } from "@/components/layout/footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import { WeightUnitProvider } from "@/contexts/WeightUnitContext";
import { Toaster } from "sonner";

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Volume - Workout Tracker",
  description: "Simple workout tracking app for tracking sets, reps, and weight",
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
    icon: [
      { url: "/icon", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read nonce from middleware for CSP
  const nonce = (await headers()).get("x-nonce");

  return (
    <ClerkProvider>
      <html
        lang="en"
        suppressHydrationWarning
        className={ibmPlexMono.variable}
        nonce={nonce || undefined}
      >
        <body className="antialiased bg-terminal-bg pb-20 md:pb-12">
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
          <Toaster
            position="bottom-right"
            theme="dark"
            toastOptions={{
              style: {
                background: "var(--terminal-bg-secondary)",
                border: "1px solid var(--terminal-border)",
                color: "var(--terminal-text)",
              },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
