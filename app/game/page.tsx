'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { AuthGuard } from '@/components/game/auth-guard';
import { GameHeader } from '@/components/game/game-header';
import { GameTabs } from '@/components/game/game-tabs';
import { gameApi } from '@/lib/api';
import { INTRO_SEEN_KEY, RULES_SEEN_KEY, localFlowStepSeen } from '@/lib/flow-progress';

/**
 * The main game page: three tabs (Kaart / Logigram / Onderzoek).
 * Flow guard: only reachable once the team has seen the intro (telegram) and
 * the rules — returning teams with both flags set land here directly.
 */
function GameShell() {
  const router = useRouter();

  const { data: status, isLoading } = useSWR(
    'game-status-flow',
    () => gameApi.getGameStatus(),
    { revalidateOnFocus: false }
  );

  useEffect(() => {
    if (!status) return;
    const introSeen = status.introSeen || localFlowStepSeen(INTRO_SEEN_KEY);
    const rulesSeen = status.rulesSeen || localFlowStepSeen(RULES_SEEN_KEY);
    if (!introSeen) router.replace('/intro');
    else if (!rulesSeen) router.replace('/rules');
  }, [status, router]);

  if (isLoading || !status) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="animate-pulse text-stone-400 font-serif text-lg">
          Laden...
        </div>
      </div>
    );
  }

  const introSeen = status.introSeen || localFlowStepSeen(INTRO_SEEN_KEY);
  const rulesSeen = status.rulesSeen || localFlowStepSeen(RULES_SEEN_KEY);

  if (!introSeen || !rulesSeen) {
    // Redirect in progress (see effect above)
    return null;
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
