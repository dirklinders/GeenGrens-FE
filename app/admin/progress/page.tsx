'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { adminApi, type TeamProgressDTO } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// ────────────────────────────────────────────────────────────
// Badges
// ────────────────────────────────────────────────────────────

function StatusBadge({ value, label }: { value: boolean | null | undefined; label: string }) {
  const color = value === true ? 'bg-emerald-900 text-emerald-300 border-emerald-800'
    : value === false ? 'bg-stone-800 text-stone-500 border-stone-700'
    : 'bg-stone-800 text-stone-600 border-stone-700';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${color}`}>
      {value ? '✓' : '–'} {label}
    </span>
  );
}

// ────────────────────────────────────────────────────────────
// Override panel
// ────────────────────────────────────────────────────────────

function OverridePanel({ teamId, current, onClose, onUpdate }: {
  teamId: number;
  current: TeamProgressDTO['progress'];
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [chat, setChat] = useState(current?.canAccessChat ?? false);
  const [tip, setTip] = useState(current?.canSubmitTip ?? false);
  const [locationId, setLocationId] = useState<string>('');
  const [weaponId, setWeaponId] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await adminApi.setProgress(teamId, {
        canAccessChat: chat,
        canSubmitTip: tip,
        locationId: locationId ? Number(locationId) : null,
        weaponId: weaponId ? Number(weaponId) : null,
      });
      onUpdate();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const toggle = (
    <span className="text-xs text-stone-500 ml-2">(klik om te wisselen)</span>
  );

  return (
    <div className="mt-4 bg-stone-800 rounded p-4 space-y-3 border border-stone-700">
      <p className="text-stone-300 text-sm font-medium">Voortgang handmatig aanpassen</p>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={chat}
          onChange={(e) => setChat(e.target.checked)}
          className="accent-red-700 w-4 h-4"
        />
        <span className="text-stone-300 text-sm">Ondervragingen toegankelijk</span>
      </label>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={tip}
          onChange={(e) => setTip(e.target.checked)}
          className="accent-red-700 w-4 h-4"
        />
        <span className="text-stone-300 text-sm">Anonieme melding toegankelijk</span>
      </label>

      {/* Pre-assigned location */}
      <div className="space-y-1">
        <Label className="text-stone-300 text-sm">Vooraf toegewezen locatie ID</Label>
        <Input
          type="number"
          value={locationId}
          onChange={(e) => setLocationId(e.target.value)}
          placeholder="Locatie ID"
          className="bg-stone-900 border-stone-700 text-stone-100"
        />
      </div>

      {/* Discovered weapon */}
      <div className="space-y-1">
        <Label className="text-stone-300 text-sm">Wapen ID (ontdekt door team)</Label>
        <Input
          type="number"
          value={weaponId}
          onChange={(e) => setWeaponId(e.target.value)}
          placeholder="Wapen ID"
          className="bg-stone-900 border-stone-700 text-stone-100"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button onClick={save} disabled={saving} size="sm" className="bg-red-800 hover:bg-red-700 text-stone-100">
          {saving ? 'Opslaan...' : 'Opslaan'}
        </Button>
        <Button onClick={onClose} variant="outline" size="sm" className="border-stone-700 text-stone-300 hover:bg-stone-900">
          Annuleren
        </Button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Team progress card
// ────────────────────────────────────────────────────────────

function TeamCard({ team, onUpdate }: { team: TeamProgressDTO; onUpdate: () => void }) {
  const [showOverride, setShowOverride] = useState(false);
  const p = team.progress;

  return (
    <Card className="bg-stone-900 border-stone-800">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-stone-100 text-lg font-serif">{team.teamName}</CardTitle>
            <p className="text-stone-500 text-xs mt-0.5">
              Locaties ontgrendeld:{' '}
              <span className="font-mono text-stone-400">{team.unlockedCount ?? team.unlockedCodes.length}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/teams/${team.teamId}`}
              className="text-stone-500 hover:text-stone-300 text-xs transition-colors"
            >
              Bekijk chats →
            </Link>
            <button
              onClick={() => setShowOverride(!showOverride)}
              className="text-stone-500 hover:text-stone-300 text-xs transition-colors"
            >
              Aanpassen
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status badges */}
        {p ? (
          <div className="flex flex-wrap gap-2">
            <StatusBadge value={p.canAccessChat} label="Ondervragingen" />
            <StatusBadge value={p.canSubmitTip} label="Aanklacht mogelijk" />
            {p.tipSubmitted && (
              <StatusBadge
                value={p.tipIsCorrect ?? false}
                label={p.tipIsCorrect ? 'Opgelost!' : 'Fout antwoord'}
              />
            )}
          </div>
        ) : (
          <p className="text-stone-600 text-sm">Nog geen actie ondernomen</p>
        )}

        {/* Tip details */}
        {p?.tipSubmitted && (
          <div className="bg-stone-800 rounded p-3 space-y-1">
            <p className="text-stone-400 text-xs font-medium uppercase tracking-wide">Ingediende aanklacht</p>
            <p className="text-stone-300 text-sm">
              Verdachte: <span className="text-stone-100">{p.tipSuspectId ?? '—'}</span>
              {' · '}
              Wapen: <span className="text-stone-100">{p.tipWeaponId ?? '—'}</span>
              {' · '}
              Locatie: <span className="text-stone-100">{p.tipLocationId ?? '—'}</span>
            </p>
          </div>
        )}

        {/* Unlocked codes */}
        {team.unlockedCodes.length > 0 && (
          <div>
            <p className="text-stone-500 text-xs font-medium uppercase tracking-wide mb-2">
              Ontgrendelde locaties ({team.unlockedCodes.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {team.unlockedCodes.map((uc, i) => (
                <span key={i} className="bg-stone-800 text-stone-300 px-2 py-0.5 rounded text-xs font-mono">
                  {uc.code ?? uc.locationName}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Members */}
        {team.members.length > 0 && (
          <div>
            <p className="text-stone-500 text-xs font-medium uppercase tracking-wide mb-1">Leden</p>
            <div className="flex flex-wrap gap-1">
              {team.members.map((m) => (
                <span key={m.id} className="text-stone-400 text-xs">
                  {m.fullName || m.email}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Manual override panel */}
        {showOverride && (
          <OverridePanel
            teamId={team.teamId}
            current={p}
            onClose={() => setShowOverride(false)}
            onUpdate={onUpdate}
          />
        )}
      </CardContent>
    </Card>
  );
}

// ────────────────────────────────────────────────────────────
// Main page
// ────────────────────────────────────────────────────────────

export default function ProgressPage() {
  const { data: teams, mutate, isLoading } = useSWR(
    'admin-team-progress',
    adminApi.getTeamProgress,
    { revalidateOnFocus: false, refreshInterval: 30_000 }
  );

  const solved = teams?.filter((t) => t.progress?.tipIsCorrect === true).length ?? 0;
  const submitted = teams?.filter((t) => t.progress?.tipSubmitted).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-stone-100">Voortgang</h1>
          <p className="text-stone-500 text-sm mt-1">Refresht elke 30 seconden automatisch</p>
        </div>
        <Button
          onClick={() => mutate()}
          variant="outline"
          className="border-stone-700 text-stone-300 hover:bg-stone-800"
        >
          Vernieuwen
        </Button>
      </div>

      {/* Summary stats */}
      {teams && teams.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-stone-900 border border-stone-800 rounded p-4 text-center">
            <div className="text-2xl font-serif text-stone-100">{teams.length}</div>
            <div className="text-stone-500 text-sm mt-1">Teams</div>
          </div>
          <div className="bg-stone-900 border border-stone-800 rounded p-4 text-center">
            <div className="text-2xl font-serif text-stone-100">{submitted}</div>
            <div className="text-stone-500 text-sm mt-1">Meldingen ingediend</div>
          </div>
          <div className="bg-stone-900 border border-stone-800 rounded p-4 text-center">
            <div className={`text-2xl font-serif ${solved > 0 ? 'text-emerald-400' : 'text-stone-100'}`}>
              {solved}
            </div>
            <div className="text-stone-500 text-sm mt-1">Zaak opgelost</div>
          </div>
        </div>
      )}

      {/* Team cards */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-stone-900 border border-stone-800 rounded h-32" />
          ))}
        </div>
      ) : teams?.length === 0 ? (
        <p className="text-stone-500 text-center py-12">
          Geen teams gevonden. Maak eerst teams aan via het Teams-tabblad.
        </p>
      ) : (
        <div className="space-y-4">
          {(teams ?? []).map((team) => (
            <TeamCard key={team.teamId} team={team} onUpdate={() => mutate()} />
          ))}
        </div>
      )}
    </div>
  );
}
