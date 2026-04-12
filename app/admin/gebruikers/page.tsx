'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { adminApi, teamApi, type UserInfoAdmin, type TeamDTO } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

// ────────────────────────────────────────────────────────────
// Create user form
// ────────────────────────────────────────────────────────────

function CreateUserForm({ onCreated }: { onCreated: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await adminApi.createUser(email, password, name || undefined);
      setEmail('');
      setPassword('');
      setName('');
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onbekende fout');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="bg-stone-900 border-stone-800">
      <CardHeader>
        <CardTitle className="text-stone-100 text-base">Nieuwe gebruiker aanmaken</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-stone-300 text-sm">E-mailadres</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="speler@email.com"
                required
                className="bg-stone-800 border-stone-700 text-stone-100"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-stone-300 text-sm">
                Naam <span className="text-stone-500 font-normal">(optioneel)</span>
              </Label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="bijv. Jan de Vries"
                className="bg-stone-800 border-stone-700 text-stone-100"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-stone-300 text-sm">Wachtwoord</Label>
              <Input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="tijdelijk wachtwoord"
                required
                className="bg-stone-800 border-stone-700 text-stone-100"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <Button
            type="submit"
            disabled={saving}
            className="bg-red-900 hover:bg-red-800 text-red-100"
          >
            {saving ? 'Aanmaken...' : 'Gebruiker aanmaken'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ────────────────────────────────────────────────────────────
// User row
// ────────────────────────────────────────────────────────────

function UserRow({
  user,
  teams,
  onAssigned,
  onDeleted,
  onMadeAdmin,
}: {
  user: UserInfoAdmin;
  teams: TeamDTO[];
  onAssigned: () => void;
  onDeleted: () => void;
  onMadeAdmin: () => void;
}) {
  const [selectedTeamId, setSelectedTeamId] = useState<number>(user.teamId ?? 0);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [makingAdmin, setMakingAdmin] = useState(false);

  const handleAssign = async () => {
    setSaving(true);
    try {
      await adminApi.assignTeam(user.id, selectedTeamId);
      onAssigned();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      await adminApi.deleteUser(user.id);
      onDeleted();
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleMakeAdmin = async () => {
    setMakingAdmin(true);
    try {
      await adminApi.makeAdmin(user.id);
      onMadeAdmin();
    } finally {
      setMakingAdmin(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 py-3 border-b border-stone-800 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-stone-100 text-sm font-medium truncate">
          {user.name || <span className="text-stone-500 italic">geen naam</span>}
        </p>
        <p className="text-stone-400 text-xs truncate">{user.email}</p>
        {user.teamName && (
          <p className="text-amber-600 text-xs">{user.teamName}</p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Team assign */}
        <select
          value={selectedTeamId}
          onChange={(e) => setSelectedTeamId(Number(e.target.value))}
          className="bg-stone-800 border border-stone-700 text-stone-200 text-xs rounded px-2 py-1.5 focus:outline-none"
        >
          <option value={0}>— geen team —</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          variant="outline"
          onClick={handleAssign}
          disabled={saving}
          className="h-7 text-xs border-stone-700 text-stone-300 hover:bg-stone-800"
        >
          {saving ? '...' : 'Opslaan'}
        </Button>

        {/* Make admin */}
        <Button
          size="sm"
          variant="ghost"
          onClick={handleMakeAdmin}
          disabled={makingAdmin}
          className="h-7 text-xs text-stone-500 hover:text-red-400 hover:bg-transparent"
          title="Admin maken"
        >
          {makingAdmin ? '...' : 'Admin'}
        </Button>

        {/* Delete */}
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDelete}
          disabled={deleting}
          className={`h-7 text-xs hover:bg-transparent ${
            confirmDelete
              ? 'text-red-400 hover:text-red-300'
              : 'text-stone-600 hover:text-stone-400'
          }`}
          title={confirmDelete ? 'Nogmaals klikken om te bevestigen' : 'Verwijderen'}
        >
          {deleting ? '...' : confirmDelete ? 'Zeker?' : '✕'}
        </Button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Main page
// ────────────────────────────────────────────────────────────

export default function GebruikersPage() {
  const { data: users, mutate: mutateUsers } = useSWR('admin-users', adminApi.getUsers);
  const { data: teams } = useSWR('teams', teamApi.getAll);

  if (!users || !teams) {
    return (
      <div className="animate-pulse text-stone-500 text-sm py-8 text-center">
        Laden...
      </div>
    );
  }

  const sortedUsers = [...users].sort((a, b) =>
    (a.email ?? '').localeCompare(b.email ?? '')
  );

  return (
    <div className="space-y-6">
      <CreateUserForm onCreated={() => mutateUsers()} />

      <Card className="bg-stone-900 border-stone-800">
        <CardHeader>
          <CardTitle className="text-stone-100 text-base flex items-center justify-between">
            <span>Alle gebruikers</span>
            <span className="text-stone-500 font-normal text-sm">{users.length} totaal</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedUsers.length === 0 ? (
            <p className="text-stone-500 text-sm text-center py-4">Nog geen gebruikers.</p>
          ) : (
            <div>
              {sortedUsers.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  teams={teams}
                  onAssigned={() => mutateUsers()}
                  onDeleted={() => mutateUsers()}
                  onMadeAdmin={() => mutateUsers()}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
