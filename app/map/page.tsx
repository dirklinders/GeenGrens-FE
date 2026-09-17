'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/game/auth-guard';
import { GameHeader } from '@/components/game/game-header';
import { MapTab } from '@/components/game/map-tab';
import { FEATURE_CHAT_ENABLED } from '@/lib/feature-flags';

/**
 * Legacy map route — kept alive for old NFC/bookmark links.
 *
 * With FEATURE_CHAT_ENABLED=false the map lives in the 3-tab game shell, so
 * this page redirects to `/game?tab=kaart`. With the flag true the classic
 * standalone map page renders (previous behaviour, restored by flag flip).
 */
function MapContent() {
  const router = useRouter();

  useEffect(() => {
    if (!FEATURE_CHAT_ENABLED) {
      // Preserve query params so old NFC/bookmark links like /map?code=XYZ
      // survive the redirect into the game shell; the tab itself is normalized.
      const params = new URLSearchParams(window.location.search);
      params.set('tab', 'kaart');
      router.replace(`/game?${params.toString()}`);
    }
  }, [router]);

  if (!FEATURE_CHAT_ENABLED) {
    // Redirect in progress (see effect above)
    return null;
  }

  return (
    <div className="min-h-screen bg-stone-950">
      <GameHeader />
      <main className="py-6 md:py-8 px-4 space-y-6 max-w-4xl mx-auto">
        <MapTab />
      </main>
    </div>
  );
}

export default function MapPage() {
  return (
    <AuthGuard>
      <MapContent />
    </AuthGuard>
  );
}
