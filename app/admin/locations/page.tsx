'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { locationCodeApi, characterApi, locationApi, type LocationCodeDTO, type CharacterDTO, type LocationDTO } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  LocationContentEditor,
  validateLocationContent,
  type LocationContentType,
} from '@/components/admin/location-content-editor';

const NFC_BASE_URL = 'https://muntonrecht.nl/api/Unlock';

// ────────────────────────────────────────────────────────────
// NFC URL copy button
// ────────────────────────────────────────────────────────────

function NfcUrlRow({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${NFC_BASE_URL}/${code}`;

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [url]);

  return (
    <div className="mt-2 flex items-center gap-2 bg-stone-950 rounded px-3 py-1.5 border border-stone-800">
      <span className="text-stone-500 text-xs shrink-0">NFC →</span>
      <span className="text-stone-400 text-xs font-mono truncate flex-1">{url}</span>
      <button
        onClick={handleCopy}
        className="text-xs shrink-0 text-stone-500 hover:text-stone-200 transition-colors"
        title="Kopieer NFC URL"
      >
        {copied ? '✓ Gekopieerd' : 'Kopieer'}
      </button>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Location code form
// ────────────────────────────────────────────────────────────

function LocationCodeForm({
  initial,
  locations,
  onSave,
  onCancel,
}: {
  initial?: LocationCodeDTO;
  locations: LocationDTO[];
  onSave: (data: Omit<LocationCodeDTO, 'id'> & { id?: number }) => Promise<void>;
  onCancel: () => void;
}) {
  const [code, setCode] = useState(initial?.code ?? '');
  const [locationName, setLocationName] = useState(initial?.locationName ?? '');
  const [unlockMessage, setUnlockMessage] = useState(initial?.unlockMessage ?? '');
  const [locationId, setLocationId] = useState<number>(initial?.locationId ?? 0);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationId) return;
    setSaving(true);
    try {
      await onSave({ id: initial?.id, code: code.toUpperCase().trim(), locationName, unlockMessage, locationId });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-stone-300 text-sm">Code (bijv. KERK2026)</Label>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="KERK2026"
            required
            className="bg-stone-800 border-stone-700 text-stone-100 uppercase font-mono tracking-widest"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-stone-300 text-sm">Locatienaam</Label>
          <Input
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="bijv. De Kerk"
            required
            className="bg-stone-800 border-stone-700 text-stone-100"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-stone-300 text-sm">Bericht na ontgrendelen</Label>
        <Input
          value={unlockMessage}
          onChange={(e) => setUnlockMessage(e.target.value)}
          placeholder="bijv. De burgemeester is nu beschikbaar voor ondervraging."
          required
          className="bg-stone-800 border-stone-700 text-stone-100"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-stone-300 text-sm">Ontgrendelt locatie</Label>
        <select
          value={locationId}
          onChange={(e) => setLocationId(Number(e.target.value))}
          required
          className="w-full bg-stone-800 border border-stone-700 text-stone-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-800"
        >
          <option value={0} disabled>Selecteer een locatie...</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={saving || !locationId} className="bg-red-800 hover:bg-red-700 text-stone-100">
          {saving ? 'Opslaan...' : initial ? 'Bijwerken' : 'Aanmaken'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="border-stone-700 text-stone-300 hover:bg-stone-800">
          Annuleren
        </Button>
      </div>
    </form>
  );
}

// ────────────────────────────────────────────────────────────
// Map-location form (name, coordinates, suspect + dossier content)
// ────────────────────────────────────────────────────────────

type LocationFormData = Omit<LocationDTO, 'id'> & { id?: number };

function LocationForm({
  initial,
  characters,
  onSave,
  onCancel,
}: {
  initial?: LocationDTO;
  characters: CharacterDTO[];
  onSave: (data: LocationFormData) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [latitude, setLatitude] = useState(initial ? String(initial.latitude) : '');
  const [longitude, setLongitude] = useState(initial ? String(initial.longitude) : '');
  const [characterId, setCharacterId] = useState<number | null>(initial?.characterId ?? null);
  const [contentType, setContentType] = useState<LocationContentType>(
    initial?.contentType === 'interview' || initial?.contentType === 'search_picture'
      ? initial.contentType
      : ''
  );
  const [contentJson, setContentJson] = useState(initial?.contentJson ?? '');
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation: string[] = [];
    if (!name.trim()) validation.push('Naam is verplicht.');
    const lat = latitude.trim() === '' ? 0 : Number(latitude.trim().replace(',', '.'));
    const lng = longitude.trim() === '' ? 0 : Number(longitude.trim().replace(',', '.'));
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      validation.push('Breedtegraad en lengtegraad moeten getallen zijn (bijv. 52.1401 en 6.2001).');
    }
    validation.push(...validateLocationContent(contentType, contentJson));
    if (validation.length > 0) {
      setErrors(validation);
      return;
    }
    setErrors([]);
    setSaving(true);
    try {
      await onSave({
        id: initial?.id,
        name: name.trim(),
        description,
        latitude: lat,
        longitude: lng,
        characterId,
        contentType,
        contentJson: contentType === '' ? '' : contentJson,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-stone-300 text-sm">Naam *</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="bijv. De Stadsmarkt"
            required
            className="bg-stone-800 border-stone-700 text-stone-100"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-stone-300 text-sm">Verdachte op deze locatie</Label>
          <select
            value={characterId ?? ''}
            onChange={(e) => setCharacterId(e.target.value === '' ? null : Number(e.target.value))}
            className="w-full bg-stone-800 border border-stone-700 text-stone-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-800"
          >
            <option value="">— Geen verdachte gekoppeld —</option>
            {characters.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-stone-300 text-sm">Omschrijving</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Korte omschrijving die spelers op de kaart te zien krijgen."
          className="bg-stone-800 border-stone-700 text-stone-100 min-h-[60px]"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-stone-300 text-sm">Breedtegraad (lat)</Label>
          <Input
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            placeholder="52.1401"
            inputMode="decimal"
            className="bg-stone-800 border-stone-700 text-stone-100 font-mono"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-stone-300 text-sm">Lengtegraad (lng)</Label>
          <Input
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            placeholder="6.2001"
            inputMode="decimal"
            className="bg-stone-800 border-stone-700 text-stone-100 font-mono"
          />
        </div>
      </div>

      <LocationContentEditor
        contentType={contentType}
        onContentTypeChange={setContentType}
        contentJson={contentJson}
        onContentJsonChange={setContentJson}
      />

      {errors.length > 0 && (
        <div className="bg-red-950 border border-red-800 text-red-400 px-4 py-2 rounded text-sm space-y-1">
          {errors.map((err, i) => (
            <p key={i}>{err}</p>
          ))}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={saving} className="bg-red-800 hover:bg-red-700 text-stone-100">
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
// Content-type badge for the location list
// ────────────────────────────────────────────────────────────

function ContentTypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; className: string }> = {
    interview: { label: 'Interview', className: 'bg-amber-950 border-amber-700 text-amber-400' },
    search_picture: { label: 'Zoekfoto', className: 'bg-emerald-950 border-emerald-700 text-emerald-400' },
  };
  const info = map[type] ?? { label: 'Geen dossier', className: 'bg-stone-800 border-stone-700 text-stone-500' };
  return (
    <span className={`inline-block text-xs border rounded px-2 py-0.5 ${info.className}`}>
      {info.label}
    </span>
  );
}

// ────────────────────────────────────────────────────────────
// Main page
// ────────────────────────────────────────────────────────────

export default function LocationsPage() {
  const { data: codes, mutate: mutateCodes } = useSWR('admin-location-codes', locationCodeApi.getAll, { revalidateOnFocus: false });
  const { data: characters } = useSWR('admin-characters', characterApi.getAll, { revalidateOnFocus: false });
  const { data: locations, mutate: mutateLocations, isLoading: locationsLoading } = useSWR('admin-locations', locationApi.getAll, { revalidateOnFocus: false });

  const [creatingCode, setCreatingCode] = useState(false);
  const [editingCodeId, setEditingCodeId] = useState<number | null>(null);
  const [creatingLocation, setCreatingLocation] = useState(false);
  const [editingLocationId, setEditingLocationId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const characterList = characters ?? [];
  const locationList = locations ?? [];

  const characterName = (id: number | null) =>
    characterList.find((c) => c.id === id)?.name ?? `#${id}`;

  const locName = (id: number) =>
    locationList.find((l) => l.id === id)?.name ?? `#${id}`;

  // ── Location codes ──
  const handleCreateCode = async (data: Omit<LocationCodeDTO, 'id'>) => {
    try {
      await locationCodeApi.create(data);
      mutateCodes();
      setCreatingCode(false);
    } catch {
      setError('Aanmaken mislukt.');
    }
  };

  const handleUpdateCode = async (data: LocationCodeDTO) => {
    try {
      await locationCodeApi.update(data);
      mutateCodes();
      setEditingCodeId(null);
    } catch {
      setError('Bijwerken mislukt.');
    }
  };

  const handleDeleteCode = async (id: number) => {
    if (!confirm('Locatiecode verwijderen?')) return;
    try {
      await locationCodeApi.delete(id);
      mutateCodes();
    } catch {
      setError('Verwijderen mislukt.');
    }
  };

  // ── Map locations ──
  const handleCreateLocation = async (data: LocationFormData) => {
    try {
      const { id, ...payload } = data;
      await locationApi.create(payload);
      await mutateLocations();
      setCreatingLocation(false);
      setError('');
    } catch {
      setError('Aanmaken van de locatie mislukt.');
    }
  };

  const handleUpdateLocation = async (data: LocationFormData) => {
    try {
      await locationApi.update(data as LocationDTO);
      await mutateLocations();
      setEditingLocationId(null);
      setError('');
    } catch {
      setError('Bijwerken van de locatie mislukt.');
    }
  };

  const handleDeleteLocation = async (id: number) => {
    if (!confirm('Locatie verwijderen? De dossier-inhoud gaat ook verloren.')) return;
    try {
      await locationApi.delete(id);
      await mutateLocations();
    } catch {
      setError('Verwijderen mislukt — de locatie is mogelijk nog ergens in gebruik.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-stone-100">Locaties</h1>
        <p className="text-stone-500 text-sm mt-1">
          Locatiecodes (NFC/QR) die spelers fysiek vinden, en de map-locaties met hun
          dossier-inhoud voor het onderzoekstabblad.
        </p>
      </div>

      {error && (
        <div className="bg-red-950 border border-red-800 text-red-400 px-4 py-2 rounded text-sm">
          {error}
        </div>
      )}

      {/* ══════════ Section: location codes ══════════ */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-stone-800 pb-2">
          <h2 className="font-serif text-lg text-stone-200">Locatiecodes (NFC / QR)</h2>
          <div className="flex gap-2">
            <Button
              onClick={() => { setCreatingCode(true); setEditingCodeId(null); }}
              className="bg-red-800 hover:bg-red-700 text-stone-100"
            >
              + Nieuwe code
            </Button>
            <label className="cursor-pointer">
              <span className="inline-flex items-center px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-sm rounded border border-stone-700 transition-colors">
                📄 CSV Importeren
              </span>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const result = await locationApi.uploadCsv(file);
                    alert(`${result.count} locaties geïmporteerd.`);
                    mutateCodes();
                  } catch {
                    alert('Fout bij het importeren van het CSV-bestand.');
                  }
                  e.target.value = '';
                }}
              />
            </label>
          </div>
        </div>

        {creatingCode && (
          <Card className="bg-stone-900 border-stone-800">
            <CardHeader>
              <CardTitle className="text-stone-100 text-lg">Nieuwe locatiecode</CardTitle>
            </CardHeader>
            <CardContent>
              <LocationCodeForm
                locations={locationList}
                onSave={(d) => handleCreateCode(d as Omit<LocationCodeDTO, 'id'>)}
                onCancel={() => setCreatingCode(false)}
              />
            </CardContent>
          </Card>
        )}

        <div className="space-y-2">
          {(codes ?? []).map((lc) => (
            <Card key={lc.id} className="bg-stone-900 border-stone-800">
              <CardContent className="pt-4 pb-4">
                {editingCodeId === lc.id ? (
                  <LocationCodeForm
                    initial={lc}
                    locations={locationList}
                    onSave={(d) => handleUpdateCode(d as LocationCodeDTO)}
                    onCancel={() => setEditingCodeId(null)}
                  />
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="flex items-start gap-4">
                        {/* Code badge */}
                        <div className="bg-stone-800 px-3 py-1.5 rounded font-mono text-sm text-stone-200 tracking-widest shrink-0">
                          {lc.code}
                        </div>
                        <div>
                          <p className="text-stone-100 font-medium">{lc.locationName}</p>
                          <p className="text-stone-500 text-sm mt-0.5">
                            Ontgrendelt: <span className="text-stone-300">{locName(lc.locationId)}</span>
                          </p>
                          {lc.unlockMessage && (
                            <p className="text-stone-600 text-xs mt-1 italic">&ldquo;{lc.unlockMessage}&rdquo;</p>
                          )}
                        </div>
                      </div>
                      <NfcUrlRow code={lc.code} />
                    </div>
                    <div className="flex gap-3 shrink-0">
                      <button
                        onClick={() => { setEditingCodeId(lc.id); setCreatingCode(false); }}
                        className="text-stone-400 hover:text-stone-100 text-sm transition-colors"
                      >
                        Bewerken
                      </button>
                      <button
                        onClick={() => handleDeleteCode(lc.id)}
                        className="text-red-700 hover:text-red-400 text-sm transition-colors"
                      >
                        Verwijderen
                      </button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {codes?.length === 0 && (
            <p className="text-stone-500 text-center py-12">
              Nog geen locatiecodes aangemaakt. Klik op "Nieuwe code" om te beginnen.
            </p>
          )}
        </div>

        {(codes ?? []).length > 0 && (
          <Card className="bg-stone-900/50 border-stone-800">
            <CardContent className="pt-4 pb-4">
              <p className="text-stone-500 text-sm">
                <strong className="text-stone-400">{codes?.length}</strong> code(s) aangemaakt.
                Spelers kunnen elk maximaal één keer per code invoeren.
                Zodra de eerste code is ingevoerd, krijgen ze toegang tot het dossier van de locatie.
                Als alle codes zijn ingevoerd, wordt de anonieme melding ontgrendeld.
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* ══════════ Section: map locations + dossier content ══════════ */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-stone-800 pb-2">
          <h2 className="font-serif text-lg text-stone-200">Map-locaties & dossiers</h2>
          {!creatingLocation && editingLocationId === null && (
            <Button
              onClick={() => { setCreatingLocation(true); setEditingLocationId(null); }}
              className="bg-red-800 hover:bg-red-700 text-stone-100"
            >
              + Nieuwe locatie
            </Button>
          )}
        </div>

        {creatingLocation && (
          <Card className="bg-stone-900 border-stone-800">
            <CardHeader>
              <CardTitle className="text-stone-100 text-lg font-serif">Nieuwe map-locatie</CardTitle>
            </CardHeader>
            <CardContent>
              <LocationForm
                characters={characterList}
                onSave={handleCreateLocation}
                onCancel={() => setCreatingLocation(false)}
              />
            </CardContent>
          </Card>
        )}

        {locationsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-stone-900 border border-stone-800 rounded h-20" />
            ))}
          </div>
        ) : (locations ?? []).length === 0 ? (
          <p className="text-stone-500 text-center py-12">
            Nog geen map-locaties. Voeg locaties toe (handmatig of via de CSV-import hierboven) en
            geef ze eventueel een dossier: een interview of een zoekfoto met vondsten.
          </p>
        ) : (
          <div className="space-y-2">
            {(locations ?? []).map((loc) =>
              editingLocationId === loc.id ? (
                <Card key={loc.id} className="bg-stone-900 border-stone-800">
                  <CardHeader>
                    <CardTitle className="text-stone-100 text-lg font-serif">Locatie bewerken</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <LocationForm
                      initial={loc}
                      characters={characterList}
                      onSave={handleUpdateLocation}
                      onCancel={() => setEditingLocationId(null)}
                    />
                  </CardContent>
                </Card>
              ) : (
                <Card key={loc.id} className="bg-stone-900 border-stone-800">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <p className="text-stone-100 font-serif">{loc.name}</p>
                          <ContentTypeBadge type={loc.contentType} />
                        </div>
                        {loc.description && (
                          <p className="text-stone-500 text-sm mt-0.5">{loc.description}</p>
                        )}
                        <p className="text-stone-600 text-xs mt-1 font-mono">
                          {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                          {' · '}
                          Verdachte: {loc.characterId ? characterName(loc.characterId) : '—'}
                        </p>
                      </div>
                      <div className="flex gap-3 shrink-0">
                        <button
                          onClick={() => { setEditingLocationId(loc.id); setCreatingLocation(false); }}
                          className="text-stone-400 hover:text-stone-100 text-sm transition-colors"
                        >
                          Bewerken
                        </button>
                        <button
                          onClick={() => handleDeleteLocation(loc.id)}
                          className="text-red-700 hover:text-red-400 text-sm transition-colors"
                        >
                          Verwijderen
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
}
