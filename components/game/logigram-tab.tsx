'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import useSWR from 'swr';
import {
  gameApi,
  LogigramCategoryDTO,
  LogigramDTO,
  LogigramEntryDTO,
  LogigramMark,
} from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PaperSheet } from '@/components/game/paper-sheet';
import { cn } from '@/lib/utils';

/** Map key for a per-entry (row/column conclusion) mark — sent with entryBId: null. */
const headerKey = (entryId: number) => `h${entryId}`;

/** Map key for an unordered pair mark (entryA = min id, entryB = max id). */
const pairKey = (a: number, b: number) => `p${Math.min(a, b)}-${Math.max(a, b)}`;

/** Inverse of {@link pairKey}. */
const parsePairKey = (key: string): [number, number] => {
  const [a, b] = key.slice(1).split('-').map(Number);
  return [a, b];
};

type MarkMap = Record<string, LogigramMark>;

/** Manual tap cycle: empty → ✕ (definitely not) → ✓ (definite match) → empty. */
const MARK_CYCLE: Record<LogigramMark, LogigramMark> = {
  none: 'cross',
  cross: 'check',
  check: 'none',
};

/**
 * What a grid cell displays. "auto-cross" (derived minus) and "auto-check"
 * (inferred tick) are computed at render time, never persisted, and rendered
 * noticeably fainter than their manual counterparts.
 */
type CellDisplay = 'none' | 'cross' | 'auto-cross' | 'check' | 'auto-check';

/** Manual ✕/✓ render solid; the derived ✕/✓ render much fainter. */
const CELL_DISPLAY_STYLES: Record<CellDisplay, string> = {
  none: '',
  cross: 'text-red-400',
  'auto-cross': 'text-red-400/40',
  check: 'text-emerald-400',
  'auto-check': 'text-emerald-400/40',
};

/** The three puzzle sections, ordered: cat1 rows, cat2 columns, cat3 right/bottom. */
interface LogigramSections {
  categories: [LogigramCategoryDTO, LogigramCategoryDTO, LogigramCategoryDTO];
  lists: [LogigramEntryDTO[], LogigramEntryDTO[], LogigramEntryDTO[]];
}

/**
 * Builds the three ordered category sections for the inverted-L board from the
 * API payload. The puzzle always has exactly 3 categories, but every count is
 * rendered from the actual entries. Returns null when the board cannot be
 * drawn (fewer than 3 categories or an empty section).
 */
function buildSections(data: LogigramDTO): LogigramSections | null {
  const ordered = [...data.categories]
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
    .slice(0, 3);
  if (ordered.length < 3) return null;

  const byCategory = new Map<number, LogigramEntryDTO[]>();
  for (const entry of data.entries) {
    const list = byCategory.get(entry.categoryId) ?? [];
    list.push(entry);
    byCategory.set(entry.categoryId, list);
  }

  const sortEntries = (list: LogigramEntryDTO[]) =>
    [...list].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);

  const lists = ordered.map(category => sortEntries(byCategory.get(category.id) ?? []));
  if (lists.some(list => list.length === 0)) return null;

  return {
    categories: ordered as [LogigramCategoryDTO, LogigramCategoryDTO, LogigramCategoryDTO],
    lists: lists as [LogigramEntryDTO[], LogigramEntryDTO[], LogigramEntryDTO[]],
  };
}

/** Derived (render-time only) marks: never persisted, purely visual. */
interface DerivedMarks {
  /** Logically excluded cells ("auto ✕"), fainter than manual ✕s. */
  minusses: Set<string>;
  /** Inferred matches ("auto ✓" — e.g. person→weapon + person→location
   *  implies weapon→location), fainter than manual ✓s. */
  checks: Set<string>;
}

/**
 * Computes every pair cell that is logically excluded (an "auto ✕") or
 * logically implied (an "auto ✓") given the manual marks. Classic logigram
 * derivation, iterated to a fixpoint:
 *
 * 1. Same-grid exclusion: a ✓ (plus) between x and y rules out every other
 *    cell in x's row and y's column of that pair's grid.
 * 2. Equivalence mirror (the cross-grid consequences): a ✓ between x and y
 *    means x and y occupy the same slot, so for every item v of the third
 *    category the marks of (x, v) and (y, v) must agree — a ✕ on either side
 *    derives a ✕ on the other, and a ✓ on either side implies a ✓ on the
 *    other. Implied ✓s feed back into rules 1 and 2.
 * 3. Transitivity: two ✓ links sharing an item imply a ✓ between the two
 *    other items (when those belong to different categories) — e.g.
 *    person→weapon + person→location implies weapon→location.
 *
 * Manual ✕s act as propagation seeds, so a plus placed in one grid also pulls
 * existing minusses across the shared axes into the other grids. Both results
 * are derived at render time and NEVER persisted; removing the ✓ removes
 * every auto ✕/✓ it caused.
 */
