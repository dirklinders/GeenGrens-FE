'use client';

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// ────────────────────────────────────────────────────────────
// Content contracts (mirrored from the player rendering code)
// ────────────────────────────────────────────────────────────

/** Content type discriminator stored on LocationModel.ContentType */
export type LocationContentType = '' | 'interview' | 'search_picture';

export interface InterviewLine {
  speaker: string;
  /** May contain [[...]] spans that render as redacted (blacked-out) bars */
  text: string;
}

/** LocationModel.ContentJson contract for ContentType = "interview" */
export interface InterviewContent {
  header: string;
  meta: string;
  lines: InterviewLine[];
}

export interface SearchPictureHotspot {
  id: string;
  /** x-position as percentage of the image width (0–100) */
  x: number;
  /** y-position as percentage of the image height (0–100) */
  y: number;
  label: string;
  detail: string;
}

/** LocationModel.ContentJson contract for ContentType = "search_picture" */
export interface SearchPictureContent {
  note: string;
  image: string;
  hotspots: SearchPictureHotspot[];
}

// ────────────────────────────────────────────────────────────
// Parse / serialize helpers
// ────────────────────────────────────────────────────────────

const emptyInterview = (): InterviewContent => ({
  header: '',
  meta: '',
  lines: [{ speaker: 'Recherche', text: '' }],
});

export function parseInterview(raw: string): InterviewContent {
  try {
    const parsed = JSON.parse(raw) as Partial<InterviewContent> | null;
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.lines)) {
      return { header: '', meta: '', lines: [] };
    }
    return {
      header: typeof parsed.header === 'string' ? parsed.header : '',
      meta: typeof parsed.meta === 'string' ? parsed.meta : '',
      lines: parsed.lines
        .filter((l): l is InterviewLine => !!l && typeof l === 'object')
        .map((l) => ({
          speaker: typeof l.speaker === 'string' ? l.speaker : '',
          text: typeof l.text === 'string' ? l.text : '',
        })),
    };
  } catch {
    return { header: '', meta: '', lines: [] };
  }
}

export function parseSearchPicture(raw: string): SearchPictureContent {
  try {
    const parsed = JSON.parse(raw) as Partial<SearchPictureContent> | null;
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.hotspots)) {
      return { note: '', image: '', hotspots: [] };
    }
    return {
      note: typeof parsed.note === 'string' ? parsed.note : '',
      image: typeof parsed.image === 'string' ? parsed.image : '',
      hotspots: parsed.hotspots
        .filter((h): h is SearchPictureHotspot => !!h && typeof h === 'object')
        .map((h, i) => ({
          id: typeof h.id === 'string' && h.id ? h.id : `hs${i + 1}`,
          x: Number.isFinite(Number(h.x)) ? Number(h.x) : 50,
          y: Number.isFinite(Number(h.y)) ? Number(h.y) : 50,
          label: typeof h.label === 'string' ? h.label : '',
          detail: typeof h.detail === 'string' ? h.detail : '',
        })),
    };
  } catch {
    return { note: '', image: '', hotspots: [] };
  }
}

// ────────────────────────────────────────────────────────────
// Validation (Dutch messages) — runs before save
// ────────────────────────────────────────────────────────────

const balancedRedactions = (text: string) =>
  (text.match(/\[\[/g)?.length ?? 0) === (text.match(/\]\]/g)?.length ?? 0);

