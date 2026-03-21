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

       
      </main>

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
