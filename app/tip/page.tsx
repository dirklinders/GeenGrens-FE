'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { AuthGuard } from '@/components/game/auth-guard';
import { GameHeader } from '@/components/game/game-header';
import { gameApi, tipApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

function TipContent() {
  const router = useRouter();
  const [selectedSuspect, setSelectedSuspect] = useState('');
  const [motive, setMotive] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ isCorrect: boolean; alreadySubmitted: boolean } | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Check access permission
  const { data: gameStatus, isLoading: statusLoading } = useSWR(
    'game-status-tip',
    () => gameApi.getGameStatus(),
    { revalidateOnFocus: false }
  );

  // Unlocked characters — these are the selectable suspects
  const { data: characters, isLoading: charactersLoading } = useSWR(
    'unlocked-characters-tip',
    () => gameApi.getUnlockedCharacters(),
    { revalidateOnFocus: false }
  );

  // Redirect if not allowed to submit tips
  useEffect(() => {
    if (!statusLoading && gameStatus && !gameStatus.canSubmitTip) {
      router.push('/');
    }
  }, [gameStatus, statusLoading, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSuspect || !motive.trim()) return;
    setShowConfirmation(true);
  };

  const confirmSubmission = async () => {
    setShowConfirmation(false);
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const res = await tipApi.submit(selectedSuspect, motive);
      setResult(res);
    } catch {
      setSubmitError('Er is een fout opgetreden bij het indienen van de melding. Probeer het opnieuw.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4">
        <div className="text-stone-400 font-serif text-lg animate-pulse">Melding wordt ingediend...</div>
      </div>
    );
  }

  if (result) {
    const { isCorrect } = result;

    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4">
        <Card className="bg-stone-900 border-stone-800 max-w-xl w-full">
          <CardContent className="pt-8 pb-8 text-center space-y-6">
            {isCorrect ? (
              <>
                <div className="text-emerald-500 text-6xl font-serif">Opgelost!</div>
                <h2 className="text-stone-100 text-2xl font-serif">
                  De zaak Viktor Vermeer is opgelost
                </h2>
                <div className="text-stone-400 space-y-4">
                  <p>
                    Je had gelijk. <strong className="text-stone-200">Piet Jansen</strong>, de cafe-eigenaar,
                    heeft Viktor Vermeer vermoord.
                  </p>
                  <p>
                    Zijn zaak liep slecht en hij zag de onthulling van het grondschandaal als een
                    manier om aandacht te genereren. Toen Viktor werd afgekocht en zweeg, besloot
                    Piet het heft in eigen handen te nemen.
                  </p>
                  <p>
                    Door Viktor te vermoorden en het te laten lijken op een misdrijf, hoopte hij
                    dat de media-aandacht zijn cafe zou redden. Een wanhopige daad van een wanhopige man.
                  </p>
                </div>
                <div className="pt-4 border-t border-stone-800">
                  <p className="text-emerald-400 font-medium">
                    Gefeliciteerd, rechercheur. De waarheid is aan het licht gekomen.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="text-red-500 text-6xl font-serif">Fout</div>
                <h2 className="text-stone-100 text-2xl font-serif">
                  De echte moordenaar is nog vrij
                </h2>
                <div className="text-stone-400 space-y-4">
                  <p>
                    Je beschuldiging was onjuist. De politie heeft je tip onderzocht, maar er is
                    onvoldoende bewijs om deze persoon aan te houden.
                  </p>
                  <p>
                    De moordenaar loopt nog steeds vrij rond. Viktor Vermeer&apos;s dood blijft onopgelost.
                  </p>
                </div>
                <div className="pt-4 border-t border-stone-800 space-y-3">
                  <p className="text-red-400 font-medium">
                    Je had maar een kans. De zaak is nu gesloten.
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950">
      <GameHeader />

      <main className="py-6 sm:py-12 px-4 max-w-2xl mx-auto">
        {/* Warning */}
        <div className="bg-red-950 border border-red-800 rounded px-4 py-3 mb-6">
          <p className="text-red-400 text-sm font-medium">
            Let op: Je krijgt maar een kans om de dader aan te wijzen. Zorg dat je zeker bent van je zaak.
          </p>
        </div>

        {submitError && (
          <div className="bg-red-950 border border-red-800 rounded px-4 py-3 mb-6">
            <p className="text-red-400 text-sm">{submitError}</p>
          </div>
        )}

        <Card className="bg-stone-900 border-stone-800">
          <CardHeader>
            <CardTitle className="font-serif text-2xl text-stone-100">
              Anonieme Melding bij de Politie
            </CardTitle>
            <CardDescription className="text-stone-400">
              Je hebt genoeg bewijzen verzameld. Wijs de moordenaar aan en leg uit wat het motief was.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Suspect selection */}
              <div className="space-y-3">
                <Label className="text-stone-200 text-base">Wie is de moordenaar?</Label>
                {charactersLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="animate-pulse bg-stone-800 h-16 rounded" />
                    ))}
                  </div>
                ) : (
                  <RadioGroup
                    value={selectedSuspect}
                    onValueChange={setSelectedSuspect}
                    className="space-y-2"
                  >
                    {(characters ?? []).map((character) => {
                      const key = String(character.id);
                      return (
                        <div
                          key={key}
                          className="flex items-start space-x-3 bg-stone-800 p-4 rounded cursor-pointer transition-colors hover:bg-stone-750"
                          onClick={() => setSelectedSuspect(key)}
                        >
                          <RadioGroupItem
                            value={key}
                            id={key}
                            className="mt-1 border-stone-600 text-red-600"
                          />
                          <div className="flex items-center gap-3">
                            {character.avatarUrl && (
                              <img
                                src={character.avatarUrl}
                                alt={character.name ?? ''}
                                className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                              />
                            )}
                            <div>
                              <Label htmlFor={key} className="text-stone-100 font-medium cursor-pointer">
                                {character.name}
                              </Label>
                              {character.description && (
                                <p className="text-stone-500 text-sm">{character.description}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </RadioGroup>
                )}
              </div>

              {/* Motive */}
              <div className="space-y-3">
                <Label htmlFor="motive" className="text-stone-200 text-base">
                  Wat was het motief?
                </Label>
                <Textarea
                  id="motive"
                  value={motive}
                  onChange={(e) => setMotive(e.target.value)}
                  placeholder="Beschrijf waarom deze persoon Viktor Vermeer vermoord zou hebben..."
                  className="bg-stone-800 border-stone-700 text-stone-100 placeholder:text-stone-500 min-h-32"
                />
                <p className="text-stone-500 text-xs">
                  Tip: Wees specifiek over het motief. Wat dreef de moordenaar tot deze daad?
                </p>
              </div>

              <Button
                type="submit"
                disabled={!selectedSuspect || !motive.trim()}
                className="w-full bg-red-800 hover:bg-red-700 text-stone-100 font-medium py-6"
              >
                Melding Indienen
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Confirmation modal */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <Card className="bg-stone-900 border-stone-800 max-w-md w-full">
              <CardHeader>
                <CardTitle className="font-serif text-xl text-stone-100">
                  Weet je het zeker?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-stone-400">
                  Je staat op het punt om{' '}
                  <strong className="text-stone-200">
                    {characters?.find((c) => String(c.id) === selectedSuspect)?.name}
                  </strong>{' '}
                  te beschuldigen van moord.
                </p>
                <p className="text-red-400 text-sm">
                  Dit is je enige kans. Als je verkeerd zit, blijft de moordenaar vrij.
                </p>
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowConfirmation(false)}
                    className="flex-1 border-stone-700 text-stone-300 hover:bg-stone-800"
                  >
                    Annuleren
                  </Button>
                  <Button
                    onClick={confirmSubmission}
                    className="flex-1 bg-red-800 hover:bg-red-700 text-stone-100"
                  >
                    Bevestigen
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

export default function TipPage() {
  return (
    <AuthGuard>
      <TipContent />
    </AuthGuard>
  );
}
