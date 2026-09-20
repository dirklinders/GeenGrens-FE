'use client';

import { AuthGuard } from '@/components/game/auth-guard';
import { GameHeader } from '@/components/game/game-header';
import { GameTabs } from '@/components/game/game-tabs';

/**
 * The main game page: three tabs (Kaart / Logigram / Onderzoek).
 */
function GameShell() {
  return (
    <div className="min-h-screen bg-stone-950 flex flex-col">
      <GameHeader />
      <main className="flex-1 w-full max-w-4xl mx-auto py-6 md:py-8 px-4">
        <GameTabs />
      </main>
    </div>
  );
}

export default function GamePage() {
  return (
    <AuthGuard>
      <GameShell />
    </AuthGuard>
  );
}
