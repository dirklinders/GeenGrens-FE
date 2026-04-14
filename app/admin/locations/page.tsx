'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { locationCodeApi, characterApi, type LocationCodeDTO, type CharacterDTO } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

const NFC_BASE_URL = 'https://geengrens.nl/api/Unlock';

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
  characters,
  onSave,
  onCancel,
}: {
  initial?: LocationCodeDTO;
  characters: CharacterDTO[];
  onSave: (data: Omit<LocationCodeDTO, 'id'> & { id?: number }) => Promise<void>;
  onCancel: () => void;
}) {
  const [code, setCode] = useState(initial?.code ?? '');
  const [locationName, setLocationName] = useState(initial?.locationName ?? '');
  const [unlockMessage, setUnlockMessage] = useState(initial?.unlockMessage ?? '');
  const [characterId, setCharacterId] = useState<number>(initial?.characterId ?? 0);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!characterId) return;
    setSaving(true);
    try {
      await onSave({ id: initial?.id, code: code.toUpperCase().trim(), locationName, unlockMessage, characterId });
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
        <Label className="text-stone-300 text-sm">Ontgrendelt verdachte</Label>
        <select
          value={characterId}
          onChange={(e) => setCharacterId(Number(e.target.value))}
          required
          className="w-full bg-stone-800 border border-stone-700 text-stone-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-800"
        >
          <option value={0} disabled>Selecteer een verdachte...</option>
          {characters.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={saving || !characterId} className="bg-red-800 hover:bg-red-700 text-stone-100">
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
// Main page
// ────────────────────────────────────────────────────────────

export default function LocationsPage() {
  const { data: codes, mutate: mutateCodes } = useSWR('admin-location-codes', locationCodeApi.getAll, { revalidateOnFocus: false });
  const { data: characters } = useSWR('admin-characters', characterApi.getAll, { revalidateOnFocus: false });

  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const characterList = characters ?? [];

  const characterName = (id: number) =>
    characterList.find((c) => c.id === id)?.name ?? `#${id}`;

  const handleCreate = async (data: Omit<LocationCodeDTO, 'id'>) => {
    try {
      await locationCodeApi.create(data);
      mutateCodes();
      setCreating(false);
    } catch {
      setError('Aanmaken mislukt.');
    }
  };

  const handleUpdate = async (data: LocationCodeDTO) => {
    try {
      await locationCodeApi.update(data);
      mutateCodes();
      setEditingId(null);
    } catch {
      setError('Bijwerken mislukt.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Locatiecode verwijderen?')) return;
    try {
      await locationCodeApi.delete(id);
      mutateCodes();
    } catch {
      setError('Verwijderen mislukt.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-stone-100">Locatiecodes</h1>
          <p className="text-stone-500 text-sm mt-1">
            Codes die spelers op fysieke locaties vinden in Baarle-Nassau
          </p>
        </div>
        <Button
          onClick={() => { setCreating(true); setEditingId(null); }}
          className="bg-red-800 hover:bg-red-700 text-stone-100"
        >
          + Nieuwe code
        </Button>
      </div>

      {error && (
        <div className="bg-red-950 border border-red-800 text-red-400 px-4 py-2 rounded text-sm">
          {error}
        </div>
      )}

      {/* Create form */}
      {creating && (
        <Card className="bg-stone-900 border-stone-800">
          <CardHeader>
            <CardTitle className="text-stone-100 text-lg">Nieuwe locatiecode</CardTitle>
          </CardHeader>
          <CardContent>
            <LocationCodeForm
              characters={characterList}
              onSave={(d) => handleCreate(d as Omit<LocationCodeDTO, 'id'>)}
              onCancel={() => setCreating(false)}
            />
          </CardContent>
        </Card>
      )}

      {/* Codes table */}
      <div className="space-y-2">
        {(codes ?? []).map((lc) => (
          <Card key={lc.id} className="bg-stone-900 border-stone-800">
            <CardContent className="pt-4 pb-4">
              {editingId === lc.id ? (
                <LocationCodeForm
                  initial={lc}
                  characters={characterList}
                  onSave={(d) => handleUpdate(d as LocationCodeDTO)}
                  onCancel={() => setEditingId(null)}
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
                          Ontgrendelt: <span className="text-stone-300">{characterName(lc.characterId)}</span>
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
                      onClick={() => { setEditingId(lc.id); setCreating(false); }}
                      className="text-stone-400 hover:text-stone-100 text-sm transition-colors"
                    >
                      Bewerken
                    </button>
                    <button
                      onClick={() => handleDelete(lc.id)}
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
            Nog geen locatiecodes aangemaakt. Klik op &quot;Nieuwe code&quot; om te beginnen.
          </p>
        )}
      </div>

      {/* Legend / help */}
      {(codes ?? []).length > 0 && (
        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="pt-4 pb-4">
            <p className="text-stone-500 text-sm">
              <strong className="text-stone-400">{codes?.length}</strong> code(s) aangemaakt.
              Spelers kunnen elk maximaal één keer per code invoeren.
              Zodra de eerste code is ingevoerd, krijgen ze toegang tot de ondervragingen.
              Als alle codes zijn ingevoerd, wordt de anonieme melding ontgrendeld.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
