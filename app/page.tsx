'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { AuthGuard } from '@/components/game/auth-guard';
import { SecretMessage } from '@/components/game/secret-message';
import { NotebookReveal } from '@/components/game/notebook-reveal';
import { GameHeader } from '@/components/game/game-header';
import { gameApi } from '@/lib/api';

function GameHomeContent() {
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
      <GameHeader />

      {/* Main content */}
      <main className="py-8 md:py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {notebookLocation ? (
            <NotebookReveal location={notebookLocation} isPlaytest={gameStatus?.isPlaytest ?? false} />
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
