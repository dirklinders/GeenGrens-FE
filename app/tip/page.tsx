'use client';

import useSWR from 'swr';
import { AuthGuard } from '@/components/game/auth-guard';
import { GameHeader } from '@/components/game/game-header';
import { AccusationForm } from '@/components/game/accusation-form';
import { gameApi } from '@/lib/api';

/**
 * Definitive accusation page. The form (selection, confirmation, submission,
 * result) lives in the shared `accusation-form.tsx` so the Onderzoek tab can
 * render the exact same one-shot flow. Submission behavior/API is unchanged:
 * tipApi.submit → TipController (one-shot, server-validated).
 */
function TipContent() {
  const { data: gameStatus, isLoading: statusLoading } = useSWR(
    'game-status-tip',
    () => gameApi.getGameStatus(),
    { revalidateOnFocus: true }
  );

  return (
    <div className="min-h-screen bg-stone-950">
      <GameHeader />

      <main className="py-6 md:py-8 px-4 max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="font-serif text-3xl text-stone-100">Definitieve aanklacht</h1>
          <p className="text-stone-400 text-sm font-serif italic">
            Wie was de dader, welk wapen werd gebruikt, en waar vond de moord plaats?
            Jullie hebben één kans — denk goed na.
          </p>
        </div>

        {gameStatus?.tipSubmitted ? (
          <div className="rounded-md border border-stone-800 bg-stone-900 p-6 text-center font-serif text-stone-400">
            Jullie definitieve aanklacht is al ontvangen. Een tweede inzending is niet mogelijk.
          </div>
        ) : gameStatus?.canSubmitTip ? (
          <AccusationForm variant="page" />
        ) : (
          <p className="text-center text-stone-400">
            {statusLoading ? 'Voortgang controleren...' : 'Bezoek alle locaties en scan daar de NFC tag voordat jullie de definitieve aanklacht kunnen indienen.'}
          </p>
        )}
      </main>
    </div>
  );
}

export default function TipPage() {
  return (
    <AuthGuard>
      <TipContent />
    </AuthGuard>
  );
}
