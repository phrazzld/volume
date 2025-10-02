import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Volume - Workout Tracker",
  description: "Simple workout tracking app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
