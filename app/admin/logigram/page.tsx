'use client';

import { useCallback, useEffect, useState } from 'react';
import useSWR from 'swr';
import {
  logigramCategoryApi,
  logigramEntryApi,
  logigramClueApi,
  logigramSyncApi,
  type LogigramCategoryAdminDTO,
  type LogigramEntryAdminDTO,
  type LogigramClueAdminDTO,
  type LogigramSyncResultDTO,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

// ────────────────────────────────────────────────────────────
// Constants — the player grids are built from these three keys
// ────────────────────────────────────────────────────────────

const KEY_LABELS: Record<string, string> = {
  suspect: 'Verdachten',
  weapon: 'Wapens',
  location: 'Locaties',
};

/** Reorder `item` within `siblings` by swapping sortOrder with the neighbour. */
async function reorderSiblings<T extends { id: number; sortOrder: number }>(
  siblings: T[],
  item: T,
  dir: -1 | 1,
  update: (data: T) => Promise<unknown>
) {
  const sorted = [...siblings].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
  const idx = sorted.findIndex((s) => s.id === item.id);
  const neighbour = sorted[idx + dir];
  if (idx < 0 || !neighbour) return;
  const a = { ...item, sortOrder: neighbour.sortOrder };
  const b = {
    ...neighbour,
    sortOrder:
      item.sortOrder === neighbour.sortOrder
        ? neighbour.sortOrder + (dir === 1 ? 1 : -1)
        : item.sortOrder,
  };
  await Promise.all([update(a), update(b)]);
}

// ────────────────────────────────────────────────────────────
// Clue form — ordered hint text
// ────────────────────────────────────────────────────────────

function ClueForm({
  initial,
  defaultSortOrder,
  onSave,
  onCancel,
}: {
  initial?: LogigramClueAdminDTO;
  defaultSortOrder?: number;
  onSave: (data: Omit<LogigramClueAdminDTO, 'id'> & { id?: number }) => Promise<void>;
  onCancel: () => void;
}) {
  const [text, setText] = useState(initial?.text ?? '');
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? defaultSortOrder ?? 0);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    try {
      await onSave({ id: initial?.id, text: text.trim(), sortOrder });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label className="text-stone-300 text-sm">
          Aanwijzing *{' '}
          <span className="text-stone-500 font-normal">
            (mag de puzzel oplosbaar maken, maar nooit de oplossing direct verklappen)
          </span>
        </Label>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="bijv. De barman had tijdens het feest geen glas wijn in de hand."
          required
          className="bg-stone-800 border-stone-700 text-stone-100 min-h-[70px]"
        />
      </div>
      <div className="w-40 space-y-1">
        <Label className="text-stone-300 text-sm">Volgorde</Label>
        <Input
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(Number(e.target.value))}
          className="bg-stone-800 border-stone-700 text-stone-100"
        />
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={saving || !text.trim()} className="bg-red-800 hover:bg-red-700 text-stone-100">
          {saving ? 'Opslaan...' : initial ? 'Bijwerken' : 'Aanmaken'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-stone-700 text-stone-300 hover:bg-stone-800"
        >
          Annuleren
        </Button>
      </div>
    </form>
  );
}

// ────────────────────────────────────────────────────────────
// Main page
// ────────────────────────────────────────────────────────────

