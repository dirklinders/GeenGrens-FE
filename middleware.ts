import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Domain routing is disabled by default
  // Set ENABLE_DOMAIN_ROUTING=true in your environment to enable
  const enableDomainRouting = process.env.ENABLE_DOMAIN_ROUTING === 'true';
  
  if (!enableDomainRouting) {
    return NextResponse.next();
  }

  const hostname = request.headers.get('host') || '';
  const isGameDomain = hostname.startsWith('game.');
  const pathname = request.nextUrl.pathname;

  // Game domain: rewrite root paths to /game
  if (isGameDomain) {
    if (pathname.startsWith('/game') || pathname.startsWith('/_next') || pathname.startsWith('/api')) {
      return NextResponse.next();
    }
    const url = request.nextUrl.clone();
    url.pathname = `/game${pathname}`;
    return NextResponse.rewrite(url);
  }

  // Blog domain: block /game routes
  if (pathname.startsWith('/game')) {
    return new NextResponse(null, { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
