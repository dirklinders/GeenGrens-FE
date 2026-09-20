'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { AuthGuard } from '@/components/game/auth-guard';
import { GameHeader } from '@/components/game/game-header';
import { NewspaperHeadline } from '@/components/game/newspaper-headline';
import { PaperSheet } from '@/components/game/paper-sheet';
import { gameApi, SpeluitlegDTO } from '@/lib/api';
import { Button } from '@/components/ui/button';

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
 * Single game landing page: newspaper, case background and rules.
 */
function SpeluitlegContent() {
  const { data: speluitleg, isLoading } = useSWR(
    'speluitleg',
    () => gameApi.getSpeluitleg(),
    { revalidateOnFocus: false }
  );

  const { data: rules, isLoading: rulesLoading } = useSWR(
    'game-rules',
    () => gameApi.getRules(),
    { revalidateOnFocus: false }
  );

  if (isLoading || rulesLoading || !speluitleg || !rules) {
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
          <PaperSheet>
            <header className="border-b-4 border-double border-stone-800 pb-4 mb-6">
              <p className="text-[10px] md:text-xs text-stone-600 uppercase tracking-[0.2em]">
                Dossier Muntonrecht — Persbericht Z
              </p>
              <h1 className="font-serif text-3xl md:text-4xl font-bold mt-2">
                {story.title || 'De Zaak Thieme'}
              </h1>
              <p className="text-stone-700 font-serif text-sm italic mt-2">
                Cold case · Oproep aan het publiek
              </p>
            </header>
            <div className="space-y-4">
              {paragraphs(story.backstory).map((p, i) => (
                <p key={i} className="text-stone-800 leading-relaxed font-serif">
                  {p}
                </p>
              ))}
            </div>
          </PaperSheet>
        </section>

        {/* Speluitleg / regels — same paper layout as the former rules page */}
        <section className="max-w-2xl mx-auto">
          <PaperSheet>
            <header className="text-center border-b-4 border-double border-stone-800 pb-4 mb-8">
              <p className="text-[10px] md:text-xs tracking-[0.3em] text-stone-600 uppercase">
                Dossier Muntonrecht — Bijlage A
              </p>
              <h2 className="font-serif text-3xl md:text-4xl font-bold mt-1">
                {rules.title}
              </h2>
            </header>

            {ruleLines(rules.body).filter(line => !/^\d+\./.test(line)).length > 0 && (
              <p className="font-serif italic text-stone-700 mb-6">
                {ruleLines(rules.body).filter(line => !/^\d+\./.test(line)).join(' ')}
              </p>
            )}

              <ol className="space-y-4">
                {ruleLines(rules.body)
                  .filter(l => /^\d+\./.test(l))
                  .map((line, i) => {
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
          </PaperSheet>
        </section>

        {/* The game is directly accessible; there is no onboarding lock. */}
        <section className="max-w-2xl mx-auto text-center pb-8">
          <p className="text-stone-400 font-serif italic mb-5">
            Middernacht nadert. Het onderzoek begint nu.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-serif text-lg px-8"
          >
            <Link href="/game">
              Start het onderzoek →
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
