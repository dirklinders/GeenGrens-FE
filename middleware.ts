import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Set NEXT_PUBLIC_ENABLE_DOMAIN_ROUTING=true to enable domain-based routing
// When enabled:
// - game.yourdomain.com routes to /game/*
// - yourdomain.com blocks /game/* routes (returns 404)
const ENABLE_DOMAIN_ROUTING = process.env.NEXT_PUBLIC_ENABLE_DOMAIN_ROUTING === 'true';

export function middleware(request: NextRequest) {
  // Skip if domain routing is disabled
  if (!ENABLE_DOMAIN_ROUTING) {
    return NextResponse.next();
  }

  const hostname = request.headers.get('host') || '';
  const isGameDomain = hostname.startsWith('game.');
  const pathname = request.nextUrl.pathname;

  // Game domain: rewrite root paths to /game
  if (isGameDomain) {
    // Skip if already on /game path or system paths
    if (pathname.startsWith('/game') || pathname.startsWith('/_next') || pathname.startsWith('/api')) {
      return NextResponse.next();
    }
    // Rewrite to /game paths
    const url = request.nextUrl.clone();
    url.pathname = `/game${pathname}`;
    return NextResponse.rewrite(url);
  }

  // Blog domain: block /game routes
  if (pathname.startsWith('/game')) {
    // Return 404 for /game routes on blog domain
    const url = request.nextUrl.clone();
    url.pathname = '/404';
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files and images
    '/((?!_next/static|_next/image|favicon.ico|icon-|apple-icon).*)',
  ],
};
