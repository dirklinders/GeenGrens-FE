'use client';

import Link from 'next/link';
import { AuthGuard } from '@/components/game/auth-guard';
import { NewspaperHeadline } from '@/components/game/newspaper-headline';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';

function GameHomeContent() {
  const { user, logout } = useAuth();

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
            <Link 
              href="/game/tip" 
              className="text-stone-400 hover:text-stone-100 transition-colors text-sm"
            >
              Meld dader
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-stone-500 text-sm">
                {user?.name || user?.email}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={logout}
                className="text-stone-400 hover:text-stone-100 hover:bg-stone-800"
              >
                Uitloggen
              </Button>
            </div>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="py-12 px-4">
        {/* Newspaper */}
        <div className="mb-12">
          <NewspaperHeadline />
        </div>

        {/* Call to action */}
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="font-serif text-2xl text-stone-100">
            De waarheid ligt verborgen. Kun jij hem vinden?
          </h2>
          <p className="text-stone-400 leading-relaxed">
            Viktor Vermeer was op het punt om een groot geheim te onthullen. 
            Nu is hij dood, en de politie sluit de zaak. Maar jij weet dat er 
            meer aan de hand is. Praat met de getuigen, ontdek de aanwijzingen, 
            en ontmasker de moordenaar.
          </p>
          <Link href="/game/chat">
            <Button 
              size="lg" 
              className="bg-red-800 hover:bg-red-700 text-stone-100 font-serif text-lg px-8 py-6"
            >
              Start het onderzoek
            </Button>
          </Link>
        </div>

        {/* Atmospheric elements */}
        <div className="max-w-4xl mx-auto mt-16 grid md:grid-cols-3 gap-6">
          <div className="bg-stone-900 border border-stone-800 p-6 rounded">
            <div className="text-red-700 text-3xl font-serif mb-3">I</div>
            <h3 className="text-stone-100 font-medium mb-2">Ondervraag Getuigen</h3>
            <p className="text-stone-500 text-sm">
              Praat met de mensen die Viktor kenden. Iedereen heeft iets te verbergen.
            </p>
          </div>
          <div className="bg-stone-900 border border-stone-800 p-6 rounded">
            <div className="text-red-700 text-3xl font-serif mb-3">II</div>
            <h3 className="text-stone-100 font-medium mb-2">Verzamel Bewijzen</h3>
            <p className="text-stone-500 text-sm">
              Elk gesprek onthult nieuwe aanwijzingen. Combineer ze om de waarheid te vinden.
            </p>
          </div>
          <div className="bg-stone-900 border border-stone-800 p-6 rounded">
            <div className="text-red-700 text-3xl font-serif mb-3">III</div>
            <h3 className="text-stone-100 font-medium mb-2">Ontmasker de Moordenaar</h3>
            <p className="text-stone-500 text-sm">
              Als je genoeg bewijzen hebt, beschuldig de dader. Maar pas op: je krijgt maar één kans.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-800 mt-16 py-8 text-center text-stone-600 text-sm">
        <p>Een interactief moordmysterie gebaseerd op de verhalen van Grensverkenner</p>
      </footer>
    </div>
  );
}

export default function GameHomePage() {
  return (
    <AuthGuard>
      <GameHomeContent />
    </AuthGuard>
  );
}
