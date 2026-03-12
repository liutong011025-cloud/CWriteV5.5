import type React from 'react'
import type { Metadata } from 'next'
import { Geist, Geist_Mono, Comic_Neue, Patrick_Hand, Caveat, Baloo_2 } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/sonner'
import HeaderWrapper from '@/components/header-wrapper'
import Footer from '@/components/footer'
import './globals.css'

const geist = Geist({ subsets: ["latin"], variable: '--font-geist' });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: '--font-geist-mono' });
const comicNeue = Comic_Neue({ 
  weight: ['300', '400', '700'],
  subsets: ["latin"],
  variable: '--font-comic-neue'
});
const patrickHand = Patrick_Hand({ 
  weight: ['400'],
  subsets: ["latin"],
  variable: '--font-patrick-hand'
});
const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
});
const baloo2 = Baloo_2({
  subsets: ["latin"],
  variable: "--font-baloo",
});

export const metadata: Metadata = {
  title: 'CWrite',
  description: 'Create magical stories with AI assistance',
  generator: 'MuseAI',
  icons: {
    icon: '/logosmall.png',
    apple: '/logosmall.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${comicNeue.variable} ${patrickHand.variable} ${geist.variable} ${geistMono.variable} ${caveat.variable} ${baloo2.variable} font-sans antialiased flex flex-col min-h-screen bg-cover bg-center bg-no-repeat`}
        style={{
          backgroundImage: "url('/firstmap.png')",
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <HeaderWrapper />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
