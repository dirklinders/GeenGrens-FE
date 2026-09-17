'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { gameApi, GameLocationDTO } from '@/lib/api';
import { AccusationForm } from '@/components/game/accusation-form';
import { PaperSheet } from '@/components/game/paper-sheet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// ────────────────────────────────────────────────────────────
// Admin-authored content JSON schemas (parsed server-side; the API only
// includes `content` for unlocked locations — null otherwise).
// ────────────────────────────────────────────────────────────

interface InterviewLine {
  speaker?: string;
  text?: string;
}

interface InterviewContent {
  header?: string;
  meta?: string;
  lines?: InterviewLine[];
}

interface SearchHotspot {
  id?: string;
  x?: number;
  y?: number;
  label?: string;
  detail?: string;
}

interface SearchPictureContent {
  note?: string;
  image?: string;
  hotspots?: SearchHotspot[];
}

const CONTENT_TYPE_LABEL: Record<string, string> = {
  interview: 'Interview',
  search_picture: 'Zoekfoto',
};

// ────────────────────────────────────────────────────────────
// Interview renderer — police-format transcript on paper, with [[...]]
// redaction markup rendered as black bars (never revealed).
// ────────────────────────────────────────────────────────────

/** Renders text with `[[...]]` spans as non-interactive black redaction bars. */
function RedactedText({ text }: { text: string }) {
  const parts = text.split(/(\[\[.*?\]\])/g);
  return (
    <span className="whitespace-pre-wrap">
      {parts.map((part, i) => {
        const match = part.match(/^\[\[(.*)\]\]$/);
        if (!match) return <span key={i}>{part}</span>;
        return (
          <span
            key={i}
            title="geclassificeerd"
            aria-label="geclassificeerd"
            className="inline-block align-middle bg-stone-950 border border-stone-800 rounded-[2px] mx-0.5"
            style={{ width: `${Math.max(1.5, match[1].length * 0.62)}em`, height: '0.85em' }}
          />
        );
      })}
    </span>
  );
}

function InterviewDossier({ content }: { content: InterviewContent }) {
  const lines = Array.isArray(content.lines) ? content.lines : [];

  return (
    <PaperSheet className="rounded-sm">
      <div className="font-mono">
        <p className="text-[10px] tracking-[0.3em] text-stone-500 uppercase">
          Politie-interview
        </p>
        <h3 className="font-mono font-bold text-lg text-stone-900 mt-1 break-words">
          {content.header ?? 'Verklaring'}
        </h3>
        {content.meta && (
          <p className="text-xs text-stone-600 mt-1 border-b border-dashed border-stone-400 pb-2">
            {content.meta}
          </p>
        )}

        <div className="mt-4 space-y-3">
          {lines.map((line, i) => (
            <div key={i} className="grid grid-cols-[minmax(4.5rem,8rem)_1fr] gap-2 text-sm">
              <span className="font-bold uppercase text-stone-700 text-[11px] pt-0.5 break-words">
                {line.speaker ?? '???' }
              </span>
              <span className="text-stone-900 leading-relaxed">
                {typeof line.text === 'string' ? (
                  <RedactedText text={line.text} />
                ) : (
                  <em className="text-stone-500">[onleesbaar]</em>
                )}
              </span>
            </div>
          ))}
          {lines.length === 0 && (
            <p className="text-stone-500 text-sm italic">Geen transcriptregels beschikbaar.</p>
          )}
        </div>

        <p className="mt-6 text-[10px] text-stone-500 border-t border-dashed border-stone-400 pt-2 tracking-widest uppercase">
          Vertrouwelijk · geclassificeerde passages zijn zwartgeplakt
        </p>
      </div>
    </PaperSheet>
  );
}

// ────────────────────────────────────────────────────────────
// Search-picture renderer — note on paper + image with percent-based
// clickable hotspots (pulsing numbered pins, keyboard accessible).
// ────────────────────────────────────────────────────────────

