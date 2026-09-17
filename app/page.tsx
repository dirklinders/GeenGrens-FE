'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { AuthGuard } from '@/components/game/auth-guard';
import { GameHeader } from '@/components/game/game-header';
import { NewspaperHeadline } from '@/components/game/newspaper-headline';
import { gameApi, SpeluitlegDTO } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/** Split a multi-paragraph text into paragraphs (blank-line separated) */
function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean);
}

/** Split a rules text into individual rule lines (numbered or plain) */
function ruleLines(text: string): string[] {
  return text
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);
}

/**
 * Landing page: newspaper + achtergrond + speluitleg. Always viewable —
 * this page is NEVER redirected away from, regardless of flow progress.
 * Only the CTA adapts to progress: teams that finished onboarding get a
 * direct route into the game, new teams start the flow at /intro.
 */
function SpeluitlegContent() {
  const { data: speluitleg, isLoading } = useSWR(
    'speluitleg',
    () => gameApi.getSpeluitleg(),
    { revalidateOnFocus: false }
  );

  const { data: status } = useSWR(
    'game-status-home',
    () => gameApi.getGameStatus(),
    { revalidateOnFocus: false }
  );

  // Progress only changes the CTA below — it never redirects this page away.
  const onboardingDone = Boolean(status?.introSeen && status?.rulesSeen);

  if (isLoading || !speluitleg) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="animate-pulse text-stone-400 font-serif text-lg">
          Laden...
        </div>
      </div>
    );
  }

  const story: SpeluitlegDTO = speluitleg;

  return (
    <div className="min-h-screen bg-stone-950">
      <GameHeader />

      {/* Main content */}
      <main className="py-8 md:py-12 px-4 space-y-10">
        {/* Het nieuws: de moord */}
        <NewspaperHeadline />

        {/* Het verhaal / achtergrond */}
        <section className="max-w-2xl mx-auto">
          <Card className="bg-stone-900 border-stone-800">
            <CardHeader>
              <CardTitle className="font-serif text-2xl text-stone-100">
                {story.title || 'De Zaak-Muntonrecht'}
              </CardTitle>
              <p className="text-amber-600 font-serif text-sm uppercase tracking-widest">
                Achtergrond
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {paragraphs(story.backstory).map((p, i) => (
                <p key={i} className="text-stone-300 leading-relaxed font-serif">
                  {p}
                </p>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* Speluitleg / regels */}
        <section className="max-w-2xl mx-auto">
          <Card className="bg-stone-900 border-stone-800">
            <CardHeader>
              <CardTitle className="font-serif text-2xl text-stone-100">
                Zo speel je
              </CardTitle>
              <p className="text-amber-600 font-serif text-sm uppercase tracking-widest">
                Speluitleg
              </p>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                {ruleLines(story.rules)
                  .filter(l => /^\d+\./.test(l))
                  .map((line, i) => {
                    const dot = line.indexOf('.');
                    const body = line.slice(dot + 1).trim();
                    return (
                      <li key={i} className="flex gap-3">
                        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-600/20 border border-amber-700/50 text-amber-500 font-serif font-bold text-sm flex items-center justify-center">
                          {i + 1}
                        </span>
                        <span className="text-stone-300 leading-relaxed">{body}</span>
                      </li>
                    );
                  })}
              </ol>

              {/* Persistent entry point to the full speluitleg (/rules) —
                  reachable at any time, also after onboarding is complete */}
              <div className="mt-6 text-center">
                <Link
                  href="/rules"
                  className="text-amber-600 hover:text-amber-400 font-serif text-sm underline underline-offset-4 transition-colors"
                >
                  Volledige speluitleg bekijken →
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA — new teams start the flow at the detective's telegram;
            returning teams jump straight back into the game. The homepage
            itself never redirects. */}
        <section className="max-w-2xl mx-auto text-center pb-8">
          <p className="text-stone-400 font-serif italic mb-5">
            {onboardingDone
              ? 'Het onderzoek wacht. Jullie sporen zijn bewaard.'
              : 'Middernacht nadert. Het onderzoek begint nu.'}
          </p>
          <Button
            asChild
            size="lg"
            className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-serif text-lg px-8"
          >
            <Link href={onboardingDone ? '/game' : '/intro'}>
              {onboardingDone ? 'Naar het spel →' : 'Start het onderzoek →'}
            </Link>
          </Button>
        </section>
      </main>
    </div>
  );
}

export default function GameHomePage() {
  return (
    <AuthGuard>
      <SpeluitlegContent />
    </AuthGuard>
  );
}
