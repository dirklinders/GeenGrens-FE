'use client';

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
  onMobileMenuChange
}: GameHeaderProps) {
  const { user, logout } = useAuth();
  
  // Fetch game status for conditional navigation
  const { data: gameStatus } = useSWR(
    'game-status-header',
    () => gameApi.getGameStatus(),
    { revalidateOnFocus: false }
  );

  const canAccessChat = gameStatus?.canAccessChat ?? false;
  const canSubmitTip = gameStatus?.canSubmitTip ?? false;
  const isPlaytest = gameStatus?.isPlaytest ?? false;

  return (
    <header className="bg-stone-900 border-b border-stone-800 sticky top-0 z-50">
      {/* Main header row */}
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          {showMobileMenu && mobileMenuContent && (
            <Sheet open={mobileMenuOpen} onOpenChange={onMobileMenuChange}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-stone-400">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72 bg-stone-900 border-stone-800">
                <VisuallyHidden>
                  <SheetTitle>Navigatie</SheetTitle>
                </VisuallyHidden>
                {mobileMenuContent}
              </SheetContent>
            </Sheet>
          )}
          
          <Link href="/game" className="font-serif text-xl text-stone-100">
            GeenGrens
          </Link>
        </div>
        
        <nav className="flex items-center gap-4 md:gap-6">
          {isPlaytest && (
            <Link
              href="/game/notebook"
              className="text-amber-600 hover:text-amber-400 transition-colors text-sm"
              title="Digitale playtestversie van het notitieboek"
            >
              📓 Notitieboek
            </Link>
          )}
          {canAccessChat && (
            <Link
              href="/game/chat"
              className="text-stone-400 hover:text-stone-100 transition-colors text-sm"
            >
              Onderzoek
            </Link>
          )}
          {canSubmitTip && (
            <Link
              href="/game/tip"
              className="text-stone-400 hover:text-stone-100 transition-colors text-sm"
            >
              Meld dader
            </Link>
          )}
          {user?.isAdmin && (
            <Link
              href="/game/admin"
              className="text-red-700 hover:text-red-500 transition-colors text-sm font-medium"
            >
              Admin
            </Link>
          )}
        </nav>
      </div>

      {/* Subheader with team info, user name and logout */}
      <div className="bg-stone-950/50 border-t border-stone-800/50">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm">
            {user?.teamName && (
              <span className="text-amber-600 font-medium">
                {user.teamName}
              </span>
            )}
            <span className="text-stone-500">
              {user?.name || user?.email}
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={logout}
            className="text-stone-500 hover:text-stone-100 hover:bg-stone-800 text-xs h-7"
          >
            Uitloggen
          </Button>
        </div>
      </div>
    </header>
  );
}
