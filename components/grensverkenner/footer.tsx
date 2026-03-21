import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-2xl px-4 py-6 text-center text-sm text-muted-foreground">
        {/* The copyright symbol is secretly clickable and leads to the game */}
        <Link 
          href="/game" 
          className="hover:text-accent transition-colors cursor-default"
          title=""
        >
          &copy;
        </Link>
        {' '}2026 GeenGrens / Viktor Vermeer
      </div>
    </footer>
  )
}
