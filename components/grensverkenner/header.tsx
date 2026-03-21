import Link from "next/link"

interface HeaderProps {
  tagline?: string
}

export function Header({ tagline = "Observaties van Viktor Vermeer" }: HeaderProps) {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto max-w-2xl px-4 py-6 text-center">
        <Link href="/" className="inline-block">
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Grensverkenner
          </h1>
        </Link>
        <p className="mt-1 text-sm text-muted-foreground">{tagline}</p>
      </div>
    </header>
  )
}
