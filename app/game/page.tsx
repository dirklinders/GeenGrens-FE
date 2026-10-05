'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/game/auth-guard';
import { GameHeader } from '@/components/game/game-header';
import { GameTabs } from '@/components/game/game-tabs';
import { useAuth } from '@/lib/auth-context';

/**
 * The main game page: three tabs (Kaart / Logigram / Onderzoek).
 */
function GameShell() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user?.teamLocked && !user?.isAdmin) router.replace('/lobby');
  }, [isLoading, router, user?.isAdmin, user?.teamLocked]);

  if (isLoading || (!user?.teamLocked && !user?.isAdmin)) {
    return <div className="min-h-screen bg-stone-950" />;
  }

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
