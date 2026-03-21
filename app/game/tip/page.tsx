'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AuthGuard } from '@/components/game/auth-guard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// The correct answers
const CORRECT_KILLER = 'cafe-eigenaar';
const CORRECT_MOTIVE_KEYWORDS = ['aandacht', 'zaak', 'failliet', 'failliete', 'verliep', 'publiciteit'];

const SUSPECTS = [
  { id: 'burgemeester', name: 'Burgemeester Van Dijk', description: 'Betrokken bij de grondtransactie 20 jaar geleden' },
  { id: 'hoteleigenaar', name: 'Hans de Vries (Hoteleigenaar)', description: 'Wilde de grond kopen voor een hotel' },
  { id: 'cafe-eigenaar', name: 'Piet Jansen (Cafe-eigenaar)', description: 'Kende de vorige grondeigenaar, was afgekocht' },
  { id: 'barmeid', name: 'Lisa Bakker (Barmeid)', description: 'Werkt in het cafe, lijkt onschuldig' },
];

function TipContent() {
  const [selectedSuspect, setSelectedSuspect] = useState('');
  const [motive, setMotive] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSuspect || !motive.trim()) {
      return;
    }

    setShowConfirmation(true);
  };

  const confirmSubmission = () => {
    const killerCorrect = selectedSuspect === CORRECT_KILLER;
    const motiveWords = motive.toLowerCase();
    const motiveCorrect = CORRECT_MOTIVE_KEYWORDS.some(keyword => motiveWords.includes(keyword));
    
    setIsCorrect(killerCorrect && motiveCorrect);
    setIsSubmitted(true);
    setShowConfirmation(false);
  };

  if (isSubmitted) {
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
                  <p className="text-stone-500 text-sm">
                    (Tip: De dader is de cafe-eigenaar. Zijn zaak verliep en hij wilde meer 
                    aandacht voor de onthullingen genereren.)
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
      {/* Header */}
      <header className="bg-stone-900 border-b border-stone-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/game" className="font-serif text-xl text-stone-100">
            GeenGrens
          </Link>
          <nav className="flex items-center gap-6">
            <Link 
              href="/game" 
              className="text-stone-400 hover:text-stone-100 transition-colors text-sm"
            >
              Overzicht
            </Link>
            <Link 
              href="/game/chat" 
              className="text-stone-400 hover:text-stone-100 transition-colors text-sm"
            >
              Onderzoek
            </Link>
            <Link 
              href="/game/unlock" 
              className="text-stone-400 hover:text-stone-100 transition-colors text-sm"
            >
              Codes
            </Link>
          </nav>
        </div>
      </header>

      <main className="py-12 px-4 max-w-2xl mx-auto">
        {/* Warning */}
        <div className="bg-red-950 border border-red-800 rounded px-4 py-3 mb-6">
          <p className="text-red-400 text-sm font-medium">
            Let op: Je krijgt maar een kans om de dader aan te wijzen. Zorg dat je zeker bent van je zaak.
          </p>
        </div>

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
                <RadioGroup 
                  value={selectedSuspect} 
                  onValueChange={setSelectedSuspect}
                  className="space-y-2"
                >
                  {SUSPECTS.map((suspect) => (
                    <div 
                      key={suspect.id}
                      className="flex items-start space-x-3 bg-stone-800 p-4 rounded cursor-pointer hover:bg-stone-750 transition-colors"
                      onClick={() => setSelectedSuspect(suspect.id)}
                    >
                      <RadioGroupItem 
                        value={suspect.id} 
                        id={suspect.id}
                        className="mt-1 border-stone-600 text-red-600"
                      />
                      <div>
                        <Label 
                          htmlFor={suspect.id} 
                          className="text-stone-100 font-medium cursor-pointer"
                        >
                          {suspect.name}
                        </Label>
                        <p className="text-stone-500 text-sm">{suspect.description}</p>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
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
                  Je staat op het punt om <strong className="text-stone-200">
                    {SUSPECTS.find(s => s.id === selectedSuspect)?.name}
                  </strong> te beschuldigen van moord.
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
