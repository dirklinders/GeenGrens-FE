import Link from 'next/link';

interface FooterProps {
  showSecretLink?: boolean;
}

export function Footer({ showSecretLink = false }: FooterProps) {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-2xl px-4 py-6 text-center text-sm text-muted-foreground">
        {showSecretLink ? (
          <Link 
            href="/game" 
            className="hover:text-accent transition-colors cursor-default"
            title=""
          >
            &copy;
          </Link>
        ) : (
          <span>&copy;</span>
        )}
        {' '}2026 GeenGrens / Viktor Vermeer
      </div>
    </footer>
  )
}
