'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { AuthGuard } from '@/components/game/auth-guard';
import { GameHeader } from '@/components/game/game-header';
import { NewspaperHeadline } from '@/components/game/newspaper-headline';
import { PaperSheet } from '@/components/game/paper-sheet';
import { gameApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';

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

const STORY_TITLE = 'De Zaak Lawerman';

const STORY_BACKSTORY = `In 2001 werd het lichaam van Foppe Lawerman in Zutphen uit het water gehaald. Er waren nauwelijks aanknopingspunten. Nu de onderzoekstermijn van 25 jaar voor deze cold case bijna verstreken is, doet de politie een laatste oproep aan het publiek: help de zaak op te lossen.

De moord vond plaats om precies 00:00 uur in de nacht van 10 oktober 2001. Zeven mogelijke moordlocaties, zeven verdachten — van wie één nergens bij naam wordt genoemd — en zeven mogelijke moordwapens. Vul in het logigram in waar iedereen zich om 00:00 uur bevond en welk mogelijk wapen diegene bij zich droeg. Misschien komt de moordenaar zo vanzelf aan het licht.

De politie heeft alle informatie vrijgegeven die zij wettelijk mag delen. De dossiers liggen klaar. Het onderzoek is aan jullie. Veel succes.`;

/**
 * Single game landing page: newspaper, case background and rules.
 */
function SpeluitlegContent() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { data: rules, isLoading: rulesLoading } = useSWR(
    'game-rules',
    () => gameApi.getRules(),
    { revalidateOnFocus: false }
  );

  useEffect(() => {
    if (!authLoading && !user?.teamId) router.replace('/lobby');
  }, [authLoading, router, user?.teamId]);

  if (authLoading || !user?.teamId) {
    return <div className="min-h-screen bg-stone-950" />;
  }

  if (rulesLoading || !rules) {
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
                {STORY_TITLE}
              </h1>
              <p className="text-stone-700 font-serif text-sm italic mt-2">
                Cold case · Oproep aan het publiek
              </p>
            </header>
            <div className="space-y-4">
              {paragraphs(STORY_BACKSTORY).map((p, i) => (
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
                        <div className="min-w-0 text-stone-800 leading-relaxed">
                          <p>{body}</p>
                          {i === 1 && (
                            <div className="mt-3 inline-flex items-center gap-3 rounded-md border border-stone-400/70 bg-amber-50/50 px-3 py-2">
                              <Image
                                src="/icon.png"
                                alt="Het groene MO-logo op de NFC-tag"
                                width={56}
                                height={56}
                                className="h-14 w-14 shrink-0"
                              />
                              <span className="font-serif text-sm italic text-stone-700">
                                Zoek naar dit groene MO-logo.
                              </span>
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
              </ol>
          </PaperSheet>
        </section>

        {/* The team is already set up before this explanation page. */}
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
