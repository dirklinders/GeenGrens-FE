/**
 * MIDDLEWARE FOR PRODUCTION
 * 
 * This file is NOT active in the v0 preview due to sandbox limitations.
 * To use in production:
 * 1. Rename this file to middleware.ts
 * 2. Set ENABLE_DOMAIN_ROUTING=true in your Vercel environment variables
 * 
 * What it does:
 * - Routes game.yourdomain.com/* to /game/*
 * - Blocks /game/* routes on the blog domain (returns 404)
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
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
