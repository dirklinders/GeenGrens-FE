'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { teamApi, adminApi, type TeamDTO, type UserInfoAdmin } from '@/lib/api';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

// ────────────────────────────────────────────────────────────
// Team form (create / edit)
// ────────────────────────────────────────────────────────────

function TeamForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: TeamDTO;
  onSave: (data: Omit<TeamDTO, 'id'> & { id?: number }) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [notebookLocation, setNotebookLocation] = useState(initial?.notebookLocation ?? '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ id: initial?.id, name, notebookLocation: notebookLocation || null });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label className="text-stone-300 text-sm">Teamnaam</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="bijv. Team Rood"
          required
          className="bg-stone-800 border-stone-700 text-stone-100"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-stone-300 text-sm">
          Locatie notitieboek{' '}
          <span className="text-stone-500 font-normal">(leeg = "Onder de trap")</span>
        </Label>
        <Input
          value={notebookLocation}
          onChange={(e) => setNotebookLocation(e.target.value)}
          placeholder="bijv. Achter de bar"
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
// Assign-user modal
// ────────────────────────────────────────────────────────────

function AssignUsersPanel({
  team,
  users,
  onUpdate,
}: {
  team: TeamDTO;
  users: UserInfoAdmin[];
  onUpdate: () => void;
}) {
  const [assigning, setAssigning] = useState<string | null>(null);

  const teamMembers = users.filter((u) => u.teamId === team.id);
  const unassigned = users.filter((u) => !u.teamId);

  const assign = async (userId: string, teamId: number) => {
    setAssigning(userId);
    try {
      await adminApi.assignTeam(userId, teamId);
      onUpdate();
    } finally {
      setAssigning(null);
    }
  };

  return (
    <div className="mt-4 space-y-3">
      {/* Current members */}
      <div>
        <p className="text-stone-400 text-xs font-medium uppercase tracking-wide mb-2">
          Leden ({teamMembers.length})
        </p>
        {teamMembers.length === 0 ? (
          <p className="text-stone-600 text-sm">Nog geen leden</p>
        ) : (
          <ul className="space-y-1">
            {teamMembers.map((u) => (
              <li key={u.id} className="flex items-center justify-between bg-stone-800 px-3 py-2 rounded text-sm">
                <span className="text-stone-200">{u.name || u.email}</span>
                <button
                  onClick={() => assign(u.id, 0)}
                  disabled={assigning === u.id}
                  className="text-stone-500 hover:text-red-400 text-xs transition-colors"
                >
                  {assigning === u.id ? '...' : 'Verwijderen'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Unassigned users */}
      {unassigned.length > 0 && (
        <div>
          <p className="text-stone-400 text-xs font-medium uppercase tracking-wide mb-2">
            Beschikbare gebruikers
          </p>
          <ul className="space-y-1">
            {unassigned.map((u) => (
              <li key={u.id} className="flex items-center justify-between bg-stone-900 border border-stone-800 px-3 py-2 rounded text-sm">
                <span className="text-stone-300">{u.name || u.email}</span>
                <button
                  onClick={() => assign(u.id, team.id)}
                  disabled={assigning === u.id}
                  className="text-emerald-500 hover:text-emerald-400 text-xs transition-colors"
                >
                  {assigning === u.id ? '...' : '+ Toevoegen'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Main page
// ────────────────────────────────────────────────────────────

export default function TeamsPage() {
  const { data: teams, mutate: mutateTeams } = useSWR('admin-teams', teamApi.getAll, { revalidateOnFocus: false });
  const { data: users, mutate: mutateUsers } = useSWR('admin-users', adminApi.getUsers, { revalidateOnFocus: false });

  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [togglingPlaytest, setTogglingPlaytest] = useState<number | null>(null);

  const handleCreate = async (data: Omit<TeamDTO, 'id'>) => {
    try {
      await teamApi.create(data);
      mutateTeams();
      setCreating(false);
    } catch {
      setError('Aanmaken mislukt.');
    }
  };

  const handleUpdate = async (data: TeamDTO) => {
    try {
      await teamApi.update(data);
      mutateTeams();
      setEditingId(null);
    } catch {
      setError('Bijwerken mislukt.');
    }
  };

  const handleTogglePlaytest = async (team: TeamDTO) => {
    setTogglingPlaytest(team.id);
    try {
      await teamApi.update({ ...team, isPlaytest: !team.isPlaytest });
      mutateTeams();
    } catch {
      setError('Playtest instelling wijzigen mislukt.');
    } finally {
      setTogglingPlaytest(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Team verwijderen?')) return;
    try {
      await teamApi.delete(id);
      mutateTeams();
    } catch {
      setError('Verwijderen mislukt.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl text-stone-100">Teams</h1>
        <Button
          onClick={() => { setCreating(true); setEditingId(null); }}
          className="bg-red-800 hover:bg-red-700 text-stone-100"
        >
          + Nieuw team
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
            <CardTitle className="text-stone-100 text-lg">Nieuw team aanmaken</CardTitle>
          </CardHeader>
          <CardContent>
            <TeamForm
              onSave={(d) => handleCreate(d as Omit<TeamDTO, 'id'>)}
              onCancel={() => setCreating(false)}
            />
          </CardContent>
        </Card>
      )}

      {/* Team list */}
      <div className="space-y-3">
        {(teams ?? []).map((team) => (
          <Card key={team.id} className="bg-stone-900 border-stone-800">
            <CardContent className="pt-4 pb-4">
              {editingId === team.id ? (
                <TeamForm
                  initial={team}
                  onSave={(d) => handleUpdate(d as TeamDTO)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-stone-100 font-medium">{team.name}</h3>
                        {team.isPlaytest && (
                          <span className="bg-amber-900/60 border border-amber-700 text-amber-400 text-xs px-2 py-0.5 rounded-full font-medium">
                            📓 Playtest
                          </span>
                        )}
                      </div>
                      <p className="text-stone-500 text-sm mt-0.5">
                        Notitieboek:{' '}
                        <span className="text-stone-400 font-mono text-xs">
                          {team.notebookLocation ?? 'Onder de trap (standaard)'}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {/* Playtest toggle */}
                      <button
                        onClick={() => handleTogglePlaytest(team)}
                        disabled={togglingPlaytest === team.id}
                        title={team.isPlaytest ? 'Playtest uitschakelen' : 'Playtest inschakelen — geeft toegang tot digitaal notitieboek'}
                        className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                          team.isPlaytest
                            ? 'bg-amber-900/40 border-amber-700 text-amber-400 hover:bg-amber-900/60'
                            : 'bg-stone-800 border-stone-700 text-stone-500 hover:text-amber-400 hover:border-amber-800'
                        }`}
                      >
                        {togglingPlaytest === team.id ? (
                          '...'
                        ) : team.isPlaytest ? (
                          '📓 Playtest aan'
                        ) : (
                          '📓 Playtest'
                        )}
                      </button>
                      <button
                        onClick={() => setExpandedId(expandedId === team.id ? null : team.id)}
                        className="text-stone-400 hover:text-stone-100 text-sm transition-colors"
                      >
                        {expandedId === team.id ? 'Inklappen' : 'Leden'}
                      </button>
                      <button
                        onClick={() => { setEditingId(team.id); setCreating(false); }}
                        className="text-stone-400 hover:text-stone-100 text-sm transition-colors"
                      >
                        Bewerken
                      </button>
                      <button
                        onClick={() => handleDelete(team.id)}
                        className="text-red-700 hover:text-red-400 text-sm transition-colors"
                      >
                        Verwijderen
                      </button>
                    </div>
                  </div>

                  {expandedId === team.id && users && (
                    <AssignUsersPanel
                      team={team}
                      users={users}
                      onUpdate={() => mutateUsers()}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        ))}

        {teams?.length === 0 && (
          <p className="text-stone-500 text-center py-12">
            Nog geen teams aangemaakt.
          </p>
        )}
      </div>
    </div>
  );
}