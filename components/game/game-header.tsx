'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { useAuth } from '@/lib/auth-context';
import { gameApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface GameHeaderProps {
  showMobileMenu?: boolean;
  mobileMenuContent?: React.ReactNode;
  mobileMenuOpen?: boolean;
  onMobileMenuChange?: (open: boolean) => void;
}

export function GameHeader({
  showMobileMenu = false,
  mobileMenuContent,
  mobileMenuOpen,
  onMobileMenuChange,
}: GameHeaderProps) {
  const { user, logout } = useAuth();
  const [navOpen, setNavOpen] = useState(false);

  const { data: gameStatus } = useSWR(
    'game-status-header',
    () => gameApi.getGameStatus(),
    { revalidateOnFocus: false }
  );

  const canAccessChat = gameStatus?.canAccessChat ?? false;
  const canSubmitTip  = gameStatus?.canSubmitTip  ?? false;
  const isPlaytest    = gameStatus?.isPlaytest    ?? false;
  const isUnlocked    = gameStatus?.isUnlocked    ?? false;

  // Nav links shared between desktop inline and mobile sheet
  const navItems = [
    isPlaytest && isUnlocked ? { href: '/notebook', label: '📓 Notitieboek', accent: 'amber' } : null,
    canAccessChat            ? { href: '/chat',     label: 'Onderzoek',       accent: 'stone' } : null,
    canSubmitTip             ? { href: '/tip',      label: 'Meld dader',      accent: 'stone' } : null,
    user?.isAdmin            ? { href: '/admin',    label: 'Admin',           accent: 'red'   } : null,
  ].filter(Boolean) as { href: string; label: string; accent: string }[];

  const accentClass = (accent: string) =>
    accent === 'amber' ? 'text-amber-600 hover:text-amber-400'
    : accent === 'red'  ? 'text-red-700 hover:text-red-500 font-medium'
    :                     'text-stone-400 hover:text-stone-100';

  return (
    <header className="bg-stone-900 border-b border-stone-800 sticky top-0 z-50">
      {/* ── Main header row ── */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between gap-2">

        {/* LEFT: character-selector hamburger (chat page, mobile only) + logo */}
        <div className="flex items-center gap-2 min-w-0">
          {showMobileMenu && mobileMenuContent && (
            <Sheet open={mobileMenuOpen} onOpenChange={onMobileMenuChange}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden text-stone-400 flex-shrink-0 h-9 w-9"
                  aria-label="Verdachten"
                >
                  {/* Person icon */}
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </Button>
              </SheetTrigger>
              {/* Full-width sheet on mobile for character list */}
              <SheetContent side="left" className="p-0 w-full sm:w-80 bg-stone-900 border-stone-800">
                <VisuallyHidden>
                  <SheetTitle>Verdachten</SheetTitle>
                </VisuallyHidden>
                {mobileMenuContent}
              </SheetContent>
            </Sheet>
          )}

          <Link href="/" className="font-serif text-lg sm:text-xl text-stone-100 truncate">
            GeenGrens
          </Link>
        </div>

        {/* RIGHT: desktop nav + mobile nav hamburger */}
        <div className="flex items-center gap-1">
          {/* Desktop nav (hidden on mobile) */}
          {navItems.length > 0 && (
            <nav className="hidden md:flex items-center gap-5 mr-2">
              {navItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`transition-colors text-sm ${accentClass(item.accent)}`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}

          {/* Mobile nav hamburger (always visible on mobile when there are nav items) */}
          {navItems.length > 0 && (
            <Sheet open={navOpen} onOpenChange={setNavOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden text-stone-400 flex-shrink-0 h-9 w-9"
                  aria-label="Menu"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 bg-stone-900 border-stone-800 flex flex-col">
                <SheetTitle className="font-serif text-stone-100 text-xl mb-6">Menu</SheetTitle>

                {/* Nav links */}
                <nav className="flex flex-col gap-1 flex-1">
                  {navItems.map(item => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setNavOpen(false)}
                      className={`px-3 py-3 rounded-lg transition-colors text-base ${accentClass(item.accent)} hover:bg-stone-800`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>

                {/* User info + logout at bottom */}
                <div className="border-t border-stone-800 pt-4 space-y-3">
                  <div className="px-3 space-y-1">
                    {user?.teamName && (
                      <p className="text-amber-600 font-medium text-sm truncate">{user.teamName}</p>
                    )}
                    <p className="text-stone-500 text-xs truncate">{user?.name || user?.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setNavOpen(false); logout(); }}
                    className="w-full text-stone-400 hover:text-stone-100 hover:bg-stone-800 justify-start px-3"
                  >
                    Uitloggen
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          )}

          {/* Logout button on desktop (shown in subheader, but keep accessible) */}
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="hidden md:inline-flex text-stone-500 hover:text-stone-100 hover:bg-stone-800 text-xs h-8"
          >
            Uitloggen
          </Button>
        </div>
      </div>

      {/* ── Subheader: team + user info (desktop only; on mobile it's in the sheet) ── */}
      <div className="bg-stone-950/50 border-t border-stone-800/50">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-1.5 flex items-center gap-3 min-w-0">
          {user?.teamName && (
            <span className="text-amber-600 font-medium text-xs truncate">{user.teamName}</span>
          )}
          <span className="text-stone-500 text-xs truncate hidden sm:inline">
            {user?.name || user?.email}
          </span>
          {/* On mobile show user initial to save space */}
          <span className="text-stone-500 text-xs sm:hidden">
            {(user?.name || user?.email || '').charAt(0).toUpperCase()}
          </span>
        </div>
      </div>
    </header>
  );
}
