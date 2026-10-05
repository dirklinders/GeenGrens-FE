'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { AuthGuard } from '@/components/game/auth-guard';
import { useAuth } from '@/lib/auth-context';
import { lobbyApi, type LobbyTeamDTO } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function LobbyContent() {
  const router = useRouter();
  const { user, checkAuth } = useAuth();
  const { data: teams, mutate, isLoading } = useSWR('lobby-teams', lobbyApi.getTeams);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [hasCreatedTeam, setHasCreatedTeam] = useState(false);

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError('');
    try {
      await action();
      await checkAuth();
      await mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message.replace(/^API Error: \d+ \w+$/, 'Deze actie kon niet worden uitgevoerd.') : 'Deze actie kon niet worden uitgevoerd.');
    } finally {
      setBusy(false);
    }
  };

  const createTeam = () => run(async () => {
    await lobbyApi.create(name);
    setName('');
    setHasCreatedTeam(true);
  });

  const startGame = () => run(async () => {
    await lobbyApi.start();
    router.push('/');
  });

  const currentTeam = teams?.find(team => team.id === user?.teamId);

  return (
    <main className="min-h-screen bg-stone-950 px-4 py-10 text-stone-100">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.28em] text-amber-500">Dossier Muntonrecht</p>
          <h1 className="mt-2 font-serif text-4xl">Teamlobby</h1>
          <p className="mx-auto mt-3 max-w-xl text-stone-400">
            Vorm hier je onderzoeksteam voordat het spel begint. Zodra een team het onderzoek start,
            wordt de samenstelling vergrendeld. Daarna kan alleen een beheerder nog wijzigingen doen.
          </p>
        </header>

        {error && <p className="mb-5 rounded border border-red-800 bg-red-950/50 p-3 text-sm text-red-200">{error}</p>}

        {user?.teamLocked ? (
          <Card className="border-amber-700/70 bg-stone-900">
            <CardHeader><CardTitle>Jullie team is vergrendeld</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-stone-300">
              <p><strong className="text-stone-100">{user.teamName}</strong> is al aan het onderzoek begonnen. Teamleden kunnen niet meer worden gewijzigd; neem contact op met een beheerder als dat nodig is.</p>
              <Button className="bg-amber-600 text-stone-950 hover:bg-amber-500" onClick={() => router.push('/game')}>Naar het onderzoek</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-stone-700 bg-stone-900">
              <CardHeader>
                <CardTitle>Maak een team</CardTitle>
                <CardDescription>Je wordt meteen lid van het nieuwe team.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input value={name} maxLength={60} onChange={event => setName(event.target.value)} placeholder="Bijv. De Nachtbrakers" className="border-stone-700 bg-stone-950" />
                <Button className="w-full" disabled={busy || !name.trim() || (hasCreatedTeam && !user?.isAdmin)} onClick={createTeam}>Team maken</Button>
                {hasCreatedTeam && !user?.isAdmin && <p className="text-xs text-stone-500">Je hebt je ene team al aangemaakt.</p>}
              </CardContent>
            </Card>

            <Card className="border-stone-700 bg-stone-900">
              <CardHeader>
                <CardTitle>Jouw team</CardTitle>
                <CardDescription>{currentTeam ? `${currentTeam.memberCount} lid${currentTeam.memberCount === 1 ? '' : 'den'} · nog niet gestart` : 'Je hebt nog geen team gekozen.'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentTeam && <p className="font-serif text-xl text-amber-400">{currentTeam.name}</p>}
                <Button className="w-full bg-amber-600 text-stone-950 hover:bg-amber-500" disabled={busy || !currentTeam} onClick={startGame}>
                  Start het onderzoek en vergrendel team
                </Button>
                <p className="text-xs leading-relaxed text-stone-500">Na het starten zijn spelerswissels niet meer mogelijk. Beheerders kunnen teams altijd beheren.</p>
              </CardContent>
            </Card>
          </div>
        )}

        {!user?.teamLocked && (
          <section className="mt-8">
            <h2 className="mb-3 font-serif text-2xl">Beschikbare teams</h2>
            {isLoading ? <p className="text-stone-400">Teams laden…</p> : (
              <div className="space-y-3">
                {(teams ?? []).map((team: LobbyTeamDTO) => (
                  <div key={team.id} className="flex items-center justify-between gap-4 rounded border border-stone-800 bg-stone-900 p-4">
                    <div><p className="font-medium">{team.name}</p><p className="text-sm text-stone-500">{team.memberCount} lid{team.memberCount === 1 ? '' : 'den'}</p></div>
                    {team.isLocked ? <span className="text-sm text-stone-500">Vergrendeld</span> : team.id === user?.teamId ? <span className="text-sm text-amber-400">Jouw team</span> : <Button variant="outline" disabled={busy} onClick={() => run(() => lobbyApi.join(team.id))}>Deelnemen</Button>}
                  </div>
                ))}
                {teams?.length === 0 && <p className="text-stone-500">Er zijn nog geen teams. Maak het eerste team aan.</p>}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

export default function LobbyPage() {
  return <AuthGuard><LobbyContent /></AuthGuard>;
}