function deriveAutoMarks(
  lists: [LogigramEntryDTO[], LogigramEntryDTO[], LogigramEntryDTO[]],
  manual: MarkMap,
): DerivedMarks {
  const derivedMinus = new Set<string>();

  const catIndexOfEntry = new Map<number, number>();
  const knownIds = new Set<number>();
  lists.forEach((list, ci) =>
    list.forEach(entry => {
      catIndexOfEntry.set(entry.id, ci);
      knownIds.add(entry.id);
    }),
  );

  const manualPlus = new Set<string>();
  const manualMinus = new Set<string>();
  for (const [key, mark] of Object.entries(manual)) {
    if (!key.startsWith('p')) continue; // header conclusions never derive anything
    const [a, b] = parsePairKey(key);
    if (!knownIds.has(a) || !knownIds.has(b)) continue; // stale id — ignore
    if (mark === 'check') manualPlus.add(key);
    else if (mark === 'cross') manualMinus.add(key);
  }

  const impliedPlus = new Set<string>();
  const isPlus = (key: string) => manualPlus.has(key) || impliedPlus.has(key);
  const isMinus = (key: string) => manualMinus.has(key) || derivedMinus.has(key);
  const addMinus = (key: string) => {
    if (isMinus(key) || isPlus(key)) return false; // never contradict an existing mark
    derivedMinus.add(key);
    return true;
  };
  const addPlus = (key: string) => {
    if (isPlus(key) || isMinus(key)) return false;
    impliedPlus.add(key);
    return true;
  };

  let changed = true;
  let guard = 0;
  while (changed && guard++ < 100) {
    changed = false;
    const pluses = [...manualPlus, ...impliedPlus];

    // 1. Same-grid row/column exclusion + 2. third-category mirror.
    for (const key of pluses) {
      const [aId, bId] = parsePairKey(key);
      const ca = catIndexOfEntry.get(aId)!;
      const cb = catIndexOfEntry.get(bId)!;

      for (const z of lists[ca]) {
        if (z.id !== aId && addMinus(pairKey(z.id, bId))) changed = true;
      }
      for (const w of lists[cb]) {
        if (w.id !== bId && addMinus(pairKey(aId, w.id))) changed = true;
      }

      const cc = 3 - ca - cb;
      for (const v of lists[cc]) {
        const kx = pairKey(aId, v.id);
        const ky = pairKey(bId, v.id);
        if (isMinus(kx) !== isMinus(ky)) {
          if (addMinus(kx) || addMinus(ky)) changed = true;
        }
        if (isPlus(kx) !== isPlus(ky)) {
          if (addPlus(kx) || addPlus(ky)) changed = true;
        }
      }
    }

    // 3. Transitivity through a shared item.
    for (let i = 0; i < pluses.length; i++) {
      for (let j = i + 1; j < pluses.length; j++) {
        const [a1, b1] = parsePairKey(pluses[i]);
        const [a2, b2] = parsePairKey(pluses[j]);
        let other1: number, other2: number;
        if (a1 === a2 || a1 === b2) {
          other1 = b1;
          other2 = a1 === a2 ? b2 : a2;
        } else if (b1 === a2 || b1 === b2) {
          other1 = a1;
          other2 = b1 === a2 ? b2 : a2;
        } else {
          continue; // unrelated pluses
        }
        if (other1 === other2) continue;
        // Same category would be a contradiction (one slot, two items) — skip.
        if (catIndexOfEntry.get(other1) === catIndexOfEntry.get(other2)) continue;
        if (addPlus(pairKey(other1, other2))) changed = true;
      }
    }
  }

  return { minusses: derivedMinus, checks: impliedPlus };
}

