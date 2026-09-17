'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { weaponApi, type WeaponDTO } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// ────────────────────────────────────────────────────────────
// Weapon form (create / edit)
// ────────────────────────────────────────────────────────────

function WeaponForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: WeaponDTO;
  onSave: (data: Omit<WeaponDTO, 'id'> & { id?: number }) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [stopKeyword, setStopKeyword] = useState(initial?.stopKeywordWeapon ?? '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        id: initial?.id,
        name,
        description,
        stopKeywordWeapon: stopKeyword || null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label className="text-stone-300 text-sm">Wapennaam</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="bijv. Kandelaar, Vergif, Dolk"
          required
          className="bg-stone-800 border-stone-700 text-stone-100"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-stone-300 text-sm">Omschrijving</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Korte omschrijving van het wapen voor in het spel."
          className="bg-stone-800 border-stone-700 text-stone-100 min-h-[70px]"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-stone-300 text-sm">
          Stop-woord{' '}
          <span className="text-stone-500 font-normal">
            (woord in een antwoord dat bevestigt dat het team dit wapen heeft ontdekt)
          </span>
        </Label>
        <Input
          value={stopKeyword}
          onChange={(e) => setStopKeyword(e.target.value)}
          placeholder="bijv. kandelaar"
          className="bg-stone-800 border-stone-700 text-stone-100"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={saving} className="bg-red-800 hover:bg-red-700 text-stone-100">
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

export default function WeaponsPage() {
  const { data: weapons, mutate, isLoading } = useSWR('admin-weapons', weaponApi.getAll, { revalidateOnFocus: false });

  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const handleSave = async (data: Omit<WeaponDTO, 'id'> & { id?: number }) => {
    try {
      if (data.id) {
        await weaponApi.update(data as WeaponDTO);
      } else {
        await weaponApi.create(data);
      }
      await mutate();
      setCreating(false);
      setEditingId(null);
      setError('');
    } catch {
      setError('Opslaan mislukt. Controleer de invoer en probeer het opnieuw.');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await weaponApi.delete(id);
      await mutate();
    } catch {
      setError('Verwijderen mislukt — dit wapen is mogelijk nog ergens in gebruik.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-stone-100">Wapens</h1>
          <p className="text-stone-500 text-sm mt-1">
            De moordwapens waaruit teams kunnen kiezen in hun aanklacht.
          </p>
        </div>
        {!creating && editingId === null && (
          <Button onClick={() => setCreating(true)} className="bg-red-800 hover:bg-red-700 text-stone-100">
            + Nieuw wapen
          </Button>
        )}
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {creating && (
        <Card className="bg-stone-900 border-stone-800">
          <CardHeader>
            <CardTitle className="text-stone-100 text-lg font-serif">Nieuw wapen</CardTitle>
          </CardHeader>
          <CardContent>
            <WeaponForm onSave={handleSave} onCancel={() => setCreating(false)} />
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-stone-900 border border-stone-800 rounded h-20" />
          ))}
        </div>
      ) : (weapons ?? []).length === 0 ? (
        <p className="text-stone-500 text-center py-12">
          Nog geen wapens. Voeg minimaal één moordwapen toe.
        </p>
      ) : (
        <div className="space-y-3">
          {(weapons ?? []).map((w) =>
            editingId === w.id ? (
              <Card key={w.id} className="bg-stone-900 border-stone-800">
                <CardHeader>
                  <CardTitle className="text-stone-100 text-lg font-serif">Wapen bewerken</CardTitle>
                </CardHeader>
                <CardContent>
                  <WeaponForm initial={w} onSave={handleSave} onCancel={() => setEditingId(null)} />
                </CardContent>
              </Card>
            ) : (
              <Card key={w.id} className="bg-stone-900 border-stone-800">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-stone-100 font-serif">{w.name}</p>
                      {w.description && (
                        <p className="text-stone-500 text-sm mt-0.5">{w.description}</p>
                      )}
                      {w.stopKeywordWeapon && (
                        <p className="text-stone-600 text-xs mt-1 font-mono">
                          stop-woord: &ldquo;{w.stopKeywordWeapon}&rdquo;
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingId(w.id)}
                        className="border-stone-700 text-stone-300 hover:bg-stone-800"
                      >
                        Bewerken
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(w.id)}
                        className="border-red-900 text-red-500 hover:bg-red-950"
                      >
                        Verwijderen
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </div>
      )}
    </div>
  );
}
