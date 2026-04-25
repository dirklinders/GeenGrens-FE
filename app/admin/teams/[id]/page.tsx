'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { adminApi, chatFeApi, type TeamDetailDTO } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const SLUIT_AF_MARKER = '[SLUIT_AF]';
const BEEINDIGD_MARKER = '[BEËINDIGD]';

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function StatusBadge({ value, label }: { value: boolean | null | undefined; label: string }) {
  const color = value
    ? 'bg-emerald-900 text-emerald-300 border-emerald-800'
    : 'bg-stone-800 text-stone-500 border-stone-700';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${color}`}>
      {value ? '✓' : '–'} {label}
    </span>
  );
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('nl-NL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ────────────────────────────────────────────────────────────
// Chat transcript for one character
// ────────────────────────────────────────────────────────────

function ChatTranscript({ chats }: { chats: TeamDetailDTO['unlockedCodes'][number]['chats'] }) {
  if (chats.length === 0) {
    return (
      <p className="text-stone-600 text-xs italic px-1 pt-2">
        Nog geen berichten gestuurd.
      </p>
    );
  }

  return (
    <div className="space-y-2 pt-3">
      {chats.map((msg, i) => {
        const isUser = msg.role?.toLowerCase() === 'user';
        return (
          <div
            key={i}
            className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                isUser
                  ? 'bg-red-900/40 text-stone-200 border border-red-800/40'
                  : 'bg-stone-800 text-stone-300 border border-stone-700'
              }`}
            >
              <span className={`block text-[10px] font-medium mb-1 ${
                isUser ? 'text-red-400' : 'text-stone-500'
              }`}>
                {isUser ? 'Speler' : msg.role}
              </span>
              {msg.message}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Unlocked location card
// ────────────────────────────────────────────────────────────

