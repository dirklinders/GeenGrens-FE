'use client';

import { Suspense, useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapTab } from '@/components/game/map-tab';
import { LogigramTab } from '@/components/game/logigram-tab';
import { InvestigationTab } from '@/components/game/investigation-tab';

const TAB_VALUES = ['kaart', 'logigram', 'onderzoek'] as const;
export type GameTab = (typeof TAB_VALUES)[number];

/**
 * The three-tab game shell: Kaart / Logigram / Onderzoek.
 * Tab state persists in the URL (`/game?tab=…`) so tabs are deep-linkable
 * (header nav, map popups, unlock CTA) and survive reloads.
 */
function GameTabsInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const raw = searchParams.get('tab');
  const tabFromUrl: GameTab = TAB_VALUES.includes(raw as GameTab) ? (raw as GameTab) : 'kaart';
  // Keep the tab responsive even when the route is busy. The URL is only a
  // shareable/restorable representation of this local UI state, so it does
  // not need a Next.js navigation for every tap.
  const [tab, setTab] = useState<GameTab>(tabFromUrl);

  // Pick up tab changes made by browser navigation or another in-app link.
  useEffect(() => {
    setTab(tabFromUrl);
  }, [tabFromUrl]);

  const handleTabChange = (value: string) => {
    if (!TAB_VALUES.includes(value as GameTab)) return;

    const nextTab = value as GameTab;
    setTab(nextTab);

    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', nextTab);
    // Next.js observes native history changes, but this avoids queuing an RSC
    // route transition for a tab change. `replaceState` also preserves the
    // previous behaviour of not adding one browser-history entry per tap.
    window.history.replaceState(null, '', `${pathname}?${params.toString()}`);
  };

  const triggerClass =
    'flex-1 font-serif data-[state=active]:bg-amber-600 data-[state=active]:text-stone-950 data-[state=active]:border-amber-600 text-stone-400 hover:text-stone-100';

  return (
    <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="w-full h-11 bg-stone-900 border border-stone-800 mb-4">
        <TabsTrigger value="kaart" className={triggerClass}>
          Kaart
        </TabsTrigger>
        <TabsTrigger value="logigram" className={triggerClass}>
          Logigram
        </TabsTrigger>
        <TabsTrigger value="onderzoek" className={triggerClass}>
          Onderzoek
        </TabsTrigger>
      </TabsList>

      <TabsContent value="kaart">
        <MapTab />
      </TabsContent>
      <TabsContent value="logigram">
        <LogigramTab />
      </TabsContent>
      <TabsContent value="onderzoek">
        <InvestigationTab />
      </TabsContent>
    </Tabs>
  );
}

export function GameTabs() {
  return (
    <Suspense
      fallback={
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-stone-400 font-serif text-lg">Laden...</div>
        </div>
      }
    >
      <GameTabsInner />
    </Suspense>
  );
}
