'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { AuthGuard } from '@/components/game/auth-guard';
import { SecretMessage } from '@/components/game/secret-message';
import { NotebookReveal } from '@/components/game/notebook-reveal';
import { useAuth } from '@/lib/auth-context';
import { gameApi } from '@/lib/api';
import { Button } from '@/components/ui/button';

function GameHomeContent() {
  const { user, logout } = useAuth();
  const [notebookLocation, setNotebookLocation] = useState<string | null>(null);

  // Check if game is already unlocked
  const { data: gameStatus, isLoading: statusLoading } = useSWR(
    'game-status',
    () => gameApi.getGameStatus(),
    { revalidateOnFocus: false }
  );

  // Set notebook location if already unlocked
  useEffect(() => {
    if (gameStatus?.isUnlocked && gameStatus?.notebookLocation) {
      setNotebookLocation(gameStatus.notebookLocation);
    }
  }, [gameStatus]);

  const handlePasswordSuccess = (location: string) => {
    setNotebookLocation(location);
  };

  // Show loading while checking status
  if (statusLoading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="animate-pulse text-stone-400 font-serif text-lg">
          Laden...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950">
      {/* Header */}
      <header className="bg-stone-900 border-b border-stone-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/game" className="font-serif text-xl text-stone-100">
            GeenGrens
          </Link>
          <nav className="flex items-center gap-4 md:gap-6">
            <Link 
              href="/game/chat" 
              className="text-stone-400 hover:text-stone-100 transition-colors text-sm"
            >
              Onderzoek
            </Link>
            <Link 
              href="/game/unlock" 
              className="text-stone-400 hover:text-stone-100 transition-colors text-sm"
            >
              Codes
            </Link>
            <Link 
              href="/game/tip" 
              className="text-stone-400 hover:text-stone-100 transition-colors text-sm"
            >
              Meld dader
            </Link>
            <div className="hidden md:flex items-center gap-4">
              <span className="text-stone-500 text-sm">
                {user?.name || user?.email}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={logout}
                className="text-stone-400 hover:text-stone-100 hover:bg-stone-800"
              >
                Uitloggen
              </Button>
            </div>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="py-8 md:py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {notebookLocation ? (
            <NotebookReveal location={notebookLocation} />
          ) : (
            <SecretMessage onSuccess={handlePasswordSuccess} />
          )}
        </div>
      </main>
    </div>
  );
}

export default function GameHomePage() {
  return (
    <AuthGuard>
      <GameHomeContent />
    </AuthGuard>
  );
}
