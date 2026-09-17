'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { useSWRConfig } from 'swr';
import { AuthGuard } from '@/components/game/auth-guard';
import { GameHeader } from '@/components/game/game-header';
import { PaperSheet } from '@/components/game/paper-sheet';
import { gameApi } from '@/lib/api';
import { INTRO_SEEN_KEY, markLocalFlowStep } from '@/lib/flow-progress';
import { Button } from '@/components/ui/button';

function IntroContent() {
  const router = useRouter();
  const { mutate: globalMutate } = useSWRConfig();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: intro, isLoading } = useSWR(
    'game-intro',
    () => gameApi.getIntro(),
    { revalidateOnFocus: false }
  );

  const handleContinue = async () => {
    setIsSubmitting(true);
    // Local fallback first so the flow keeps working when the server cannot
    // persist the flag (e.g. auth-bypass dev mode without a linked team).
    markLocalFlowStep(INTRO_SEEN_KEY);
    try {
      await gameApi.markIntroSeen();
      // Keep the cached status flags in sync across pages
      globalMutate('game-status-header');
      globalMutate('game-status-flow');
      globalMutate('game-status-home');
    } catch {
      // No linked team (dev bypass) — the local flag keeps the flow working
    }
    router.push('/rules');
  };

  if (isLoading || !intro) {
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

      <main className="py-6 sm:py-12 px-4 max-w-2xl mx-auto">
        <PaperSheet>
          {/* Telegram masthead */}
          <header className="text-center border-b-4 border-double border-stone-800 pb-4 mb-8">
            <p className="text-[10px] md:text-xs tracking-[0.3em] text-stone-600 uppercase">
              Centraal Postkantoor — Zutphen
            </p>
            <h1 className="font-mono text-3xl md:text-4xl font-bold tracking-[0.35em] mt-1">
              TELEGRAM
            </h1>
            <p className="text-[10px] md:text-xs tracking-[0.2em] text-stone-600 uppercase mt-2">
              Ontvangen · Vrijdag 24 April 2026 · 21:47
            </p>
          </header>

          {/* Urgency stamp */}
          <div className="relative h-0">
            <span className="absolute -top-10 right-0 rotate-6 border-4 border-red-700 text-red-700 font-mono font-bold text-base md:text-lg tracking-[0.3em] px-3 py-1 rounded-sm opacity-80 select-none">
              URGENT
            </span>
          </div>

          {/* Admin-editable title (GET /api/game/Intro) */}
          <h2 className="font-mono text-lg md:text-xl font-bold text-stone-900 mb-6">
            {intro.title}
          </h2>

          {/* Admin-editable body — typewriter feel, telegram line layout preserved */}
          <div className="font-mono text-sm md:text-base leading-relaxed whitespace-pre-line text-stone-800">
            {intro.body}
          </div>

          {/* Continue to /rules — marks the intro as seen (team-scoped, idempotent) */}
          <div className="mt-12 flex flex-col items-center gap-3">
            <p className="text-stone-500 font-serif italic text-sm">
              De klok tikt. Jullie onderzoek begint nu.
            </p>
            <Button
              onClick={handleContinue}
              disabled={isSubmitting}
              size="lg"
              className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-serif text-lg px-8"
            >
              {isSubmitting ? 'Bezig...' : 'Verder →'}
            </Button>
          </div>
        </PaperSheet>
      </main>
    </div>
  );
}

export default function IntroPage() {
  return (
    <AuthGuard>
      <IntroContent />
    </AuthGuard>
  );
}