/**
 * "Logigram" tab of the game shell: one classic inverted-L board (see
 * logikloeser) built from `GET /api/game/Logigram` —
 *
 *   ┌───────────┬───────────┐
 *   │ corner    │ cat2 →    │ cat3 ↕   │   ← category label strip
 *   │ cat1 ↓    │ [cat1×cat2] [cat1×cat3] │   ← shared column-header strip
 *   │           │ top-left  │ top-right │   ← cat1 rows (shared row headers)
 *   ├───────────┼───────────┤
 *   │ cat3 rows │ bottom-left│  (empty) │
 *   └───────────┴───────────┘
 *
 * Everything is a single CSS grid inside one overflow-x container, so the
 * shared row-header strip (cat1) and the shared column-header strip (cat2)
 * are literally the same grid tracks — they align pixel-perfectly and the
 * whole L scrolls as one unit on phones.
 *
 * Cell taps cycle none → ✕ → ✓ → empty on the manual marks. A ✓ derives ✕s
 * (same row/column plus cross-grid consequences) and infers further ✓s
 * (transitivity: person→weapon + person→location implies weapon→location) —
 * all computed at render time, shown fainter and never persisted, so removing
 * the ✓ removes them automatically. Only manual ✓/✕ marks (and header
 * conclusions) are saved per team via debounced (500 ms) bulk-replace saves.
 * The solution is never rendered — the API doesn't send it.
 */