function SearchPictureDossier({ content }: { content: SearchPictureContent }) {
  const [active, setActive] = useState<SearchHotspot | null>(null);
  const hotspots = Array.isArray(content.hotspots)
    ? content.hotspots.filter(h => typeof h?.x === 'number' && typeof h?.y === 'number')
    : [];

  return (
    <div className="space-y-3">
      {content.note && (
        <PaperSheet className="rounded-sm">
          <p className="text-[10px] tracking-[0.3em] text-stone-500 uppercase font-mono">
            Politievondst
          </p>
          <p className="font-serif text-stone-900 mt-1 leading-relaxed">{content.note}</p>
        </PaperSheet>
      )}

      {typeof content.image === 'string' && content.image ? (
        <div className="relative rounded-md overflow-hidden border border-stone-800 bg-stone-950">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={content.image}
            alt={content.note ?? 'Zoekfoto van de politie'}
            className="w-full h-auto block"
          />
          {hotspots.map((h, i) => (
            <button
              key={h.id ?? i}
              type="button"
              aria-label={h.label ?? `Markering ${i + 1}`}
              onClick={() => setActive(h)}
              className="absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full border-2 border-amber-500 bg-amber-500/20 hover:bg-amber-500/40 focus-visible:ring-2 focus-visible:ring-amber-400 outline-none"
              style={{ left: `${h.x}%`, top: `${h.y}%` }}
            >
              <span
                aria-hidden="true"
                className="absolute inset-0 rounded-full animate-ping bg-amber-500/30"
              />
              <span className="relative font-serif text-[11px] font-bold text-amber-300">
                {i + 1}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-stone-500 text-sm font-serif italic">Geen zoekfoto beschikbaar.</p>
      )}

      {/* Numbered legend — doubles as keyboard/click alternative for the pins */}
      {hotspots.length > 0 && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {hotspots.map((h, i) => (
            <li key={h.id ?? i}>
              <button
                type="button"
                onClick={() => setActive(h)}
                className="w-full text-left p-2 rounded-md border border-stone-800 bg-stone-950/60 hover:border-amber-700 transition-colors"
              >
                <span className="text-amber-500 font-serif text-xs mr-2">{i + 1}.</span>
                <span className="text-stone-200 font-serif text-sm">
                  {h.label ?? 'Markering'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={active !== null} onOpenChange={open => !open && setActive(null)}>
        <DialogContent className="bg-stone-900 border-stone-800 text-stone-100">
          <DialogHeader>
            <DialogTitle className="font-serif">{active?.label ?? 'Detail'}</DialogTitle>
            <DialogDescription className="font-serif text-stone-300 leading-relaxed">
              {/* Same [[...]] redaction markup as interview lines — the admin
                  editor validates it in hotspot details, so render it redacted
                  here too instead of showing literal brackets. */}
              {active?.detail ? (
                <RedactedText text={active.detail} />
              ) : (
                'Geen verdere details beschikbaar.'
              )}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Legacy/simple dossier (contentType '' or unusable content JSON)
// ────────────────────────────────────────────────────────────

function FallbackDossier({
  location,
  hint,
}: {
  location: GameLocationDTO;
  hint?: string;
}) {
  return (
    <div className="space-y-4">
      {hint && <p className="text-amber-500/90 text-sm font-serif italic">{hint}</p>}
      {location.description && (
        <p className="text-stone-300 font-serif leading-relaxed">{location.description}</p>
      )}
      {location.characterName && (
        <div className="flex items-center gap-3 p-3 rounded-md border border-stone-800 bg-stone-950/60">
          {location.characterAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={location.characterAvatarUrl}
              alt={location.characterName}
              className="w-10 h-10 rounded-full object-cover border border-stone-700"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-500 font-serif">
              ?
            </div>
          )}
          <div>
            <p className="text-stone-200 font-serif text-sm">{location.characterName}</p>
            <p className="text-stone-500 text-xs">Verdachte op deze locatie</p>
          </div>
        </div>
      )}
    </div>
  );
}

/** Renders one location's dossier per its `contentType`, defensively. */
function DossierContent({ location }: { location: GameLocationDTO }) {
  if (location.contentType === 'interview') {
    if (!location.content) {
      return (
        <FallbackDossier location={location} hint="Het interview is nog niet beschikbaar." />
      );
    }
    const content = location.content as unknown as InterviewContent;
    if (!content || typeof content !== 'object' || !Array.isArray(content.lines)) {
      return (
        <FallbackDossier
          location={location}
          hint="Het interview kon niet worden geladen (ongeldige inhoud)."
        />
      );
    }
    return <InterviewDossier content={content} />;
  }

  if (location.contentType === 'search_picture') {
    if (!location.content) {
      return (
        <FallbackDossier location={location} hint="De zoekfoto is nog niet beschikbaar." />
      );
    }
    const content = location.content as unknown as SearchPictureContent;
    if (!content || typeof content !== 'object' || typeof content.image !== 'string') {
      return (
        <FallbackDossier
          location={location}
          hint="De zoekfoto kon niet worden geladen (ongeldige inhoud)."
        />
      );
    }
    return <SearchPictureDossier content={content} />;
  }

  return <FallbackDossier location={location} />;
}

// ────────────────────────────────────────────────────────────
// The tab itself
// ────────────────────────────────────────────────────────────

/**
 * "Onderzoek" tab of the game shell: the unlocked locations' dossiers.
 * Renders each location's content per `contentType` (interview transcript
 * with redactions / search picture with hotspots / legacy description) and
 * hosts the one-shot accusation (shared `accusation-form.tsx`) once the team
 * has found all location codes. Deep link: `/game?tab=onderzoek&location=ID`.
 */
export function InvestigationTab() {
  const searchParams = useSearchParams();

  const { data: locations, isLoading } = useSWR(
    'game-locations',
    () => gameApi.getLocations(),
    { revalidateOnFocus: true }
  );

  const { data: status } = useSWR(
    'game-status-onderzoek',
    () => gameApi.getGameStatus(),
    { revalidateOnFocus: false }
  );

  const unlocked = useMemo(() => (locations ?? []).filter(l => l.isUnlocked), [locations]);
  const locked = useMemo(() => (locations ?? []).filter(l => !l.isUnlocked), [locations]);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // The `?location=` value already consumed by the deep-link effect below.
  // Guards against re-applying the same deep link (e.g. from a stale
  // searchParams render after the player closes the dossier).
  const appliedDeepLinkRef = useRef<string | null>(null);

  // Deep link: /game?tab=onderzoek&location=ID opens that dossier directly
  // (only when the team has unlocked that location). Applied once per URL
  // change — closing the dossier clears the param, so it cannot re-open it.
  useEffect(() => {
    if (!locations) return;
    const raw = searchParams.get('location');
    if (!raw) {
      appliedDeepLinkRef.current = null;
      return;
    }
    if (appliedDeepLinkRef.current === raw) return;
    appliedDeepLinkRef.current = raw;
    const id = Number(raw);
    if (Number.isFinite(id) && unlocked.some(l => l.id === id)) {
      setSelectedId(id);
    }
  }, [searchParams, locations, unlocked]);

  // "← Alle dossiers": close the dossier AND remove `?location=` from the URL
  // (keeping e.g. `tab=onderzoek`) so the deep-link effect cannot re-open it
  // and a refresh shows the overview. replace() avoids a new history entry.
  const handleBackToDossiers = () => {
    setSelectedId(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('location');
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const selected = unlocked.find(l => l.id === selectedId) ?? null;
  const canSubmitTip = status?.canSubmitTip ?? false;

  if (isLoading || !locations) {
    return (
      <Card className="bg-stone-900 border-stone-800">
        <CardHeader>
          <CardTitle className="font-serif text-xl text-stone-100">Onderzoek</CardTitle>
          <CardDescription className="text-stone-400">Dossiers laden...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="h-16 rounded-md bg-stone-800/60 animate-pulse"
              style={{ animationDelay: `${i * 120}ms` }}
            />
          ))}
        </CardContent>
      </Card>
    );
  }

  // ── Dossier detail view ──
  if (selected) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={handleBackToDossiers}
          className="text-amber-500 hover:text-amber-400 font-serif text-sm transition-colors"
        >
          ← Alle dossiers
        </button>

        <Card className="bg-stone-900 border-stone-800">
          <CardHeader>
            <CardTitle className="font-serif text-xl text-stone-100">{selected.name}</CardTitle>
            {selected.characterName && (
              <CardDescription className="text-stone-500">
                Verdachte: {selected.characterName}
                {selected.contentType && CONTENT_TYPE_LABEL[selected.contentType]
                  ? ` · ${CONTENT_TYPE_LABEL[selected.contentType]}`
                  : ''}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <DossierContent location={selected} />
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Dossier list ──
  return (
    <div className="space-y-6">
      <Card className="bg-stone-900 border-stone-800">
        <CardHeader>
          <CardTitle className="font-serif text-xl text-stone-100">Onderzoek</CardTitle>
          <CardDescription className="text-stone-400">
            Verklaringen en zoekfoto's van ontgrendelde locaties.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {unlocked.length === 0 ? (
            <p className="text-stone-500 font-serif italic">
              Nog geen dossiers ontgrendeld. Loop door de binnenstad en scan op elke locatie
              de QR- of NFC-code, of voer je locatiecode in via{' '}
              <Link
                href="/unlock"
                className="text-amber-500 hover:text-amber-400 underline underline-offset-4"
              >
                ontgrendelen
              </Link>
              .
            </p>
          ) : (
            unlocked.map(loc => (
              <button
                key={loc.id}
                type="button"
                onClick={() => setSelectedId(loc.id)}
                className="w-full text-left flex items-center justify-between gap-3 p-3 rounded-md border border-stone-800 bg-stone-950/60 hover:border-amber-800/60 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-stone-100 font-serif truncate">{loc.name}</p>
                  <p className="text-stone-500 text-sm truncate">
                    {loc.characterName ? `Verdachte: ${loc.characterName}` : 'Dossier'}
                    {CONTENT_TYPE_LABEL[loc.contentType]
                      ? ` · ${CONTENT_TYPE_LABEL[loc.contentType]}`
                      : ''}
                  </p>
                </div>
                <span className="flex-shrink-0 text-amber-500 font-serif text-sm">Open →</span>
              </button>
            ))
          )}

          {locked.length > 0 && (
            <div className="pt-2 space-y-2">
              <p className="text-stone-600 text-xs font-serif uppercase tracking-wider">
                {locked.length} locatie{locked.length === 1 ? '' : 's'} nog vergrendeld
              </p>
              {locked.map(loc => (
                <div
                  key={loc.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-md border border-stone-900 bg-stone-950/40 opacity-70"
                >
                  <p className="text-stone-500 font-serif truncate">🔒 {loc.name}</p>
                  <Link
                    href="/unlock"
                    className="flex-shrink-0 text-stone-400 hover:text-stone-200 font-serif text-sm transition-colors"
                  >
                    Ontgrendel
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* One-shot accusation once all location codes are found — same shared
          form as /tip, submission behavior unchanged (TipController). */}
      {canSubmitTip && (
        <Card className={cn('bg-stone-900 border-amber-800/60')}>
          <CardHeader>
            <CardTitle className="font-serif text-xl text-amber-400">
              Definitieve aanklacht
            </CardTitle>
            <CardDescription className="text-stone-400">
              Wie was de dader, welk wapen werd gebruikt, en waar vond de moord plaats?
              Jullie hebben één kans — denk goed na.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AccusationForm variant="inline" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
