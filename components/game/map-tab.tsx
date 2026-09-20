'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import useSWR from 'swr';
import { gameApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

// Leaflet touches window — client-side only
const LocationMap = dynamic(() => import('@/components/game/location-map'), {
  ssr: false,
  loading: () => (
    <div className="h-[60vh] w-full rounded-lg bg-stone-900 border border-stone-800 flex items-center justify-center">
      <span className="animate-pulse text-stone-400 font-serif">Kaart laden...</span>
    </div>
  ),
});

/**
 * "Kaart" tab of the game shell: the Leaflet map plus the location status
 * list. Shared by `/game` (tab) and `/map` (legacy page, chat-enabled mode).
 *
 * Location rows show only their name and lock state; dossiers open through
 * the map popup or the Onderzoek tab.
 */
export function MapTab() {
  const { data: locations, isLoading } = useSWR(
    'game-locations',
    () => gameApi.getLocations(),
    { revalidateOnFocus: true }
  );

  const { data: status } = useSWR(
    'game-status-map',
    () => gameApi.getGameStatus(),
    { revalidateOnFocus: true }
  );

  if (isLoading || !locations) {
    return (
      <div className="h-[60vh] w-full rounded-lg bg-stone-900 border border-stone-800 flex items-center justify-center">
        <span className="animate-pulse text-stone-400 font-serif text-lg">Laden...</span>
      </div>
    );
  }

  const unlocked = locations.filter(l => l.isUnlocked).length;
  const total = locations.length;
  const canSubmitTip = !!status?.canSubmitTip && total > 0 && unlocked === total;

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-2xl text-stone-100">Onderzoekskaart</h1>
          <span className="text-amber-600 font-serif text-sm">
            {status?.unlockedLocations ?? 0} / {total} locaties bezocht
          </span>
        </div>
        <Progress value={total > 0 ? ((status?.unlockedLocations ?? 0) / total) * 100 : 0} className="h-2 bg-stone-800" />
        <p className="text-stone-500 text-sm">
          Loop door de binnenstad en scan op elke locatie de NFC tag.
        </p>
      </div>

      {/* Map */}
      <LocationMap locations={locations} />

      {/* Location status list */}
      <Card className="bg-stone-900 border-stone-800">
        <CardHeader>
          <CardTitle className="font-serif text-xl text-stone-100">Locaties</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {locations.map(loc => (
            <div
              key={loc.id}
              className="flex items-center justify-between gap-3 p-3 rounded-md border border-stone-800 bg-stone-950/60"
            >
              <div className="min-w-0">
                <p className="text-stone-100 font-serif truncate">{loc.name}</p>
              </div>
              <span className="shrink-0" role="img" aria-label={loc.isUnlocked ? 'Ontgrendeld' : 'Vergrendeld'}>
                {loc.isUnlocked ? '🔓' : '🔒'}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Accusation CTA once all codes are found */}
      {canSubmitTip && (
        <Card className="bg-amber-950/40 border-amber-800/60">
          <CardContent className="pt-6 text-center space-y-3">
            <p className="text-amber-500 font-serif text-lg">
              Alle locaties bezocht — het moment van de waarheid is aangebroken.
            </p>
            <Link
              href="/tip"
              className="inline-block bg-amber-600 hover:bg-amber-500 text-stone-950 font-serif text-lg px-8 py-3 rounded-md transition-colors"
            >
              Doe je aanklacht →
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
