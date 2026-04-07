'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/game/auth-guard';
import { GameHeader } from '@/components/game/game-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Location codes that unlock characters
// These are set by you - when players reach a physical location, 
// they find a code that unlocks a new suspect
const LOCATION_CODES: Record<string, { characterName: string; message: string }> = {
  // Example codes - customize these for your game
  'KERK2026': {
    characterName: 'Burgemeester Van Dijk',
    message: 'Je hebt de burgemeester ontgrendeld! Hij was betrokken bij de grondtransactie 20 jaar geleden.',
  },
  'HOTEL847': {
    characterName: 'Hans de Vries (Hoteleigenaar)',
    message: 'De hoteleigenaar is nu beschikbaar voor ondervraging. Hij wilde de grond kopen voor een nieuw hotel.',
  },
  'CAFE123': {
    characterName: 'Piet Jansen (Cafe-eigenaar)',
    message: 'De cafe-eigenaar wil met je praten. Hij kent de vorige eigenaar van de grond.',
  },
  'BAR999': {
    characterName: 'Lisa Bakker (Barmeid)',
    message: 'Lisa de barmeid is ontgrendeld. Ze lijkt onschuldig, maar is ze dat ook?',
  },
};

function UnlockContent() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ characterName: string; message: string } | null>(null);
  const [unlockedCodes, setUnlockedCodes] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('unlockedCodes');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(null);

    const upperCode = code.toUpperCase().trim();
    
    if (unlockedCodes.includes(upperCode)) {
      setError('Deze code heb je al gebruikt.');
      return;
    }

    const unlock = LOCATION_CODES[upperCode];
    
    if (unlock) {
      const newUnlocked = [...unlockedCodes, upperCode];
      setUnlockedCodes(newUnlocked);
      localStorage.setItem('unlockedCodes', JSON.stringify(newUnlocked));
      setSuccess(unlock);
      setCode('');
    } else {
      setError('Ongeldige code. Controleer of je de juiste locatie hebt gevonden.');
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
                  className="bg-stone-800 border-stone-700 text-stone-100 placeholder:text-stone-500 uppercase tracking-widest font-mono"
                />
                <Button 
                  type="submit"
                  className="bg-red-800 hover:bg-red-700 text-stone-100"
                >
                  Ontgrendel
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
        {unlockedCodes.length > 0 && (
          <Card className="bg-stone-900 border-stone-800 mt-6">
            <CardHeader>
              <CardTitle className="font-serif text-xl text-stone-100">
                Ontgrendelde Getuigen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {unlockedCodes.map((unlockedCode) => {
                  const character = LOCATION_CODES[unlockedCode];
                  return (
                    <li 
                      key={unlockedCode}
                      className="flex items-center justify-between bg-stone-800 px-4 py-3 rounded"
                    >
                      <span className="text-stone-100">{character?.characterName}</span>
                      <span className="text-stone-500 text-xs font-mono">{unlockedCode}</span>
                    </li>
                  );
                })}
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
              <li>De aanwijzingen leiden je naar fysieke locaties</li>
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
