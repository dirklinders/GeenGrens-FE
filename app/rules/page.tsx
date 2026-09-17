'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { useSWRConfig } from 'swr';
import { AuthGuard } from '@/components/game/auth-guard';
import { GameHeader } from '@/components/game/game-header';
import { PaperSheet } from '@/components/game/paper-sheet';
import { gameApi } from '@/lib/api';
import { RULES_SEEN_KEY, markLocalFlowStep } from '@/lib/flow-progress';
import { Button } from '@/components/ui/button';

/** Split a rules text into individual rule lines (numbered or plain) */
function ruleLines(text: string): string[] {
  return text
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);
}

function RulesContent() {
  const router = useRouter();
  const { mutate: globalMutate } = useSWRConfig();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: rules, isLoading } = useSWR(
    'game-rules',
    () => gameApi.getRules(),
    { revalidateOnFocus: false }
  );

  const handleContinue = async () => {
    setIsSubmitting(true);
    // Local fallback first so the flow keeps working when the server cannot
    // persist the flag (e.g. auth-bypass dev mode without a linked team).
    markLocalFlowStep(RULES_SEEN_KEY);
    try {
      await gameApi.markRulesSeen();
      // Keep the cached status flags in sync across pages
      globalMutate('game-status-header');
      globalMutate('game-status-flow');
      globalMutate('game-status-home');
    } catch {
      // No linked team (dev bypass) — the local flag keeps the flow working
    }
    router.push('/game');
  };

  if (isLoading || !rules) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="animate-pulse text-stone-400 font-serif text-lg">
          Laden...
        </div>
      </div>
    );
  }

  const lines = ruleLines(rules.body);
  const introLines = lines.filter(l => !/^\d+\./.test(l));
  const numberedLines = lines.filter(l => /^\d+\./.test(l));

  return (
    <div className="min-h-screen bg-stone-950">
      <GameHeader />

      <main className="py-6 sm:py-12 px-4 max-w-2xl mx-auto">
        <PaperSheet>
          {/* Masthead */}
          <header className="text-center border-b-4 border-double border-stone-800 pb-4 mb-8">
            <p className="text-[10px] md:text-xs tracking-[0.3em] text-stone-600 uppercase">
              Dossier Muntonrecht — Bijlage A
            </p>
            {/* Admin-editable title (GET /api/game/Rules) */}
            <h1 className="font-serif text-3xl md:text-4xl font-bold mt-1">
              {rules.title}
            </h1>
          </header>

          {/* Unnumbered lead-in lines */}
          {introLines.length > 0 && (
            <p className="font-serif italic text-stone-700 mb-6">
              {introLines.join(' ')}
            </p>
          )}

          {/* Numbered rules */}
          <ol className="space-y-4">
            {numberedLines.map((line, i) => {
              const dot = line.indexOf('.');
              const body = line.slice(dot + 1).trim();
              return (
                <li key={i} className="flex gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-stone-900 text-amber-50 font-serif font-bold text-sm flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-stone-800 leading-relaxed">{body}</span>
                </li>
              );
            })}
          </ol>

          {/* Continue to the game — marks the rules as seen (team-scoped, idempotent) */}
          <div className="mt-12 flex flex-col items-center gap-3">
            <p className="text-stone-500 font-serif italic text-sm">
              Eén kans. Zorg dat die telt.
            </p>
            <Button
              onClick={handleContinue}
              disabled={isSubmitting}
              size="lg"
              className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-serif text-lg px-8"
            >
              {isSubmitting ? 'Bezig...' : 'Naar het spel →'}
            </Button>
          </div>
        </PaperSheet>
      </main>
    </div>
  );
}

export default function RulesPage() {
  return (
    <AuthGuard>
      <RulesContent />
    </AuthGuard>
  );
}
