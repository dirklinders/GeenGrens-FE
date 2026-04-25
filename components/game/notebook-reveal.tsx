'use client';

import Link from 'next/link';

interface NotebookRevealProps {
  location: string;
  isPlaytest?: boolean;
}

export function NotebookReveal({ location, isPlaytest = false }: NotebookRevealProps) {
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
            <p>Ik heb mijn notitieboekje moeten verbranden, <br/>
              maar niet voordat ik hem digitaal gekopieerd heb voor deze site.</p>
          </div>

          {/* Location reveal — or notebook link for playtest teams */}
          {isPlaytest ? (
            <Link href="/notebook">
              <div className="flex items-center gap-3 bg-amber-950/30 border-2 border-amber-700/50 rounded-lg px-5 py-5 hover:bg-amber-950/50 hover:border-amber-600 transition-colors cursor-pointer">
                <span className="text-2xl flex-shrink-0">📓</span>
                <div>
                  <p className="text-amber-300 font-serif text-xl font-medium">Bekijk het notitieboek →</p>
                  <p className="text-amber-200/60 text-xs mt-0.5">De aanwijzingen voor de volgende locatie</p>
                </div>
              </div>
            </Link>
          ) : (
            <div className="bg-stone-800 border-2 border-amber-700/50 rounded-lg p-6 text-center">
              <p className="font-serif text-xl md:text-2xl text-amber-300 font-medium">
                {location}
              </p>
            </div>
          )}

          {/* Instructions - handwritten yellow */}
          <div className="font-[family-name:var(--font-handwritten)] text-lg text-amber-300/90 leading-relaxed">
            <p>In mijn notitieboekje heb voor de zekerheid vercijfering gebruikt. Ik denk dat in mijn voetsporen treden een goede weg is om de puzzels op te lossen.</p>
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
              <text
                x="1.5"
                y="23"
                fill="currentColor"
                stroke="none"
                fontSize="5"
                fontWeight="bold"
                fontFamily="sans-serif"
              >gg</text>
            </svg>
          </div>
          <p className="text-stone-400 text-sm text-center">
            Je moet de NFC tags met (ongeveer) dit logo scannen om met verdachten te kunnen praten.
            Let op dat je niet meer met verdachten kan praten als je een nieuwe code scant.
          </p>
        </div>
      </div>
      
    </div>
  );
}