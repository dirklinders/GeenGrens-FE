import type { Metadata } from 'next'
import { Libre_Baskerville, Inter, Caveat } from 'next/font/google'
import { AuthProvider } from '@/lib/auth-context'
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
  title: 'GeenGrens - Murder Mystery',
  description: 'Ontdek de waarheid achter de mysterieuze dood van Viktor Vermeer',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="nl">
      <body className={`${inter.variable} ${libreBaskerville.variable} ${caveat.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
