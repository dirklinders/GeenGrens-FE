'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface NotebookRevealProps {
  location: string;
}

export function NotebookReveal({ location }: NotebookRevealProps) {
  return (
    <div className="space-y-6">
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

          {/* Instructions - handwritten yellow */}
          <div className="font-[family-name:var(--font-handwritten)] text-lg text-amber-300/90 leading-relaxed">
            <p>In mijn notitieboekje heb ik om de achtervolgers te slim af te zijn steeds een andere vercijfering gebruikt. Ik hoop dat je slim genoeg bent om de puzzels op te lossen en in mijn voetsporen te treden.</p>
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

      {/* NFC Info Box - positioned to the right on larger screens */}
      <div className="max-w-xl mx-auto md:ml-auto md:mr-8 md:max-w-xs">
        <div className="bg-stone-800/50 border border-stone-700 rounded-lg p-4 space-y-3">
          {/* NFC Logo placeholder */}
          <div className="w-12 h-12 mx-auto bg-stone-700 rounded-lg flex items-center justify-center border border-stone-600">
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5"
              className="w-8 h-8 text-amber-500"
            >
              <path d="M6 12c0-3.5 2.5-6 6-6s6 2.5 6 6-2.5 6-6 6" strokeLinecap="round" />
              <path d="M9 12c0-1.5 1-3 3-3s3 1.5 3 3-1 3-3 3" strokeLinecap="round" />
              <circle cx="12" cy="12" r="1" fill="currentColor" />
            </svg>
          </div>
          <p className="text-stone-400 text-sm text-center">
            Je kan de NFC tags met dit logo scannen om je voortgang te tracken
          </p>
        </div>
      </div>

      {/* Semi-hidden Caesar cipher hint */}
      <div className="max-w-xl mx-auto">
        <p className="text-stone-800 text-[10px] text-right pr-4 select-none opacity-30 hover:opacity-60 transition-opacity">
          A {'->'} D = 3
        </p>
      </div>
    </div>
  );
}
