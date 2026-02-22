import React from "react"
import type { Metadata, Viewport } from "next";
import { Comic_Neue, Patrick_Hand } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";

import "./globals.css";

const comicNeue = Comic_Neue({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-comic-neue",
});

const patrickHand = Patrick_Hand({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-patrick-hand",
});

export const metadata: Metadata = {
  title: "Creative Writing Studio - Drama & Poetry",
  description:
    "A fun creative writing app for kids to build dramas, write poetry, and express themselves with AI help!",
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${comicNeue.variable} ${patrickHand.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
