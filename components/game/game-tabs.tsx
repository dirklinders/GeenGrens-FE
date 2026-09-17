'use client';

import { Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const raw = searchParams.get('tab');
  const tab: GameTab = TAB_VALUES.includes(raw as GameTab) ? (raw as GameTab) : 'kaart';

  const handleTabChange = (value: string) => {
    router.replace(`${pathname}?tab=${value}`, { scroll: false });
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
