import { Header } from "./header"
import { Navigation } from "./navigation"
import { Footer } from "./footer"

interface PageLayoutProps {
  children: React.ReactNode
  tagline?: string
}

export function PageLayout({ children, tagline }: PageLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header tagline={tagline} />
      <Navigation />
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-4 py-8 md:py-12">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  )
}
