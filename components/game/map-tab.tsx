'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import useSWR from 'swr';
import { gameApi } from '@/lib/api';
import { FEATURE_CHAT_ENABLED } from '@/lib/feature-flags';
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
 * "Kaart" tab of the game shell: the Leaflet map plus the tappable location
 * list. Shared by `/game` (tab) and `/map` (legacy page, chat-enabled mode).
 *
 * Chat flag: with FEATURE_CHAT_ENABLED=true unlocked locations link to
 * `/chat?character=` (old behaviour); with the flag false they link to the
 * location's dossier in the Onderzoek tab.
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
    { revalidateOnFocus: false }
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
  const canSubmitTip = status?.canSubmitTip ?? false;

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-2xl text-stone-100">Onderzoekskaart</h1>
          <span className="text-amber-600 font-serif text-sm">
            {unlocked} / {total} locaties ontgrendeld
          </span>
        </div>
        <Progress value={total > 0 ? (unlocked / total) * 100 : 0} className="h-2 bg-stone-800" />
        <p className="text-stone-500 text-sm">
          {FEATURE_CHAT_ENABLED
            ? 'Loop door de binnenstad en scan op elke locatie de QR- of NFC-code om de verdachte daar te ondervragen.'
            : 'Loop door de binnenstad en scan op elke locatie de QR- of NFC-code om het dossier van die locatie te openen.'}
        </p>
      </div>

      {/* Map */}
      <LocationMap locations={locations} />

      {/* Location list — tappable fallback under the map */}
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
                <p className="text-stone-500 text-sm truncate">
                  {loc.characterName
                    ? `Verdachte: ${loc.characterName}`
                    : 'Onbekende verdachte'}
                </p>
              </div>
              {loc.isUnlocked ? (
                <Link
                  href={
                    FEATURE_CHAT_ENABLED
                      ? `/chat?character=${loc.characterId}`
                      : `/game?tab=onderzoek&location=${loc.id}`
                  }
                  className="flex-shrink-0 text-amber-500 hover:text-amber-400 font-serif text-sm transition-colors"
                >
                  {FEATURE_CHAT_ENABLED ? 'Gesprek →' : 'Dossier →'}
                </Link>
              ) : (
                <Link
                  href="/unlock"
                  className="flex-shrink-0 text-stone-400 hover:text-stone-200 font-serif text-sm transition-colors"
                >
                  🔒 Ontgrendel
                </Link>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Accusation CTA once all codes are found */}
      {canSubmitTip && (
        <Card className="bg-amber-950/40 border-amber-800/60">
          <CardContent className="pt-6 text-center space-y-3">
            <p className="text-amber-500 font-serif text-lg">
              Alle locaties ontgrendeld — het moment van de waarheid is aangebroken.
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