export function LogigramTab() {
  const { data, isLoading, mutate } = useSWR('logigram', () => gameApi.getLogigram(), {
    revalidateOnFocus: false,
  });

  // Optimistic local MANUAL mark state, hydrated once from the server. Local
  // edits are never clobbered by re-renders or background revalidation.
  // Derived (auto ✕/✓) marks are never part of this state.
  const [marks, setMarks] = useState<MarkMap | null>(null);
  const dirtyRef = useRef(false);
  const [saveFailed, setSaveFailed] = useState(false);
  // Resize real grid tracks instead of transforming the board: borders stay
  // one pixel wide and the scrollable area always matches the visible puzzle.
  const [cellSize, setCellSize] = useState(44);
  const zoom = cellSize / 44;
  const viewportRef = useRef<HTMLDivElement>(null);
  const cellSizeRef = useRef(cellSize);
  const pendingScroll = useRef<{ left: number; top: number } | null>(null);
  const suppressClickUntil = useRef(0);

  useLayoutEffect(() => {
    cellSizeRef.current = cellSize;
    const viewport = viewportRef.current;
    if (viewport && pendingScroll.current) {
      viewport.scrollLeft = pendingScroll.current.left;
      viewport.scrollTop = pendingScroll.current.top;
      pendingScroll.current = null;
    }
  }, [cellSize]);

  // Hydration + legacy cleanup. Historical versions persisted the derived
  // ✕s ("ghost minusses"): stored crosses that re-derive from the stored ✓s
  // are dropped here (they come back as purely visual auto ✕s), everything
  // else is a genuine manual mark. Dropping ghosts arms the debounced save
  // below, which bulk-replaces the server state without them.
  useEffect(() => {
    if (!data || marks !== null) return;

    const stored: MarkMap = {};
    for (const m of data.marks) {
      stored[m.entryBId == null ? headerKey(m.entryAId) : pairKey(m.entryAId, m.entryBId)] =
        m.mark;
    }

    const sections = buildSections(data);
    const initial: MarkMap = {};
    let ghosts = 0;
    if (sections) {
      // Seed the derivation with the stored ✓s only: every legacy auto ✕ was
      // written alongside its ✓, so anything re-derivable from the ✓s alone
      // is redundant (manual ✕s that don't follow from ✓s are kept).
      const checksOnly: MarkMap = {};
      for (const [key, mark] of Object.entries(stored)) {
        if (key.startsWith('p') && mark === 'check') checksOnly[key] = mark;
      }
      const derivable = deriveAutoMarks(sections.lists, checksOnly);
      for (const [key, mark] of Object.entries(stored)) {
        if (key.startsWith('p') && mark === 'cross' && derivable.minusses.has(key)) {
          ghosts++;
          continue;
        }
        initial[key] = mark;
      }
    } else {
      Object.assign(initial, stored);
    }

    if (ghosts > 0) dirtyRef.current = true; // purge legacy ghosts on next save
    setMarks(initial);
  }, [data, marks]);

  // Debounced (500 ms) persistence — the full MANUAL state is sent as a bulk
  // replace, so the server can safely upsert/remove rows to match exactly.
  // Derived ✕s are never in the payload, so they can never become stale
  // server-side; a removed ✓ clears its consequences for every team member.
  useEffect(() => {
    if (marks === null || !dirtyRef.current) return;

    const timer = setTimeout(async () => {
      const payload = Object.entries(marks)
        .filter(([, mark]) => mark !== 'none')
        .map(([key, mark]) => {
          if (key.startsWith('h')) {
            return { entryAId: Number(key.slice(1)), entryBId: null as number | null, mark };
          }
          const [a, b] = parsePairKey(key);
          return { entryAId: a, entryBId: b as number | null, mark };
        });

      try {
        await gameApi.saveLogigramMarks(payload);
        dirtyRef.current = false;
        setSaveFailed(false);
        // Keep the SWR cache consistent without a refetch.
        await mutate(prev => (prev ? { ...prev, marks: payload } : prev), {
          revalidate: false,
        });
      } catch {
        setSaveFailed(true);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [marks, mutate]);

  const sections = useMemo(() => (data ? buildSections(data) : null), [data]);
  const boardReady = !!sections && marks !== null && !isLoading;

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!boardReady || !viewport) return;
    let pinch: { distance: number; size: number; x: number; y: number } | null = null;
    let pinching = false;
    const measure = (touches: TouchList) => {
      const a = touches[0];
      const b = touches[1];
      const rect = viewport.getBoundingClientRect();
      return {
        distance: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
        x: (a.clientX + b.clientX) / 2 - rect.left - viewport.clientLeft,
        y: (a.clientY + b.clientY) / 2 - rect.top - viewport.clientTop,
      };
    };
    const start = (event: TouchEvent) => {
      if (event.touches.length !== 2) return;
      event.preventDefault();
      const point = measure(event.touches);
      pinch = {
        distance: Math.max(1, point.distance),
        size: cellSizeRef.current,
        x: viewport.scrollLeft + point.x,
        y: viewport.scrollTop + point.y,
      };
      pinching = true;
      suppressClickUntil.current = Infinity;
    };
    const move = (event: TouchEvent) => {
      if (!pinching) return; // Keep native one-finger scrolling.
      event.preventDefault();
      if (!pinch || event.touches.length !== 2) return;
      const point = measure(event.touches);
      const size = Math.max(24, Math.min(88, Math.round(pinch.size * point.distance / pinch.distance)));
      const ratio = size / pinch.size;
      const scroll = { left: pinch.x * ratio - point.x, top: pinch.y * ratio - point.y };
      if (size === cellSizeRef.current) {
        viewport.scrollLeft = scroll.left;
        viewport.scrollTop = scroll.top;
      } else {
        pendingScroll.current = scroll;
        setCellSize(size);
      }
    };
    const end = (event: TouchEvent) => {
      if (!pinching) return;
      if (event.cancelable) event.preventDefault();
      pinch = null;
      if (event.touches.length === 0 || event.type === 'touchcancel') {
        pinching = false;
        // A pinch must never turn into an accidental mark on release.
        suppressClickUntil.current = Date.now() + 500;
      } else if (event.touches.length === 2) {
        start(event);
      }
    };
    // React delegates touch events passively; native non-passive listeners
    // let this board handle pinch without zooming the entire page.
    viewport.addEventListener('touchstart', start, { passive: false });
    viewport.addEventListener('touchmove', move, { passive: false });
    viewport.addEventListener('touchend', end, { passive: false });
    viewport.addEventListener('touchcancel', end, { passive: false });
    return () => {
      viewport.removeEventListener('touchstart', start);
      viewport.removeEventListener('touchmove', move);
      viewport.removeEventListener('touchend', end);
      viewport.removeEventListener('touchcancel', end);
      suppressClickUntil.current = 0;
    };
  }, [boardReady]);

  // Auto ✕s and inferred ✓s, derived at render time from the manual ✓/✕ set.
  const derived = useMemo<DerivedMarks>(() => {
    if (!sections || !marks) return { minusses: new Set<string>(), checks: new Set<string>() };
    return deriveAutoMarks(sections.lists, marks);
  }, [sections, marks]);

  // ── Mark mutations ──
  const applyMark = (key: string, mark: LogigramMark) => {
    dirtyRef.current = true;
    setMarks(prev => {
      const next = { ...(prev ?? {}) };
      if (mark === 'none') delete next[key];
      else next[key] = mark;
      return next;
    });
  };

  /**
   * Manual cycle (empty → ✕ → ✓ → empty). A cell showing an auto ✕ has
   * manual state "none", so its first tap stores a solid manual ✕, the next
   * goes to ✓ — exactly auto ✕ → manual ✕ → ✓ → empty. A cell showing an
   * inferred (auto) ✓ confirms it on the first tap: auto ✓ → manual ✓ → empty.
   */
  const handleCellTap = (rowEntry: LogigramEntryDTO, colEntry: LogigramEntryDTO) => {
    if (!marks) return;
    const key = pairKey(rowEntry.id, colEntry.id);
    if ((marks[key] ?? 'none') === 'none' && derived.checks.has(key)) {
      applyMark(key, 'check'); // confirm the inferred tick
      return;
    }
    applyMark(key, MARK_CYCLE[marks[key] ?? 'none']);
  };

  const cellDisplay = (rowId: number, colId: number): CellDisplay => {
    const manual = marks?.[pairKey(rowId, colId)] ?? 'none';
    if (manual !== 'none') return manual === 'check' ? 'check' : 'cross';
    const key = pairKey(rowId, colId);
    if (derived.minusses.has(key)) return 'auto-cross';
    return derived.checks.has(key) ? 'auto-check' : 'none';
  };

  // ── Loading skeleton ──
  if (isLoading || (data && marks === null)) {
    return (
      <Card className="bg-stone-900 border-stone-800">
        <CardHeader>
          <CardTitle className="font-serif text-xl text-stone-100">Logigram</CardTitle>
          <CardDescription className="text-stone-400">Aanwijzingsbord laden...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[0, 1].map(block => (
            <div key={block} className="space-y-1.5">
              <div className="h-4 w-40 rounded bg-stone-800/80 animate-pulse" />
              <div className="grid grid-cols-8 gap-1.5 max-w-md">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-sm bg-stone-800/60 animate-pulse"
                    style={{ animationDelay: `${(block * 24 + i) * 40}ms` }}
                  />
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const clues = data?.clues ?? [];

  // ── Empty state: nothing (or not enough) configured by the admin ──
  if (!sections) {
    return (
      <Card className="bg-stone-900 border-stone-800 border-dashed">
        <CardHeader>
          <CardTitle className="font-serif text-xl text-stone-100">Logigram</CardTitle>
          <CardDescription className="text-stone-400">
            Kruis uit wat niet kan, vink aan wat vaststaat.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-stone-500 font-serif italic">
            Het aanwijzingsbord wordt automatisch gevuld met de verdachten, wapens en locaties
            uit het spel. Er zijn nog niet genoeg van die items — de recherche voegt ze eerst toe
            in het admin-paneel, daarna verschijnt hier het kruisvlak.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ── Full tab: the inverted-L board ──
  const [catA, catB, catC] = sections.categories;
  const [rowsA, colsB, catCEntries] = sections.lists;
  const nA = rowsA.length;
  const nB = colsB.length;
  const nC = catCEntries.length;

  // 1-based grid coordinates (column 1 = shared row-header strip).
  const colB = (i: number) => 2 + i; // cat2 columns — shared by both left grids
  const colC = (i: number) => 2 + nB + i; // cat3 columns (top-right block)
  const rowA = (i: number) => 3 + i; // cat1 rows — shared by both top grids
  const rowC = (i: number) => 3 + nA + i; // cat3 rows (bottom-left block)

  const at = (column: string, row: string): CSSProperties => ({
    gridColumn: column,
    gridRow: row,
  });

  const renderCell = (rowEntry: LogigramEntryDTO, colEntry: LogigramEntryDTO, style: CSSProperties) => {
    const display = cellDisplay(rowEntry.id, colEntry.id);
    return (
      <button
        key={`cell-${rowEntry.id}-${colEntry.id}`}
        type="button"
        onClick={() => handleCellTap(rowEntry, colEntry)}
        aria-label={`${rowEntry.name} en ${colEntry.name}: ${
          display === 'check'
            ? 'vaststaat'
            : display === 'cross'
              ? 'uitgesloten'
              : display === 'auto-cross'
                ? 'automatisch uitgesloten'
                : display === 'auto-check'
                  ? 'automatisch aangevinkt — tik om te bevestigen'
                  : 'geen markering'
        }`}
        style={{ ...style, fontSize: Math.round(16 * zoom) }}
        className={cn(
          'bg-stone-950 hover:bg-stone-900 transition-colors min-h-0 min-w-0 overflow-hidden flex items-center justify-center font-serif focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-amber-400',
          CELL_DISPLAY_STYLES[display],
        )}
      >
        {display === 'check' || display === 'auto-check'
          ? '✓'
          : display === 'none'
            ? ''
            : '✕'}
      </button>
    );
  };

  const renderRowHeader = (entry: LogigramEntryDTO, row: number) => (
    <div
      key={`rowh-${entry.id}`}
      title={entry.name}
      style={at('1', String(row))}
      className="relative min-w-0 min-h-0 overflow-hidden bg-stone-900 px-2 py-1 flex items-center text-left"
    >
      <span className="font-serif text-stone-300 leading-tight line-clamp-2 break-words" style={{ fontSize: Math.max(10, Math.round(12 * zoom)) }}>
        {entry.name}
      </span>
    </div>
  );

  const renderColHeader = (entry: LogigramEntryDTO, column: number) => (
    <div
      key={`colh-${entry.id}`}
      title={entry.name}
      style={at(String(column), '2')}
      className="relative min-w-0 min-h-0 overflow-hidden bg-stone-900 px-1 py-1.5 flex items-end justify-center"
    >
      <span
        className="font-serif text-stone-300 leading-tight max-h-full overflow-hidden"
        style={{ writingMode: 'vertical-rl', fontSize: Math.max(10, Math.round(11 * zoom)) }}
      >
        {entry.name}
      </span>
    </div>
  );

  return (
    <div className="min-w-0 max-w-full space-y-6">
      <Card className="bg-stone-900 border-stone-800">
        <CardHeader>
          <CardTitle className="font-serif text-xl text-stone-100">Logigram</CardTitle>
          <CardDescription className="text-stone-400">
            Kruis uit wat niet kan, vink aan wat vaststaat.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1.5 text-sm text-stone-400 font-serif">
          <p>
            Tik op een hokje: leeg → <span className="text-red-400">✕</span> uitgesloten →{' '}
            <span className="text-emerald-400">✓</span> vaststaat → leeg. Een ✓ kruist de rest
            van die rij en kolom automatisch af — in alle vlakken tegelijk.
          </p>
          <p className="text-stone-500">
            De <span className="text-red-400/40">lichte ✕</span> en{' '}
            <span className="text-emerald-400/40">lichte ✓</span> zijn automatisch: ze volgen uit
            je ✓ (persoon→wapen + persoon→plek impliceert wapen→plek) en zijn geen echte
            markeringen — weg ⇢ de ✓, en ze verdwijnen vanzelf. Tik op een lichte ✕ om er een
            echte <span className="text-red-400">✕</span> van te maken, of op een lichte ✓ om hem
            te bevestigen als echte <span className="text-emerald-400">✓</span>.
          </p>
          <p className={cn('text-xs', saveFailed ? 'text-red-500' : 'text-stone-600')}>
            {saveFailed
              ? 'Opslaan mislukt — controleer je verbinding; je tikken blijven bewaard op deze pagina.'
              : 'Wijzigingen worden automatisch opgeslagen.'}
          </p>
        </CardContent>
      </Card>

      {/* Admin-authored clues */}
      {clues.length > 0 && (
        <PaperSheet className="rounded-sm">
          <h2 className="font-serif text-lg font-bold text-stone-900 tracking-wide">
            Aanwijzingen
          </h2>
          <ol className="mt-3 space-y-2 list-decimal list-outside pl-5 font-serif text-sm text-stone-800 leading-relaxed">
            {clues.map(clue => (
              <li key={clue.id}>{clue.text}</li>
            ))}
          </ol>
        </PaperSheet>
      )}

      {/* The inverted-L board: one grid, one scroll unit */}
      <Card className="min-w-0 overflow-hidden bg-stone-900 border-stone-800">
        <CardContent className="min-w-0 px-3 pt-4 sm:px-6 sm:pt-6">
          <p className="mb-3 text-xs text-stone-400">Knijp met twee vingers om te zoomen. Veeg met één vinger om het bord te verschuiven.</p>
          <div
            ref={viewportRef}
            className="max-h-[70svh] w-full min-w-0 overflow-auto rounded-sm border border-stone-800"
            style={{ touchAction: 'pan-x pan-y' }}
            tabIndex={0}
            role="region"
            aria-label="Logigram puzzel, knijp om te zoomen en veeg om te verschuiven"
            onClickCapture={event => {
              if (Date.now() < suppressClickUntil.current) {
                event.preventDefault();
                event.stopPropagation();
              }
            }}
            onKeyDown={event => {
              if (event.key === '+' || event.key === '=' || event.key === '-') {
                event.preventDefault();
                setCellSize(size => Math.max(24, Math.min(88, size + (event.key === '-' ? -4 : 4))));
              }
            }}
          >
            <div
              className="grid w-max gap-px bg-stone-800 select-none"
              style={{
                gridTemplateColumns: `${Math.round(128 * zoom)}px repeat(${nB + nC}, ${cellSize}px)`,
                gridTemplateRows: `${Math.max(24, Math.round(28 * zoom))}px ${Math.round(128 * zoom)}px repeat(${nA + nC}, ${cellSize}px)`,
              }}
            >
              {/* Bottom-right area: intentionally empty */}
              <div
                aria-hidden="true"
                className="bg-stone-900"
                style={at(`${colC(0)} / span ${nC}`, `${rowC(0)} / span ${nC}`)}
              />

              {/* Corner: cat1 is the row axis of both top grids */}
              <div
                className="bg-stone-900 flex items-center justify-center px-2"
                style={at('1', '1 / span 2')}
              >
                <span className="font-serif text-[10px] uppercase tracking-widest text-stone-500 text-center leading-tight">
                  {catA.name} ↓
                </span>
              </div>

              {/* Category labels: cat2 → (columns of both left grids), cat3 ↕ (columns of the top-right AND rows of the bottom-left grid) */}
              <div
                className="bg-stone-900 flex items-end justify-center px-1 pb-1 min-w-0"
                style={at(`${colB(0)} / span ${nB}`, '1')}
              >
                <span className="font-serif text-[10px] uppercase tracking-widest text-stone-500 truncate">
                  {catB.name} →
                </span>
              </div>
              <div
                className="bg-stone-900 flex items-end justify-center px-1 pb-1 min-w-0"
                style={at(`${colC(0)} / span ${nC}`, '1')}
              >
                <span className="font-serif text-[10px] uppercase tracking-widest text-stone-500 truncate">
                  {catC.name} ↕
                </span>
              </div>

              {/* Shared column-header strip (row 2) above both left grids and the top-right grid */}
              {colsB.map((entry, i) => renderColHeader(entry, colB(i)))}
              {catCEntries.map((entry, i) => renderColHeader(entry, colC(i)))}

              {/* Top block: cat1 rows × (cat2 columns | cat3 columns) — shared row headers */}
              {rowsA.map((rowEntry, ri) => [
                renderRowHeader(rowEntry, rowA(ri)),
                ...colsB.map((colEntry, ci) =>
                  renderCell(rowEntry, colEntry, at(String(colB(ci)), String(rowA(ri)))),
                ),
                ...catCEntries.map((colEntry, ci) =>
                  renderCell(rowEntry, colEntry, at(String(colC(ci)), String(rowA(ri)))),
                ),
              ])}

              {/* Bottom block: cat3 rows × cat2 columns — reuses the column-header strip above */}
              {catCEntries.map((rowEntry, ri) => [
                renderRowHeader(rowEntry, rowC(ri)),
                ...colsB.map((colEntry, ci) =>
                  renderCell(rowEntry, colEntry, at(String(colB(ci)), String(rowC(ri)))),
                ),
              ])}
            </div>
          </div>
          <div className="mt-3 font-serif text-xs text-stone-400" aria-label="Legenda">
            <p className="mb-2 font-semibold text-stone-300">Legenda</p>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {([
                ['check', '✓', 'Vaststaat — eigen markering'],
                ['cross', '✕', 'Uitgesloten — eigen markering'],
                ['auto-check', '✓', 'Automatisch aangevinkt'],
                ['auto-cross', '✕', 'Automatisch uitgesloten'],
              ] as const).map(([display, symbol, label]) => (
                <li key={display} className="flex items-center gap-2">
                  <span aria-hidden="true" className={cn('flex size-8 shrink-0 items-center justify-center rounded-sm border border-stone-800 bg-stone-950 text-base', CELL_DISPLAY_STYLES[display])}>
                    {symbol}
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

