'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { gameSettingApi, characterApi, weaponApi, locationApi, type GameSettingDTO } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// ────────────────────────────────────────────────────────────
// Fallback texts (mirror of GameDefaults in the API). Shown as placeholders —
// an empty field renders the built-in default for players.
// ────────────────────────────────────────────────────────────

const DEFAULT_INTRO_TITLE = 'Telegram uit het politiebureau';

const DEFAULT_INTRO_BODY = `AAN: ALLE LEDEN VAN HET ONDERZOEKSTEAM
VAN: RECHERCHEUR DE GROOT, ZUTPHEN
ONDERWERP: ZAAK VERMEER — VERTROUWELIJK

TEAM. GOED LUISTEREN.

AFGELOPEN NACHT VONDEN WIJ VIKTOR VERMEER DOOD. DE PERS SPREEKT VAN EEN HARTAANVAL. WIJ SPREKEN VAN MOORD.

HET BLOED OP DE PLEK KLOPT NIET MET HET LICHAAM. HIJ IS DAAR NIET VERMOORD. IEMAND HEEFT HEM NA DE DAAD VERPLAATST. EN DAT KAN NIET ZONDER TIJD, RUST EN EEN GOEDE REDEN.

JULLIE KRIJGEN DE KAART VAN DE STAD. ELKE LOCATIE HUISVEST EEN VERDACHTE. ONTGRENDEL DE LOCATIES, LEES DE VERKLARINGEN, DOORZOEK DE FOTO'S EN HOUD HET LOGIGRAM BIJ.

EEN KANS. EEN AANKLACHT. GEEF MIJ DE DADER.

— DE GROOT
EINDE BERICHT · STOP`;

const DEFAULT_RULES_TITLE = 'Spelregels';

const DEFAULT_RULES_BODY = `Eén team, één kans. Zo werken jullie onderzoek:

1. Open de kaart. Elke locatie in de binnenstad huisvest één verdachte.

2. Ga naar de locatie en scan daar de QR-code of NFC-tag. Daarmee ontgrendelen jullie het dossier van die locatie: een politieverklaring of een zoekfoto met vondsten.

3. Lees goed. In verklaringen zijn delen gezwart — wat eronder staat, blijft verborgen. Vergelijk de verhalen met elkaar: niet iedereen is eerlijk.

4. Houd het logigram bij. Zet een kruis bij wat uitgesloten is en een vinkje bij wat vaststaat. De aanwijzingen helpen jullie op weg.

5. Zodra jullie álle locaties hebben ontgrendeld, mogen jullie één definitieve aanklacht indienen: wie was de dader, welk wapen werd gebruikt, en op welke plek vond de moord plaats?

6. Een foutieve aanklacht betekent dat de dader vrijuit gaat. Denk goed na voordat jullie indienen.`;

// ────────────────────────────────────────────────────────────
// Main page
// ────────────────────────────────────────────────────────────