export function validateLocationContent(
  contentType: LocationContentType,
  contentJson: string
): string[] {
  const errors: string[] = [];
  if (contentType === '') return errors;

  let data: unknown;
  try {
    data = JSON.parse(contentJson);
  } catch {
    return ['De inhoud bevat ongeldige JSON. Los dit op of zet het inhoudstype terug op "Geen".'];
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return ['De inhoud moet een JSON-object zijn.'];
  }

  if (contentType === 'interview') {
    const d = data as Partial<InterviewContent>;
    if (!d.header || !String(d.header).trim()) {
      errors.push('Interview: de kop ("header") is verplicht.');
    }
    if (!d.meta || !String(d.meta).trim()) {
      errors.push('Interview: de meta-regel ("meta"), bijv. datum/tijd, is verplicht.');
    }
    if (!Array.isArray(d.lines) || d.lines.length === 0) {
      errors.push('Interview: voeg minimaal één verklaringsregel toe.');
    } else {
      d.lines.forEach((line, i) => {
        const n = i + 1;
        if (!line || !String(line.speaker ?? '').trim()) {
          errors.push(`Interview: regel ${n} mist een spreker.`);
        }
        if (!line || !String(line.text ?? '').trim()) {
          errors.push(`Interview: regel ${n} mist tekst.`);
        }
        if (line?.text && !balancedRedactions(line.text)) {
          errors.push(`Interview: regel ${n} heeft een onjuist aantal [[ ]]-markeringen.`);
        }
      });
    }
  }

  if (contentType === 'search_picture') {
    const d = data as Partial<SearchPictureContent>;
    const image = String(d.image ?? '').trim();
    if (!image) {
      errors.push('Zoekfoto: een afbeelding-URL is verplicht.');
    } else if (!image.startsWith('/') && !/^https?:\/\//i.test(image)) {
      errors.push('Zoekfoto: de afbeelding-URL moet beginnen met "/" of "http(s)://".');
    }
    if (!Array.isArray(d.hotspots)) {
      errors.push('Zoekfoto: "hotspots" moet een lijst zijn (mag leeg zijn).');
    } else {
      d.hotspots.forEach((h, i) => {
        const n = i + 1;
        if (!h || !String(h.label ?? '').trim()) {
          errors.push(`Zoekfoto: vondst ${n} mist een label.`);
        }
        const x = Number(h?.x);
        const y = Number(h?.y);
        if (!Number.isFinite(x) || x < 0 || x > 100) {
          errors.push(`Zoekfoto: vondst ${n} heeft een ongeldige x-positie (moet 0–100 zijn).`);
        }
        if (!Number.isFinite(y) || y < 0 || y > 100) {
          errors.push(`Zoekfoto: vondst ${n} heeft een ongeldige y-positie (moet 0–100 zijn).`);
        }
        if (h?.detail && !balancedRedactions(h.detail)) {
          errors.push(`Zoekfoto: vondst ${n} heeft een onjuist aantal [[ ]]-markeringen in de toelichting.`);
        }
      });
      const ids = d.hotspots.map((h) => String(h?.id ?? ''));
      if (new Set(ids).size !== ids.length) {
        errors.push("Zoekfoto: vondst-id's moeten uniek zijn.");
      }
    }
  }

  return errors;
}

// ────────────────────────────────────────────────────────────
// Redaction rendering (admin preview — bars hide the text)
// ────────────────────────────────────────────────────────────

