'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { gameApi, tipApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AccusationFormProps {
  /**
   * 'page'   — legacy /tip look: submitting/result states render full-screen.
   * 'inline' — compact rendering for embedding in the Onderzoek tab.
   * The submission behavior/API is identical for both (tipApi.submit, one-shot,
   * validated server-side by TipController).
   */
  variant?: 'page' | 'inline';
}

/**
 * The one-shot final accusation (dader + wapen + plek), extracted from /tip so
 * both the /tip page and the Onderzoek tab render the exact same form and flow:
 * confirm dialog → tipApi.submit → result screen. The TipController still
 * enforces one submission per team server-side.
 */
export function AccusationForm({ variant = 'page' }: AccusationFormProps) {
  const [selectedCharacterId, setSelectedCharacterId] = useState<number | null>(null);
  const [selectedWeaponId, setSelectedWeaponId] = useState<number | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Every game character is a selectable suspect. This must not be limited to
  // characters linked to an unlocked map location.
  const { data: characters, isLoading: charactersLoading } = useSWR(
    'accusation-characters',
    () => gameApi.getAccusationCharacters(),
    { revalidateOnFocus: false }
  );

  // All known weapons. Uses the player-facing /api/game/Weapons — the admin
  // CRUD /api/Weapon is admin-only and returns 403 for players.
  const { data: weapons, isLoading: weaponsLoading } = useSWR(
    'accusation-weapons',
    () => gameApi.getWeapons(),
    { revalidateOnFocus: false }
  );

  // All locations (body was moved — the team must deduce where it happened)
  const { data: locations, isLoading: locationsLoading } = useSWR(
    'accusation-locations',
    () => gameApi.getLocations(),
    { revalidateOnFocus: false }
  );
  const { data: gameStatus, mutate: mutateGameStatus } = useSWR(
    'game-status',
    () => gameApi.getGameStatus(),
    { revalidateOnFocus: false }
  );

  const ready = Boolean(selectedCharacterId && selectedWeaponId && selectedLocationId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    setShowConfirmation(true);
  };

  const confirmSubmission = async () => {
    setShowConfirmation(false);
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const res = await tipApi.submit(
        selectedCharacterId!,
        selectedWeaponId!,
        selectedLocationId!
      );
      setResult(res.submitted);
      await mutateGameStatus(current => current ? {
        ...current,
        canSubmitTip: false,
        tipSubmitted: true,
      } : current, { revalidate: false });
    } catch {
      setSubmitError('Er is een fout opgetreden bij het indienen van de aanklacht. Probeer het opnieuw.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const suspectName = (() => {
    const name = characters?.find(c => c.id === selectedCharacterId)?.name;
    return name === '?' && gameStatus?.unknownSuspectName?.trim()
      ? gameStatus.unknownSuspectName.trim()
      : name ?? 'onbekend';
  })();
  const weaponName = weapons?.find(w => w.id === selectedWeaponId)?.name ?? 'onbekend';
  const locationName = locations?.find(l => l.id === selectedLocationId)?.name ?? 'onbekend';

  // Wrapper for the "busy" and "result" states: full-screen on /tip, inline in the tab.
  const wrap = (children: React.ReactNode) =>
    variant === 'page' ? (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4">
        {children}
      </div>
    ) : (
      <div className="py-6 flex items-center justify-center">{children}</div>
    );

  if (isSubmitting) {
    return wrap(
      <div className="text-stone-400 font-serif text-lg animate-pulse">
        Aanklacht wordt ingediend...
      </div>
    );
  }

  // ── Result screen ──
  if (result) {
    return wrap(
      <Card className="bg-stone-900 border-stone-800 max-w-xl w-full">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <div className="text-amber-500 text-6xl font-serif">Ontvangen</div>
          <h2 className="text-stone-100 text-2xl font-serif">Bedankt voor jullie aanklacht</h2>
          <div className="text-stone-400 space-y-3">
            <p>De recherche heeft jullie inzending ontvangen en neemt deze mee in het onderzoek.</p>
            <p>Er kan geen tweede aanklacht worden ingediend.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const loading = charactersLoading || weaponsLoading || locationsLoading;

  if (loading) {
    return wrap(
      <Card className="bg-stone-900 border-stone-800 w-full max-w-xl">
        <CardContent className="py-10 text-center">
          <span className="animate-pulse text-stone-400 font-serif">Aanklacht voorbereiden...</span>
        </CardContent>
      </Card>
    );
  }

  // ── Accusation form ──
  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Verdachte ── */}
        <Card className="bg-stone-900 border-stone-800">
          <CardHeader>
            <CardTitle className="font-serif text-xl text-stone-100">1. De dader</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(characters ?? []).map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCharacterId(c.id)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-3 rounded-md border transition-colors text-center',
                    selectedCharacterId === c.id
                      ? 'border-amber-600 bg-amber-950/40'
                      : 'border-stone-800 bg-stone-950/60 hover:border-stone-600'
                  )}
                >
                  {c.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.avatarUrl}
                      alt={c.name ?? 'Verdachte'}
                      className="w-14 h-14 rounded-full object-cover border border-stone-700"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-500 font-serif text-xl">
                      ?
                    </div>
                  )}
                  <span className="text-stone-200 font-serif text-sm leading-tight">
                    {c.name === '?' && gameStatus?.unknownSuspectName?.trim()
                      ? gameStatus.unknownSuspectName.trim()
                      : c.name ?? 'Onbekend'}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Wapen ── */}
        <Card className="bg-stone-900 border-stone-800">
          <CardHeader>
            <CardTitle className="font-serif text-xl text-stone-100">2. Het wapen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(weapons ?? []).map(w => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setSelectedWeaponId(w.id)}
                  className={cn(
                    'p-3 rounded-md border transition-colors text-center font-serif text-sm',
                    selectedWeaponId === w.id
                      ? 'border-amber-600 bg-amber-950/40 text-amber-300'
                      : 'border-stone-800 bg-stone-950/60 text-stone-200 hover:border-stone-600'
                  )}
                >
                  {w.name}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Locatie ── */}
        <Card className="bg-stone-900 border-stone-800">
          <CardHeader>
            <CardTitle className="font-serif text-xl text-stone-100">3. De plek van de moord</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-stone-500 text-sm mb-3 font-serif italic">
              Het lichaam is verplaatst — kies waar Foppe Lawerman écht werd vermoord.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(locations ?? []).map(l => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setSelectedLocationId(l.id)}
                  className={cn(
                    'p-3 rounded-md border transition-colors text-left font-serif text-sm',
                    selectedLocationId === l.id
                      ? 'border-amber-600 bg-amber-950/40 text-amber-300'
                      : 'border-stone-800 bg-stone-950/60 text-stone-200 hover:border-stone-600'
                  )}
                >
                  {l.name}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {submitError && (
          <p className="text-red-500 text-sm text-center">{submitError}</p>
        )}

        <div className="pb-8">
          <Button
            type="submit"
            disabled={!ready}
            className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-stone-800 disabled:text-stone-500 text-stone-950 font-serif text-lg py-6"
          >
            Dien aanklacht in
          </Button>
          {!ready && (
            <p className="text-stone-500 text-xs text-center mt-2">
              Kies eerst een verdachte, een wapen en een locatie.
            </p>
          )}
        </div>
      </form>

      {/* ── Confirmation dialog ── */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="bg-stone-900 border-stone-800 text-stone-100">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Zeker weten?</DialogTitle>
            <DialogDescription className="text-stone-400 font-serif">
              Dit is jullie enige kans. Indienen kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border border-stone-800 bg-stone-950/60 p-4 space-y-1 font-serif text-sm">
            <p><span className="text-stone-500">Dader:</span> {suspectName}</p>
            <p><span className="text-stone-500">Wapen:</span> {weaponName}</p>
            <p><span className="text-stone-500">Plek:</span> {locationName}</p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowConfirmation(false)}
              className="border-stone-700 text-stone-300 hover:bg-stone-800"
            >
              Nog even nadenken
            </Button>
            <Button
              onClick={confirmSubmission}
              className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-serif"
            >
              Indienen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