export default function GameSettingsPage() {
  // Lookups for the solution dropdowns
  const { data: characters } = useSWR('admin-settings-characters', characterApi.getAll, { revalidateOnFocus: false });
  const { data: weapons } = useSWR('admin-settings-weapons', weaponApi.getAll, { revalidateOnFocus: false });
  const { data: locations } = useSWR('admin-settings-locations', locationApi.getAll, { revalidateOnFocus: false });

  const { data: settings, isLoading, mutate } = useSWR('admin-settings', gameSettingApi.get, { revalidateOnFocus: false });

  const [draft, setDraft] = useState<GameSettingDTO | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Seed the draft once the settings row loads
  useEffect(() => {
    if (settings && !draft) setDraft(settings);
  }, [settings, draft]);

  const update = (patch: Partial<GameSettingDTO>) => {
    setDraft(prev => (prev ? { ...prev, ...patch } : prev));
    setSaved(false);
  };

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    setError('');
    try {
      await gameSettingApi.update(draft);
      await mutate();
      setSaved(true);
    } catch {
      setError('Opslaan mislukt. Probeer het opnieuw.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !draft) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse bg-stone-900 border border-stone-800 rounded h-48" />
        ))}
      </div>
    );
  }

  const solutionConfigured =
    draft.murdererCharacterId > 0 && draft.murderWeaponId > 0 && draft.murderLocationId > 0;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-stone-100">Spelinstellingen</h1>
          <p className="text-stone-500 text-sm mt-1">
            De oplossing van de zaak, het introductie-telegram, de spelregels en de
            startpagina-teksten. De oplossing is nooit zichtbaar voor spelers.
          </p>
        </div>
        <Button
          onClick={save}
          disabled={saving}
          className="bg-red-800 hover:bg-red-700 text-stone-100 shrink-0"
        >
          {saving ? 'Opslaan...' : 'Opslaan'}
        </Button>
      </div>

      {saved && (
        <p className="text-emerald-500 text-sm">✓ Instellingen opgeslagen</p>
      )}
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {!solutionConfigured && (
        <p className="text-amber-500 text-sm border border-amber-800 bg-amber-950/30 rounded px-3 py-2">
          ⚠ De oplossing is nog niet volledig ingesteld — teams kunnen pas een aanklacht indienen
          zodra dader, wapen én locatie zijn gekozen.
        </p>
      )}

      {/* ── De oplossing ── */}
      <Card className="bg-stone-900 border-stone-800">
        <CardHeader>
          <CardTitle className="text-stone-100 text-lg font-serif">De oplossing</CardTitle>
          <p className="text-stone-500 text-sm">
            Wie pleegde de moord, met welk wapen, en op welke locatie vond de moord plaats?
            De plek waar de dader zich bevindt is niet automatisch de plek van de moord.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label className="text-stone-300 text-sm">De dader</Label>
            <select
              value={draft.murdererCharacterId}
              onChange={(e) => update({ murdererCharacterId: Number(e.target.value) })}
              className="w-full bg-stone-800 border border-stone-700 text-stone-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-800"
            >
              <option value={0}>— Kies de dader —</option>
              {(characters ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label className="text-stone-300 text-sm">Het moordwapen</Label>
            <select
              value={draft.murderWeaponId}
              onChange={(e) => update({ murderWeaponId: Number(e.target.value) })}
              className="w-full bg-stone-800 border border-stone-700 text-stone-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-800"
            >
              <option value={0}>— Kies het wapen —</option>
              {(weapons ?? []).map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label className="text-stone-300 text-sm">De plek van de moord</Label>
            <select
              value={draft.murderLocationId}
              onChange={(e) => update({ murderLocationId: Number(e.target.value) })}
              className="w-full bg-stone-800 border border-stone-700 text-stone-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-800"
            >
              <option value={0}>— Kies de locatie —</option>
              {(locations ?? []).map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* ── Intro (telegram) ── */}
      <Card className="bg-stone-900 border-stone-800">
        <CardHeader>
          <CardTitle className="text-stone-100 text-lg font-serif">Introductie (telegram)</CardTitle>
          <p className="text-stone-500 text-sm">
            Het telegram van Rechercheur De Groot dat spelers direct na het inloggen zien.
            Leeg veld = de ingebouwde standaardtekst wordt getoond (zie de grijze voorbeeldtekst).
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label className="text-stone-300 text-sm">Titel</Label>
            <Input
              value={draft.introTitle}
              onChange={(e) => update({ introTitle: e.target.value })}
              placeholder={DEFAULT_INTRO_TITLE}
              className="bg-stone-800 border-stone-700 text-stone-100"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-stone-300 text-sm">
              Bericht{' '}
              <span className="text-stone-500 font-normal">(lege regel = nieuwe alinea, werkt in hoofdletters als telegram)</span>
            </Label>
            <Textarea
              value={draft.introBody}
              onChange={(e) => update({ introBody: e.target.value })}
              placeholder={DEFAULT_INTRO_BODY}
              className="bg-stone-800 border-stone-700 text-stone-100 min-h-[280px] font-mono text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Speluitleg ── */}
      <Card className="bg-stone-900 border-stone-800">
        <CardHeader>
          <CardTitle className="text-stone-100 text-lg font-serif">Speluitleg (startpagina)</CardTitle>
          <p className="text-stone-500 text-sm">
            Leeg veld = de ingebouwde standaardtekst wordt getoond.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label className="text-stone-300 text-sm">Titel</Label>
            <Input
              value={draft.speluitlegTitle}
              onChange={(e) => update({ speluitlegTitle: e.target.value })}
              placeholder="De Zaak-Muntonrecht"
              className="bg-stone-800 border-stone-700 text-stone-100"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-stone-300 text-sm">
              Achtergrondverhaal{' '}
              <span className="text-stone-500 font-normal">(lege regel = nieuwe alinea)</span>
            </Label>
            <Textarea
              value={draft.speluitlegBackstory}
              onChange={(e) => update({ speluitlegBackstory: e.target.value })}
              placeholder="Het verhaal van de moord..."
              className="bg-stone-800 border-stone-700 text-stone-100 min-h-[160px]"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-stone-300 text-sm">
              Speluitleg / regels{' '}
              <span className="text-stone-500 font-normal">(één regel per regelnummer, begin met 1. 2. 3. ...)</span>
            </Label>
            <Textarea
              value={draft.speluitlegRules}
              onChange={(e) => update({ speluitlegRules: e.target.value })}
              placeholder={'1. Open de kaart...\n2. Scan de QR-code...\n3. ...'}
              className="bg-stone-800 border-stone-700 text-stone-100 min-h-[160px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Speluitleg / Regels (regelscherm) ── */}
      <Card className="bg-stone-900 border-stone-800">
        <CardHeader>
          <CardTitle className="text-stone-100 text-lg font-serif">Speluitleg / Regels (regelscherm)</CardTitle>
          <p className="text-stone-500 text-sm">
            Het stappenplan dat spelers na de introductie te zien krijgen.
            Leeg veld = de ingebouwde standaardtekst wordt getoond (zie de grijze voorbeeldtekst).
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label className="text-stone-300 text-sm">Titel</Label>
            <Input
              value={draft.rulesTitle}
              onChange={(e) => update({ rulesTitle: e.target.value })}
              placeholder={DEFAULT_RULES_TITLE}
              className="bg-stone-800 border-stone-700 text-stone-100"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-stone-300 text-sm">
              Regels{' '}
              <span className="text-stone-500 font-normal">(lege regel = nieuwe alinea, begin regels met 1. 2. 3. ...)</span>
            </Label>
            <Textarea
              value={draft.rulesBody}
              onChange={(e) => update({ rulesBody: e.target.value })}
              placeholder={DEFAULT_RULES_BODY}
              className="bg-stone-800 border-stone-700 text-stone-100 min-h-[280px]"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
