'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface NotebookRevealProps {
  location: string;
}

export function NotebookReveal({ location }: NotebookRevealProps) {
  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-stone-900/50 border border-amber-800/50 rounded-lg p-8 md:p-12 space-y-8">
        {/* Success header */}
        <div className="text-center space-y-2">
          <div className="text-amber-500 text-4xl mb-4">&#10003;</div>
          <h2 className="font-serif text-2xl text-stone-100">Toegang verleend</h2>
        </div>

        {/* Viktor's message */}
        <div className="font-[family-name:var(--font-handwritten)] text-xl text-amber-200/90 leading-relaxed space-y-4">
          <p>Oke, je bent niet een van hun gelukkig.</p>
          <p>Ik heb mijn notitieboekje moeten verstoppen, hij ligt:</p>
        </div>

        {/* Location reveal */}
        <div className="bg-stone-800 border-2 border-amber-700/50 rounded-lg p-6 text-center">
          <p className="font-serif text-xl md:text-2xl text-amber-300 font-medium">
            {location}
          </p>
        </div>

        {/* Instructions */}
        <div className="text-stone-400 text-sm space-y-2">
          <p>Vind het notitieboekje en los de puzzels op om de waarheid te ontdekken.</p>
          <p>Gebruik de codes die je vindt om nieuwe getuigen te ontgrendelen.</p>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Button asChild className="flex-1 bg-amber-700 hover:bg-amber-600">
            <Link href="/game/unlock">
              Code invoeren
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex-1 border-stone-700 text-stone-300 hover:bg-stone-800">
            <Link href="/game/chat">
              Ondervragen
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