function UnlockedCodeCard({
  entry,
  teamId,
  onEndRequested,
}: {
  entry: TeamDetailDTO['unlockedCodes'][number];
  teamId: number;
  onEndRequested: () => void;
}) {
  const [requesting, setRequesting] = useState(false);
  const [requestError, setRequestError] = useState('');

  const isEnded = entry.chats.some(
    c => c.role === 'System' && c.message === BEEINDIGD_MARKER
  );
  const isPending = !isEnded && entry.chats.some(
    c => c.role === 'System' && c.message === SLUIT_AF_MARKER
  );

  const handleRequestEnd = async () => {
    if (!entry.characterId) return;
    setRequesting(true);
    setRequestError('');
    try {
      await chatFeApi.requestEnd(teamId, entry.characterId);
      onEndRequested();
    } catch {
      setRequestError('Mislukt, probeer opnieuw.');
    } finally {
      setRequesting(false);
    }
  };

  // Count only visible (non-System) messages
  const visibleChats = entry.chats.filter(c => c.role !== 'System');

  return (
    <Card className="bg-stone-900 border-stone-800">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-stone-100 text-base font-serif">
              {entry.locationName ?? entry.code ?? '—'}
            </CardTitle>
            {entry.characterName && (
              <p className="text-stone-400 text-xs mt-0.5">
                Getuige: <span className="text-stone-300">{entry.characterName}</span>
              </p>
            )}
          </div>
          <div className="text-right shrink-0 space-y-1.5">
            {entry.code && (
              <span className="block bg-stone-800 text-stone-300 px-2 py-0.5 rounded text-xs font-mono">
                {entry.code}
              </span>
            )}
            <span className="block text-stone-600 text-xs">{fmt(entry.unlockedAt)}</span>

            {/* Conversation state */}
            {entry.characterId && (
              isEnded ? (
                <span className="block text-xs bg-stone-800 text-stone-500 border border-stone-700 px-2 py-0.5 rounded text-center">
                  ✓ Beëindigd
                </span>
              ) : isPending ? (
                <span className="block text-xs bg-amber-950 text-amber-400 border border-amber-800 px-2 py-0.5 rounded text-center">
                  ⏳ Afsluiting gevraagd
                </span>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={requesting}
                  onClick={handleRequestEnd}
                  className="text-xs border-red-800 text-red-400 hover:bg-red-950 hover:text-red-300 h-6 px-2"
                >
                  {requesting ? '...' : 'Sluit gesprek'}
                </Button>
              )
            )}
            {requestError && (
              <p className="text-red-400 text-xs">{requestError}</p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-stone-500 text-xs font-medium uppercase tracking-wide mb-1">
          Berichten ({visibleChats.length})
        </p>
        <ChatTranscript chats={visibleChats} />
      </CardContent>
    </Card>
  );
}

// ────────────────────────────────────────────────────────────
// Main page
// ────────────────────────────────────────────────────────────

export default function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const teamId = parseInt(id, 10);

  const { data: team, isLoading, error, mutate } = useSWR(
    `admin-team-detail-${teamId}`,
    () => adminApi.getTeamDetail(teamId),
    { revalidateOnFocus: false, refreshInterval: 30_000 }
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse h-8 w-48 bg-stone-800 rounded" />
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse bg-stone-900 border border-stone-800 rounded h-48" />
        ))}
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="text-red-400 text-sm">
        Team niet gevonden.{' '}
        <Link href="/admin/progress" className="underline hover:text-red-300">Terug</Link>
      </div>
    );
  }

  const p = team.progress;
  const totalMessages = team.unlockedCodes.reduce((n, c) => n + c.chats.length, 0);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/progress"
            className="text-stone-500 text-xs hover:text-stone-300 transition-colors"
          >
            ← Voortgang
          </Link>
          <h1 className="font-serif text-2xl text-stone-100 mt-1">{team.teamName}</h1>
          <p className="text-stone-500 text-sm mt-0.5">
            Notitieboek:{' '}
            <span className="font-mono text-stone-400">{team.notebookLocation}</span>
          </p>
        </div>

        {/* Stats strip */}
        <div className="flex gap-3 shrink-0">
          <div className="bg-stone-900 border border-stone-800 rounded px-3 py-2 text-center min-w-[60px]">
            <div className="text-xl font-serif text-stone-100">{team.unlockedCodes.length}</div>
            <div className="text-stone-500 text-xs">Locaties</div>
          </div>
          <div className="bg-stone-900 border border-stone-800 rounded px-3 py-2 text-center min-w-[60px]">
            <div className="text-xl font-serif text-stone-100">{totalMessages}</div>
            <div className="text-stone-500 text-xs">Berichten</div>
          </div>
        </div>
      </div>

      {/* ── Status badges ── */}
      {p ? (
        <div className="flex flex-wrap gap-2">
          <StatusBadge value={p.isNotebookUnlocked} label="Notitieboek" />
          <StatusBadge value={p.canAccessChat}      label="Ondervragingen" />
          <StatusBadge value={p.canSubmitTip}       label="Melding mogelijk" />
          {p.tipSubmitted && (
            <StatusBadge
              value={p.tipIsCorrect ?? false}
              label={p.tipIsCorrect ? 'Zaak opgelost!' : 'Fout antwoord'}
            />
          )}
        </div>
      ) : (
        <p className="text-stone-600 text-sm">Nog geen actie ondernomen.</p>
      )}

      {/* ── Submitted tip ── */}
      {p?.tipSubmitted && (
        <div className="bg-stone-900 border border-stone-800 rounded p-4 space-y-1">
          <p className="text-stone-400 text-xs font-medium uppercase tracking-wide">Ingediende melding</p>
          <p className="text-stone-300 text-sm">
            Verdachte: <span className="text-stone-100">{p.tipSuspectId ?? '—'}</span>
          </p>
          {p.tipMotive && (
            <p className="text-stone-400 text-xs leading-relaxed mt-1">
              &ldquo;{p.tipMotive}&rdquo;
            </p>
          )}
        </div>
      )}

      {/* ── Members ── */}
      {team.members.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {team.members.map((m) => (
            <span
              key={m.id}
              className="bg-stone-900 border border-stone-800 rounded px-2 py-1 text-stone-400 text-xs"
            >
              {m.fullName || m.email}
            </span>
          ))}
        </div>
      )}

      {/* ── Unlocked codes + chats ── */}
      {team.unlockedCodes.length === 0 ? (
        <p className="text-stone-600 text-sm text-center py-12">
          Dit team heeft nog geen locatiecodes gevonden.
        </p>
      ) : (
        <div className="space-y-4">
          <h2 className="text-stone-400 text-xs font-medium uppercase tracking-wide">
            Ontgrendelde locaties & gesprekken
          </h2>
          {team.unlockedCodes.map((entry, i) => (
            <UnlockedCodeCard
              key={i}
              entry={entry}
              teamId={teamId}
              onEndRequested={() => mutate()}
            />
          ))}
        </div>
      )}
    </div>
  );
}