export default function LogigramPage() {
  const { data: categories, mutate: mutateCategories, isLoading: categoriesLoading } = useSWR(
    'admin-logigram-categories',
    logigramCategoryApi.getAll,
    { revalidateOnFocus: false }
  );
  const { data: entries, mutate: mutateEntries } = useSWR('admin-logigram-entries', logigramEntryApi.getAll, {
    revalidateOnFocus: false,
  });
  const { data: clues, mutate: mutateClues } = useSWR('admin-logigram-clues', logigramClueApi.getAll, {
    revalidateOnFocus: false,
  });

  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<LogigramSyncResultDTO | null>(null);
  const [creatingClue, setCreatingClue] = useState(false);
  const [editingClueId, setEditingClueId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const categoryList = categories ?? [];
  const entryList = entries ?? [];
  const clueList = clues ?? [];

  const sortedCategories = [...categoryList].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
  const sortedClues = [...clueList].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);

  const entriesFor = (categoryId: number) =>
    entryList
      .filter((e) => e.logigramCategoryId === categoryId)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);

  // ── Sync with game content (suspects, weapons, locations) ──
  // Runs automatically on page load; also available as a manual button.
  const runSync = useCallback(async () => {
    setSyncing(true);
    setError('');
    try {
      const result = await logigramSyncApi.sync();
      setSyncResult(result);
      await Promise.all([mutateCategories(), mutateEntries(), mutateClues()]);
    } catch {
      setError('Synchroniseren mislukt.');
    } finally {
      setSyncing(false);
    }
  }, [mutateCategories, mutateEntries, mutateClues]);

  useEffect(() => {
    runSync();
  }, [runSync]);

  // ── Clue handlers ──
  const handleSaveClue = async (data: Omit<LogigramClueAdminDTO, 'id'> & { id?: number }) => {
    try {
      if (data.id) {
        await logigramClueApi.update(data as LogigramClueAdminDTO);
      } else {
        await logigramClueApi.create(data);
      }
      await mutateClues();
      setCreatingClue(false);
      setEditingClueId(null);
      setError('');
    } catch {
      setError('Opslaan van de aanwijzing mislukt.');
    }
  };

  const handleDeleteClue = async (clue: LogigramClueAdminDTO) => {
    if (!confirm('Aanwijzing verwijderen?')) return;
    try {
      await logigramClueApi.delete(clue.id);
      await mutateClues();
    } catch {
      setError('Verwijderen mislukt.');
    }
  };

  const handleMoveClue = async (clue: LogigramClueAdminDTO, dir: -1 | 1) => {
    try {
      await reorderSiblings(sortedClues, clue, dir, (d) => logigramClueApi.update(d));
      await mutateClues();
    } catch {
      setError('Herordenen mislukt.');
    }
  };

  const nextClueSortOrder = sortedClues.length > 0 ? Math.max(...sortedClues.map((c) => c.sortOrder)) + 1 : 0;

  const rowButton = 'text-xs px-1.5 py-0.5 rounded border border-stone-700 transition-colors disabled:opacity-30';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl text-stone-100">Logigram</h1>
        <p className="text-stone-500 text-sm mt-1">
          Het aanwijzingsbord voor de puzzel. De échte oplossing (dader, wapen, plek) stel je in
          bij <em>Instellingen</em>.
        </p>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* ══════════ Section: auto-filled grid ══════════ */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-stone-800 pb-2">
          <h2 className="font-serif text-lg text-stone-200">Raster (automatisch gevuld)</h2>
          <Button onClick={runSync} disabled={syncing} className="bg-red-800 hover:bg-red-700 text-stone-100">
            {syncing ? 'Synchroniseren...' : 'Nu synchroniseren'}
          </Button>
        </div>

        <Card className="bg-stone-900/60 border-stone-800">
          <CardContent className="pt-5 pb-5 space-y-2 text-sm text-stone-400">
            <p>
              Het logigram wordt <span className="text-stone-100 font-medium">automatisch gevuld</span> met
              de verdachten, wapens en locaties uit hun eigen beheer-tabbladen. Elke wijziging daar
              (toevoegen, hernoemen, verwijderen) wordt hier bij het laden — of via de knop hierboven —
              doorgevoerd. De volgorde volgt de id's van die items, dus die is stabiel.
            </p>
            <p>
              Je beheert hieronder alléén nog de <span className="text-stone-100 font-medium">aanwijzingen</span>.
            </p>
            {syncResult && (
              <p className="text-stone-500 text-xs pt-1">
                Laatste synchronisatie: {syncResult.created} nieuw · {syncResult.updated} bijgewerkt ·{' '}
                {syncResult.deleted} verwijderd · {syncResult.adopted} overgenomen uit eerdere handmatige items.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Per-category count summary (7×7×7 target) */}
        {sortedCategories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {sortedCategories.map((c) => {
              const n = entriesFor(c.id).length;
              const ok = n === 7;
              return (
                <span
                  key={c.id}
                  className={`text-xs border rounded px-2 py-1 ${
                    ok
                      ? 'border-emerald-800 bg-emerald-950/40 text-emerald-400'
                      : 'border-amber-800 bg-amber-950/30 text-amber-500'
                  }`}
                >
                  {KEY_LABELS[c.key] ?? c.name}: {n}/7
                </span>
              );
            })}
          </div>
        )}

        {categoriesLoading ? (
          <div className="animate-pulse bg-stone-900 border border-stone-800 rounded h-16" />
        ) : sortedCategories.length === 0 ? (
          <p className="text-stone-500 text-center py-8">
            Nog geen categorieën — voeg eerst verdachten, wapens en locaties toe en synchroniseer.
          </p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {sortedCategories.map((cat) => {
              const catEntries = entriesFor(cat.id);
              const isStandard = cat.key in KEY_LABELS;
              return (
                <Card key={cat.id} className="bg-stone-900 border-stone-800">
                  <CardHeader>
                    <CardTitle className="text-stone-100 text-base font-serif flex items-center gap-2 flex-wrap">
                      <span className="bg-stone-800 border border-stone-700 rounded px-2 py-0.5 font-mono text-xs text-amber-400">
                        {cat.key}
                      </span>
                      {cat.name}
                      {!isStandard && (
                        <span className="text-amber-500 text-xs">(onbekende sleutel — niet gebruikt in de spelersrasters)</span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {catEntries.length === 0 ? (
                      <p className="text-stone-500 text-sm py-4 text-center">
                        Nog geen items — voeg ze toe in het beheer van {KEY_LABELS[cat.key]?.toLowerCase() ?? cat.name} en synchroniseer.
                      </p>
                    ) : (
                      <ul className="space-y-1.5">
                        {catEntries.map((entry, i) => (
                          <li key={entry.id} className="flex items-center gap-2 text-sm">
                            <span className="text-stone-600 text-xs w-4 text-right shrink-0">{i + 1}.</span>
                            {entry.imageUrl && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={entry.imageUrl}
                                alt=""
                                className="w-6 h-6 rounded object-cover border border-stone-700 shrink-0"
                              />
                            )}
                            <span className="text-stone-200 truncate">{entry.name}</span>
                            {entry.entityId == null && (
                              <span
                                title="Handmatig item — wordt bij de volgende synchronisatie verwijderd"
                                className="ml-auto text-amber-500 text-xs shrink-0"
                              >
                                handmatig
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* ══════════ Section: clues ══════════ */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-stone-800 pb-2">
          <h2 className="font-serif text-lg text-stone-200">Aanwijzingen</h2>
          {!creatingClue && editingClueId === null && (
            <Button onClick={() => setCreatingClue(true)} className="bg-red-800 hover:bg-red-700 text-stone-100">
              + Nieuwe aanwijzing
            </Button>
          )}
        </div>

        {creatingClue && (
          <Card className="bg-stone-900 border-stone-800">
            <CardHeader>
              <CardTitle className="text-stone-100 text-lg font-serif">Nieuwe aanwijzing</CardTitle>
            </CardHeader>
            <CardContent>
              <ClueForm defaultSortOrder={nextClueSortOrder} onSave={handleSaveClue} onCancel={() => setCreatingClue(false)} />
            </CardContent>
          </Card>
        )}

        {editingClueId !== null && (
          <Card className="bg-stone-900 border-stone-800">
            <CardHeader>
              <CardTitle className="text-stone-100 text-lg font-serif">Aanwijzing bewerken</CardTitle>
            </CardHeader>
            <CardContent>
              {sortedClues
                .filter((c) => c.id === editingClueId)
                .map((clue) => (
                  <ClueForm
                    key={clue.id}
                    initial={clue}
                    onSave={handleSaveClue}
                    onCancel={() => setEditingClueId(null)}
                  />
                ))}
            </CardContent>
          </Card>
        )}

        <div className="space-y-2">
          {sortedClues.map((clue, i) => (
            <Card key={clue.id} className="bg-stone-900 border-stone-800">
              <CardContent className="py-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3 min-w-0">
                    <span className="text-stone-600 text-sm shrink-0">{i + 1}.</span>
                    <p className="text-stone-200 text-sm">{clue.text}</p>
                  </div>
                  <div className="flex gap-1 shrink-0 items-center">
                    <button
                      type="button"
                      title="Omhoog"
                      disabled={i === 0}
                      onClick={() => handleMoveClue(clue, -1)}
                      className={`${rowButton} text-stone-400 hover:text-stone-100`}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      title="Omlaag"
                      disabled={i === sortedClues.length - 1}
                      onClick={() => handleMoveClue(clue, 1)}
                      className={`${rowButton} text-stone-400 hover:text-stone-100`}
                    >
                      ↓
                    </button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setEditingClueId(clue.id); setCreatingClue(false); }}
                      className="border-stone-700 text-stone-300 hover:bg-stone-800"
                    >
                      Bewerken
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClue(clue)}
                      className="border-red-900 text-red-500 hover:bg-red-950"
                    >
                      Verwijderen
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {sortedClues.length === 0 && (
            <p className="text-stone-500 text-center py-8">
              Nog geen aanwijzingen. Voeg aanwijzingen toe waarmee spelers het raster kunnen invullen.
            </p>
          )}
        </div>
      </section>

      {/* ── Footer notes ── */}
      <Card className="bg-stone-900/50 border-stone-800">
        <CardContent className="pt-4 pb-4 text-sm text-stone-500 space-y-1">
          <p>
            <strong className="text-stone-400">Koppeling met de oplossing:</strong> de échte oplossing
            (dader, wapen, plek van de moord) stel je in bij <em>Instellingen</em>. De itemnamen in het
            raster komen rechtstreeks uit de Verdachten-, Wapens- en Locaties-tabbladen, dus ze matchen
            vanzelf met de oplossing daar.
          </p>
          <p>
            Handmatige items (zonder koppeling) worden bij de volgende synchronisatie verwijderd, samen
            met de teammarkeringen die ernaar verwijzen. Teammarkeringen zijn spelersdata en hier niet
            te beheren.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