function renderRedacted(text: string): ReactNode[] {
  const parts = text.split(/(\[\[[\s\S]*?\]\])/g);
  return parts.map((part, i) => {
    const match = /^\[\[([\s\S]*)\]\]$/.exec(part);
    if (match) {
      return (
        <span
          key={i}
          title="Geredigeerd"
          className="inline-block align-baseline bg-black border border-stone-600 text-transparent select-none rounded-sm px-1.5"
          style={{ minWidth: '2rem' }}
        >
          {match[1]}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

// ────────────────────────────────────────────────────────────
// Interview editor — header/meta + repeatable lines with a
// "Selection redigeren" toolbar button wrapping [[...]]
// ────────────────────────────────────────────────────────────

/** The two canonical interview speakers (om-en-om alternation). */
const SPEAKER_OPTIONS = ['Recherche', 'Getuige'] as const;

/** Om-en-om: flip the previous speaker (anything other than "Getuige" → "Getuige"). */
const flipSpeaker = (previous: string): string =>
  previous === 'Getuige' ? 'Recherche' : 'Getuige';

/**
 * Default speaker for a new line inserted at `insertIndex` (0-based):
 * flipped from the line ABOVE the insertion point ("Recherche" for the first
 * line of an empty list). Because the suggestion is always derived from the
 * current list state, manual overrides self-heal into the next suggestion.
 */
const nextSpeakerFor = (lines: InterviewLine[], insertIndex: number): string => {
  const above = insertIndex > 0 ? lines[insertIndex - 1]?.speaker : undefined;
  if (above === undefined) return 'Recherche';
  return flipSpeaker(above);
};

/** What om-en-om would predict for an existing line at `index`. */
const expectedSpeakerAt = (index: number): string =>
  index % 2 === 0 ? 'Recherche' : 'Getuige';

function InterviewEditor({
  value,
  onChange,
}: {
  value: InterviewContent;
  onChange: (v: InterviewContent) => void;
}) {
  const textRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  const updateLine = (index: number, patch: Partial<InterviewLine>) => {
    onChange({
      ...value,
      lines: value.lines.map((l, i) => (i === index ? { ...l, ...patch } : l)),
    });
  };

  // Om en om: a new line defaults to the flipped speaker of the line ABOVE the
  // insertion point (append → last line; empty list → "Recherche").
  const addLine = () =>
    onChange({
      ...value,
      lines: [
        ...value.lines,
        { speaker: nextSpeakerFor(value.lines, value.lines.length), text: '' },
      ],
    });

  // Mid-list insertion: default alternates from the line above the new one.
  const insertLineBelow = (index: number) =>
    onChange({
      ...value,
      lines: [
        ...value.lines.slice(0, index + 1),
        { speaker: nextSpeakerFor(value.lines, index + 1), text: '' },
        ...value.lines.slice(index + 1),
      ],
    });

  const removeLine = (index: number) =>
    onChange({ ...value, lines: value.lines.filter((_, i) => i !== index) });

  const moveLine = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= value.lines.length) return;
    const lines = [...value.lines];
    const tmp = lines[index];
    lines[index] = lines[target];
    lines[target] = tmp;
    onChange({ ...value, lines });
  };

  /** Wrap the current textarea selection in [[...]] (or insert a placeholder). */
  const redactSelection = (index: number) => {
    const ta = textRefs.current[index];
    const line = value.lines[index];
    if (!ta || !line) return;
    const start = ta.selectionStart ?? line.text.length;
    const end = ta.selectionEnd ?? line.text.length;
    const inner = start === end ? 'geheim' : line.text.slice(start, end);
    updateLine(index, { text: `${line.text.slice(0, start)}[[${inner}]]${line.text.slice(end)}` });
    requestAnimationFrame(() => {
      ta.focus();
      const selStart = start + 2;
      ta.setSelectionRange(selStart, selStart + inner.length + 2);
    });
  };

  const rowButton =
    'text-xs px-1.5 py-0.5 rounded border border-stone-700 transition-colors disabled:opacity-30';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-stone-300 text-sm">Kop *</Label>
          <Input
            value={value.header}
            onChange={(e) => onChange({ ...value, header: e.target.value })}
            placeholder="bijv. Politie-interview · Verklaring #4"
            className="bg-stone-800 border-stone-700 text-stone-100"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-stone-300 text-sm">Meta *</Label>
          <Input
            value={value.meta}
            onChange={(e) => onChange({ ...value, meta: e.target.value })}
            placeholder="bijv. Afdeling Zutphen · 25-04-2026 · 02:14"
            className="bg-stone-800 border-stone-700 text-stone-100"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-stone-300 text-sm">Verklaringsregels *</Label>
          <button
            type="button"
            onClick={addLine}
            className="text-xs text-stone-400 hover:text-stone-100 border border-stone-700 hover:border-stone-500 rounded px-2 py-1 transition-colors"
          >
            + Regel toevoegen
          </button>
        </div>
        <p className="text-stone-500 text-xs">
          Selecteer tekst en klik op{' '}
          <span className="text-amber-500">◼ Selectie redigeren</span> om die fragmenten zwart te
          maken met <code className="font-mono">[[...]]</code>.
        </p>

        {value.lines.map((line, i) => (
          <div key={i} className="bg-stone-950/60 border border-stone-800 rounded p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-stone-500 text-xs font-medium flex items-center gap-1.5">
                Regel {i + 1}
                {line.speaker !== '' && line.speaker !== expectedSpeakerAt(i) && (
                  <span
                    title="Deze spreker wijkt af van het om-en-om patroon (Recherche → Getuige → …)"
                    className="text-[10px] leading-none text-amber-500/90 border border-amber-800/60 bg-amber-950/40 rounded px-1 py-0.5"
                  >
                    wijkt af
                  </span>
                )}
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  title="Omhoog"
                  disabled={i === 0}
                  onClick={() => moveLine(i, -1)}
                  className={`${rowButton} text-stone-400 hover:text-stone-100`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  title="Omlaag"
                  disabled={i === value.lines.length - 1}
                  onClick={() => moveLine(i, 1)}
                  className={`${rowButton} text-stone-400 hover:text-stone-100`}
                >
                  ↓
                </button>
                <button
                  type="button"
                  title="Regel hieronder invoegen (spreker wisselt om)"
                  onClick={() => insertLineBelow(i)}
                  className={`${rowButton} text-stone-400 hover:text-stone-100`}
                >
                  ＋
                </button>
                <button
                  type="button"
                  title="Regel verwijderen"
                  onClick={() => removeLine(i)}
                  className={`${rowButton} text-red-600 hover:text-red-400 hover:border-red-800`}
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-stone-400 text-xs">Spreker</Label>
              <div className="flex gap-1" role="group" aria-label={`Spreker regel ${i + 1}`}>
                {SPEAKER_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => updateLine(i, { speaker: s })}
                    aria-pressed={line.speaker === s}
                    className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                      line.speaker === s
                        ? 'bg-red-900 border-red-800 text-stone-100'
                        : 'bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-stone-400 text-xs">Tekst</Label>
                <button
                  type="button"
                  onClick={() => redactSelection(i)}
                  title="Selectie tussen [[ ]] plaatsen (geredigeerd)"
                  className="text-xs text-amber-500 hover:text-amber-300 border border-stone-700 rounded px-2 py-0.5 transition-colors"
                >
                  ◼ Selectie redigeren
                </button>
              </div>
              <Textarea
                ref={(el) => {
                  textRefs.current[i] = el;
                }}
                value={line.text}
                onChange={(e) => updateLine(i, { text: e.target.value })}
                placeholder={'bijv. Waar was u om [[23:00]]?'}
                className="bg-stone-800 border-stone-700 text-stone-100 text-sm min-h-[60px]"
              />
            </div>
          </div>
        ))}

        {value.lines.length === 0 && (
          <p className="text-stone-500 text-xs text-center py-3 border border-dashed border-stone-800 rounded">
            Nog geen regels — klik op "Regel toevoegen".
          </p>
        )}
      </div>

      {/* Live preview with redaction bars */}
      <div className="space-y-1">
        <Label className="text-stone-400 text-xs">Voorvertoning (geredigeerde fragmenten zwart)</Label>
        <div className="rounded border border-stone-700 bg-stone-950 p-4 space-y-2">
          <p className="font-mono text-xs uppercase tracking-widest text-stone-500">
            {value.header || 'Kop…'}
          </p>
          <p className="font-mono text-[11px] text-stone-600">{value.meta || 'meta…'}</p>
          <div className="space-y-2 pt-1">
            {value.lines.length === 0 ? (
              <p className="text-stone-600 text-sm">— nog geen regels —</p>
            ) : (
              value.lines.map((l, i) => (
                <p key={i} className="text-sm text-stone-300 leading-relaxed">
                  <span className="text-amber-500/90 font-medium">{l.speaker || 'Spreker'}: </span>
                  {renderRedacted(l.text)}
                </p>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Search-picture editor — note, image with preview and a
// click-to-place hotspot editor (tap to add, drag to move,
// tap marker to select, per-row delete + numeric x/y)
// ────────────────────────────────────────────────────────────

function nextHotspotId(hotspots: SearchPictureHotspot[]): string {
  const taken = new Set(hotspots.map((h) => h.id));
  let n = hotspots.length + 1;
  while (taken.has(`hs${n}`)) n += 1;
  return `hs${n}`;
}

function SearchPictureEditor({
  value,
  onChange,
}: {
  value: SearchPictureContent;
  /** Accepts a value or an updater (drag updates use functional form) */
  onChange: (value: SetStateAction<SearchPictureContent>) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [placeModeId, setPlaceModeId] = useState<string | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ id: string; startX: number; startY: number; moved: boolean } | null>(null);
  const pressRef = useRef<{ x: number; y: number; moved: boolean } | null>(null);

  const updateHotspot = (id: string, patch: Partial<SearchPictureHotspot>) => {
    onChange((prev) => ({
      ...prev,
      hotspots: prev.hotspots.map((h) => (h.id === id ? { ...h, ...patch } : h)),
    }));
  };

  const removeHotspot = (id: string) => {
    onChange((prev) => ({ ...prev, hotspots: prev.hotspots.filter((h) => h.id !== id) }));
    setSelectedId((prev) => (prev === id ? null : prev));
    setPlaceModeId((prev) => (prev === id ? null : prev));
  };

  const addHotspotAt = (x: number, y: number) => {
    const id = nextHotspotId(value.hotspots);
    onChange((prev) => ({
      ...prev,
      hotspots: [...prev.hotspots, { id, x, y, label: '', detail: '' }],
    }));
    setSelectedId(id);
  };

  const coordsFromEvent = (e: { clientX: number; clientY: number }): { x: number; y: number } | null => {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return null;
    const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  };

  const onFramePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current) return;
    const c = coordsFromEvent(e);
    if (!c) return;
    pressRef.current = { x: c.x, y: c.y, moved: false };
  };

  const onFramePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (drag) {
      const c = coordsFromEvent(e);
      if (!c) return;
      if (!drag.moved && Math.hypot(c.x - drag.startX, c.y - drag.startY) > 2) {
        drag.moved = true;
      }
      if (drag.moved) updateHotspot(drag.id, c);
      return;
    }
    const press = pressRef.current;
    if (press && !press.moved) {
      if (Math.hypot(e.clientX - press.x, e.clientY - press.y) > 6) press.moved = true;
    }
  };

  const onFramePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (drag) {
      if (!drag.moved) {
        // Plain tap on a marker: toggle selection
        setSelectedId((prev) => (prev === drag.id ? null : drag.id));
        setPlaceModeId(null);
      }
      dragRef.current = null;
      return;
    }
    const press = pressRef.current;
    pressRef.current = null;
    if (!press || press.moved) return;
    const c = coordsFromEvent(e);
    if (!c) return;
    if (placeModeId) {
      updateHotspot(placeModeId, c);
      setPlaceModeId(null);
      return;
    }
    addHotspotAt(c.x, c.y);
  };

  const onFramePointerLeave = () => {
    // Cancel a pending press; an active drag keeps flowing via pointer capture.
    pressRef.current = null;
  };

  const onMarkerPointerDown = (e: ReactPointerEvent<HTMLButtonElement>, h: SearchPictureHotspot) => {
    e.stopPropagation();
    e.preventDefault();
    const start = coordsFromEvent(e) ?? { x: h.x, y: h.y };
    dragRef.current = { id: h.id, startX: start.x, startY: start.y, moved: false };
    frameRef.current?.setPointerCapture?.(e.pointerId);
  };

  const inputCls = 'bg-stone-800 border-stone-700 text-stone-100 text-sm';

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label className="text-stone-300 text-sm">Afbeelding-URL *</Label>
        <Input
          value={value.image}
          onChange={(e) => onChange((prev) => ({ ...prev, image: e.target.value }))}
          placeholder="/images/pages/werkkamer.jpg of https://..."
          className="bg-stone-800 border-stone-700 text-stone-100"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-stone-300 text-sm">Notitie (boven de foto)</Label>
        <Textarea
          value={value.note}
          onChange={(e) => onChange((prev) => ({ ...prev, note: e.target.value }))}
          placeholder="bijv. Politievondst: doorzocht de werkkamer op 25-04-2026."
          className="bg-stone-800 border-stone-700 text-stone-100 min-h-[60px]"
        />
      </div>

      {/* Click-to-place frame */}
      <div className="space-y-2">
        <Label className="text-stone-300 text-sm">Vondsten op de foto *</Label>
        {placeModeId ? (
          <p className="text-amber-500 text-xs">
            Klik nu op de foto om de vondst te verplaatsen — nogmaals op "Verplaatsen"
            klikken annuleert.
          </p>
        ) : (
          <p className="text-stone-500 text-xs">
            Klik op de foto om een vondst toe te voegen · sleep een marker om te verplaatsen ·
            tik op een marker om te selecteren.
          </p>
        )}
        <div
          ref={frameRef}
          onPointerDown={onFramePointerDown}
          onPointerMove={onFramePointerMove}
          onPointerUp={onFramePointerUp}
          onPointerLeave={onFramePointerLeave}
          className={`relative inline-block max-w-full select-none overflow-hidden rounded border ${
            placeModeId ? 'border-amber-500 border-dashed' : 'border-stone-700'
          } ${value.image ? '' : 'bg-stone-800'}`}
          style={{ cursor: 'crosshair' }}
        >
          {value.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value.image}
              alt="Zoekfoto voorvertoning"
              draggable={false}
              className="block max-w-full h-auto pointer-events-none"
            />
          ) : (
            <div className="w-full max-w-md aspect-[4/3] flex items-center justify-center text-stone-500 text-sm text-center px-6 pointer-events-none">
              Voer hierboven een afbeeldings-URL in. Op dit vlak kun je alvast klikken om
              vondsten te plaatsen.
            </div>
          )}
          {value.hotspots.map((h, i) => {
            const selected = selectedId === h.id;
            return (
              <button
                key={h.id}
                type="button"
                onPointerDown={(e) => onMarkerPointerDown(e, h)}
                style={{ left: `${h.x}%`, top: `${h.y}%`, touchAction: 'none' }}
                title={`${h.label || `Vondst ${i + 1}`} (${h.x}, ${h.y})`}
                className={`absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 text-[10px] font-bold flex items-center justify-center cursor-grab active:cursor-grabbing transition-shadow ${
                  selected
                    ? 'bg-amber-500 border-amber-200 text-stone-950 shadow-lg shadow-amber-500/40 z-10'
                    : 'bg-red-800 border-red-200 text-stone-50 hover:bg-red-700'
                }`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hotspot rows */}
      <div className="space-y-3">
        {value.hotspots.map((h, i) => {
          const selected = selectedId === h.id;
          const placing = placeModeId === h.id;
          return (
            <div
              key={h.id}
              className={`rounded border p-3 space-y-2 ${
                selected ? 'border-amber-700 bg-amber-950/20' : 'border-stone-800 bg-stone-950/60'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-stone-400 text-xs font-medium">
                  <span
                    className={`inline-flex w-5 h-5 rounded-full items-center justify-center text-[10px] font-bold ${
                      selected ? 'bg-amber-500 text-stone-950' : 'bg-red-800 text-stone-50'
                    }`}
                  >
                    {i + 1}
                  </span>
                  Vondst {i + 1} <span className="text-stone-600 font-mono">#{h.id}</span>
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setPlaceModeId(placing ? null : h.id)}
                    className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                      placing
                        ? 'bg-amber-950 border-amber-700 text-amber-400'
                        : 'border-stone-700 text-stone-400 hover:text-stone-100'
                    }`}
                  >
                    ✥ Verplaatsen
                  </button>
                  <button
                    type="button"
                    onClick={() => removeHotspot(h.id)}
                    className="text-xs px-2 py-0.5 rounded border border-stone-700 text-red-600 hover:text-red-400 hover:border-red-800 transition-colors"
                  >
                    ✕ Verwijderen
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-stone-400 text-xs">Label *</Label>
                <Input
                  value={h.label}
                  onChange={(e) => updateHotspot(h.id, { label: e.target.value })}
                  placeholder="bijv. Leeg glas wijn"
                  className={inputCls}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-stone-400 text-xs">Toelichting (zichtbaar na tikken)</Label>
                <Textarea
                  value={h.detail}
                  onChange={(e) => updateHotspot(h.id, { detail: e.target.value })}
                  placeholder="bijv. Vingerafdruk van de barman gevonden."
                  className={`${inputCls} min-h-[50px]`}
                />
              </div>
              <div className="flex gap-3">
                <div className="w-28 space-y-1">
                  <Label className="text-stone-400 text-xs">X (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step="any"
                    value={h.x}
                    onChange={(e) => updateHotspot(h.id, { x: Number(e.target.value) })}
                    className={inputCls}
                  />
                </div>
                <div className="w-28 space-y-1">
                  <Label className="text-stone-400 text-xs">Y (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step="any"
                    value={h.y}
                    onChange={(e) => updateHotspot(h.id, { y: Number(e.target.value) })}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          );
        })}
        {value.hotspots.length === 0 && (
          <p className="text-stone-500 text-xs text-center py-3 border border-dashed border-stone-800 rounded">
            Nog geen vondsten — klik op de foto om de eerste vondst te plaatsen.
          </p>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Main editor: type selector + active editor + raw JSON escape hatch
// ────────────────────────────────────────────────────────────

const TYPE_OPTIONS: { value: LocationContentType; label: string; hint: string }[] = [
  {
    value: '',
    label: 'Geen',
    hint: 'Alleen de gewone omschrijving (standaard gedrag).',
  },
  {
    value: 'interview',
    label: 'Interview',
    hint: 'Politieverklaring met sprekersbeurten; [[...]]-fragmenten verschijnen zwart (geredigeerd).',
  },
  {
    value: 'search_picture',
    label: 'Zoekfoto',
    hint: 'Foto met klikbare vondsten (hotspots) en een notitie.',
  },
];

export function LocationContentEditor({
  contentType,
  onContentTypeChange,
  contentJson,
  onContentJsonChange,
}: {
  contentType: LocationContentType;
  onContentTypeChange: (type: LocationContentType) => void;
  contentJson: string;
  onContentJsonChange: (json: string) => void;
}) {
  const [interview, setInterview] = useState<InterviewContent>(() => parseInterview(contentJson));
  const [picture, setPicture] = useState<SearchPictureContent>(() => parseSearchPicture(contentJson));
  const [rawDraft, setRawDraft] = useState<string | null>(null);
  const [rawError, setRawError] = useState('');
  const typeRef = useRef<LocationContentType>(contentType);

  // When the content type switches, seed the matching draft from the stored JSON
  // (or sensible empty defaults when nothing parseable exists).
  useEffect(() => {
    if (typeRef.current === contentType) return;
    typeRef.current = contentType;
    setRawDraft(null);
    setRawError('');
    if (contentType === 'interview') {
      const parsed = parseInterview(contentJson);
      setInterview(parsed.lines.length > 0 ? parsed : emptyInterview());
    } else if (contentType === 'search_picture') {
      setPicture(parseSearchPicture(contentJson));
    }
  }, [contentType, contentJson]);

  // Keep the parent's ContentJson string in sync with the structured drafts.
  useEffect(() => {
    const json =
      contentType === 'interview'
        ? JSON.stringify(interview)
        : contentType === 'search_picture'
          ? JSON.stringify(picture)
          : '';
    onContentJsonChange(json);
  }, [contentType, interview, picture, onContentJsonChange]);

  const prettyJson =
    contentType === 'interview'
      ? JSON.stringify(interview, null, 2)
      : contentType === 'search_picture'
        ? JSON.stringify(picture, null, 2)
        : '{}';

  const applyRaw = () => {
    if (rawDraft === null) return;
    try {
      const data: unknown = JSON.parse(rawDraft);
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('de inhoud moet een JSON-object zijn.');
      }
      const obj = data as Record<string, unknown>;
      if (contentType === 'interview' && !Array.isArray(obj.lines)) {
        throw new Error('een interview verwacht een "lines"-lijst.');
      }
      if (contentType === 'search_picture' && !Array.isArray(obj.hotspots)) {
        throw new Error('een zoekfoto verwacht een "hotspots"-lijst.');
      }
      if (contentType === 'interview') setInterview(parseInterview(rawDraft));
      if (contentType === 'search_picture') setPicture(parseSearchPicture(rawDraft));
      setRawDraft(null);
      setRawError('');
    } catch (err) {
      setRawError(err instanceof Error ? `Ongeldige JSON: ${err.message}` : 'Ongeldige JSON.');
    }
  };

  return (
    <div className="space-y-4 border-t border-stone-700 pt-4 mt-1">
      <div className="space-y-2">
        <Label className="text-stone-300 text-sm">Dossier-inhoud (onderzoekstabblad)</Label>
        <div className="flex flex-wrap gap-2">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onContentTypeChange(opt.value)}
              className={`px-3 py-1.5 rounded text-sm border transition-colors ${
                contentType === opt.value
                  ? 'bg-red-900 border-red-800 text-stone-100'
                  : 'bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="text-stone-500 text-xs">
          {TYPE_OPTIONS.find((o) => o.value === contentType)?.hint}
        </p>
      </div>

      {contentType === 'interview' && <InterviewEditor value={interview} onChange={setInterview} />}
      {contentType === 'search_picture' && (
        <SearchPictureEditor value={picture} onChange={setPicture} />
      )}

      <details className="bg-stone-950/60 border border-stone-800 rounded">
        <summary className="cursor-pointer select-none px-3 py-2 text-xs text-stone-500 hover:text-stone-300 transition-colors">
          Ruwe JSON bekijken / bewerken (voor gevorderden)
        </summary>
        <div className="px-3 pb-3 space-y-2">
          <Textarea
            value={rawDraft ?? prettyJson}
            onChange={(e) => {
              setRawDraft(e.target.value);
              setRawError('');
            }}
            spellCheck={false}
            className="bg-stone-900 border-stone-700 text-stone-200 font-mono text-xs min-h-[160px]"
          />
          {rawError && <p className="text-red-500 text-xs">{rawError}</p>}
          {rawDraft !== null && (
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={applyRaw}
                className="bg-red-800 hover:bg-red-700 text-stone-100"
              >
                Toepassen
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setRawDraft(null);
                  setRawError('');
                }}
                className="border-stone-700 text-stone-300 hover:bg-stone-800"
              >
                Terugdraaien
              </Button>
            </div>
          )}
          <p className="text-stone-600 text-xs">
            De gestructureerde velden hierboven blijven leidend; JSON-wijzigingen worden pas actief
            na "Toepassen".
          </p>
        </div>
      </details>
    </div>
  );
}
