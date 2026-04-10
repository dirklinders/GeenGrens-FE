'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { AuthGuard } from '@/components/game/auth-guard';
import { GameHeader } from '@/components/game/game-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { unlockApi, type UnlockedCode } from '@/lib/api';

function UnlockContent() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ characterName: string | null | undefined; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Fetch unlocked codes from the server
  const { data: unlockedCodes, mutate: mutateUnlocked, isLoading } = useSWR<UnlockedCode[]>(
    'unlocked-codes',
    () => unlockApi.getUnlocked(),
    { revalidateOnFocus: false }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const result = await unlockApi.enterCode(code.toUpperCase().trim());

      if (result.success) {
        setSuccess({ characterName: result.characterName, message: result.message });
        setCode('');
        mutateUnlocked(); // refresh unlocked list
      } else {
        setError(result.message);
      }
    } catch {
      setError('Er is een fout opgetreden. Probeer het opnieuw.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950">
      <GameHeader />

      <main className="py-12 px-4 max-w-2xl mx-auto">
        <Card className="bg-stone-900 border-stone-800">
          <CardHeader>
            <CardTitle className="font-serif text-2xl text-stone-100">
              Locatiecode Invoeren
            </CardTitle>
            <CardDescription className="text-stone-400">
              Heb je een nieuwe locatie gevonden? Voer de code in om een nieuwe getuige te ontgrendelen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-3">
                <Input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Voer code in..."
                  disabled={isSubmitting}
                  className="bg-stone-800 border-stone-700 text-stone-100 placeholder:text-stone-500 uppercase tracking-widest font-mono"
                />
                <Button
                  type="submit"
                  disabled={isSubmitting || !code.trim()}
                  className="bg-red-800 hover:bg-red-700 text-stone-100"
                >
                  {isSubmitting ? 'Bezig...' : 'Ontgrendel'}
                </Button>
              </div>

              {error && (
                <div className="bg-red-950 border border-red-800 text-red-400 px-4 py-3 rounded text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-emerald-950 border border-emerald-800 text-emerald-400 px-4 py-3 rounded space-y-2">
                  <p className="font-medium">Nieuwe getuige ontgrendeld!</p>
                  {success.characterName && (
                    <p className="text-sm font-medium text-emerald-300">{success.characterName}</p>
                  )}
                  <p className="text-sm">{success.message}</p>
                  <Button
                    onClick={() => router.push('/game/chat')}
                    variant="outline"
                    size="sm"
                    className="mt-2 border-emerald-700 text-emerald-400 hover:bg-emerald-900"
                  >
                    Ga naar onderzoek
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Unlocked characters */}
        {!isLoading && unlockedCodes && unlockedCodes.length > 0 && (
          <Card className="bg-stone-900 border-stone-800 mt-6">
            <CardHeader>
              <CardTitle className="font-serif text-xl text-stone-100">
                Ontgrendelde Getuigen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {unlockedCodes.map((unlock) => (
                  <li
                    key={unlock.code}
                    className="flex items-center justify-between bg-stone-800 px-4 py-3 rounded"
                  >
                    <div>
                      <span className="text-stone-100 block">
                        {unlock.characterName ?? unlock.locationName}
                      </span>
                      <span className="text-stone-500 text-xs">{unlock.locationName}</span>
                    </div>
                    <span className="text-stone-500 text-xs font-mono">{unlock.code}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="bg-stone-900/50 border-stone-800 mt-6">
          <CardContent className="pt-6">
            <h3 className="text-stone-300 font-medium mb-2">Hoe werkt het?</h3>
            <ol className="text-stone-500 text-sm space-y-2 list-decimal list-inside">
              <li>Zoek naar aanwijzingen in het notitieboekje van Viktor</li>
              <li>De aanwijzingen leiden je naar fysieke locaties in Baarle-Nassau</li>
              <li>Op elke locatie vind je een code</li>
              <li>Voer de code hier in om een nieuwe getuige te ontgrendelen</li>
              <li>Ondervraag de getuige voor meer informatie</li>
            </ol>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function UnlockPage() {
  return (
    <AuthGuard>
      <UnlockContent />
    </AuthGuard>
  );
}
