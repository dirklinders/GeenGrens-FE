import type { Metadata } from 'next'
import { Libre_Baskerville, Inter, Caveat } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-serif"
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans"
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-handwritten"
});

export const metadata: Metadata = {
  title: 'Grensverkenner - Observaties van Viktor Vermeer',
  description: 'Ontdek de fascinerende wereld van Baarle-Nassau en Baarle-Hertog, de meest complexe grensstructuur ter wereld.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="nl">
      <body className={`${inter.variable} ${libreBaskerville.variable} ${caveat.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
