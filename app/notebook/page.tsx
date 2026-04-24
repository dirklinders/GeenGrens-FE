'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import useSWR from 'swr';
import { AuthGuard } from '@/components/game/auth-guard';
import { GameHeader } from '@/components/game/game-header';
import { gameApi, unlockApi } from '@/lib/api';

// ────────────────────────────────────────────────────────────
// Page content types
// ────────────────────────────────────────────────────────────

type Line =
  | { type: 'text';   content: string }
  | { type: 'quote';  content: string }
  | { type: 'arrow';  content: string }
  | { type: 'note';   content: string }          // !! annotation
  | { type: 'fill';   words: number[] }          // infillable boxes
  | { type: 'cipher'; words: string[] }          // cipher letter + fill box per letter
  | { type: 'spacer' }
  | { type: 'rule' };

// ────────────────────────────────────────────────────────────
// Page 1  (bar name is dynamic)
// ────────────────────────────────────────────────────────────

function makePage1(barName: string): Line[] { return [
  { type: 'text',  content: `Avond in ${barName} — jackpot. Barman veel te los` },
  { type: 'text',  content: 'na sluitingstijd, dacht waarschijnlijk dat ik al' },
  { type: 'text',  content: 'te ver heen was. Letterlijk (of zo goed als):' },
  { type: 'quote', content: '"Grond wisselt hier wel vaker van eigenaar.\nNiet altijd eerlijk. Wie het weet,\nwordt er beter van."' },
  { type: 'text',  content: 'Doorgevraagd → klapte dicht. Alsof hij zich' },
  { type: 'text',  content: 'realiseerde tegen wie hij het had.' },
  { type: 'spacer' },
  { type: 'arrow', content: 'Perceel op de hoek Molenstraat / Kerkplein.\nKadaster: 25-04-2006 overgegaan op\nene Frederik Claes — burgemeester van B-H.\nGeen overdrachtsakte. Geen verkoper.\nGeen bedrag. Niks. Een stuk grond dat\nuit de lucht valt, in handen van\nde burgemeester.' },
  { type: 'spacer' },
  { type: 'text',  content: 'Morgenavond terug naar de bar. Die barman' },
  { type: 'text',  content: 'weet meer. Moet hem aan de praat krijgen.' },
]; }

// ────────────────────────────────────────────────────────────
// Page 2
// ────────────────────────────────────────────────────────────

const PAGE_2: Line[] = [
  { type: 'text', content: '8 33 777 88 4 0 22 444 5 0 22 2 777 .' },
  { type: 'text', content: '22 2 777 6 2 66 : 0 " 3 2 8 0 555 2 7 5 33 0 888 2 66 0 777 444 55 55 33 777 8 . 0 66 444 55 7777 0 6 33 33 0 8 33 0 6 2 55 33 66 ."' },
  { type: 'text', content: '777 444 55 55 33 777 8 ! 0 66 444 33 8 0 333 777 33 3 33 777 444 55 . 0 22 444 5 66 2 2 6 0 - - 0 55 33 66 66 33 66 0 33 555 55 2 2 777 0 3 88 7777 .' },
  { type: 'text', content: '9 666 88 0 6 33 0 3 444 777 33 222 8 0 9 33 4 0 44 33 22 22 33 66 .' },
  { type: 'text', content: '22 2 777 6 2 66 : 0 " 6 666 33 8 0 66 666 4 0 66 2 2 777 0 3 33 0 4 777 666 666 8 44 2 66 3 33 555 . " 0 666 7 0 3 444 8 0 88 88 777 ?' },
  { type: 'text', content: '8 44 88 444 7777 0 4 33 7777 7 444 8 . 2010 , 0 555 666 55 2 555 33 0 55 777 2 66 8 :' },
  { type: 'text', content: '22 2 7777 55 33 8 22 2 555 8 666 33 777 66 666 666 444 0 4 33 9 666 66 66 33 66 0 3 666 666 777 0 222 555 2 33 7777 , 0 22 2 777 6 2 66 , 0 33 66' },
  { type: 'text', content: '44 33 66 55 0 3 33 0 5 666 66 4 0 - - 0 888 2 7777 8 4 666 33 3 6 2 66 .' },
  { type: 'text', content: '3 777 444 33 0 6 2 8 33 66 . 0 33 33 66 0 888 33 777 55 666 666 7 8 , 0 33 33 66 0 55 666 666 7 8 , 0 33 33 66 ?' },
  { type: 'text', content: '6 666 777 4 33 66 0 7777 8 2 3 44 88 444 7777 !' },
  
];

// ────────────────────────────────────────────────────────────
// Page 3
// ────────────────────────────────────────────────────────────

const PAGE_3: Line[] = [
  { type: 'text',  content: 'Ssldhtgi — bgki. Guub driigua, nuub vuantbbgbn,' },
  { type: 'text',  content: 'nuub rvuadalchsilksu rp dls puacuue suatn su vgbdub.' },
  { type: 'text',  content: 'Amosublla ogj du olegu wuad zubtwlchsgn srub gk drravarun.' },
  { type: 'text',  content: 'Dgs gi nuub ieradgnhugd. Dgs gi wunnuwuaks.' },
  { type: 'spacer' },
  { type: 'text',  content: 'Celui zuef nuiparkub rp zgjb klbsrra. Obskubdu leeui.' },
  { type: 'text',  content: 'Kubs du olamlb bgus, brrgs zlkub muu nudllb, wuus vlb bgki.' },
  { type: 'text',  content: 'Geldjui, nrud vrraouaugd.' },
  { type: 'spacer' },
  { type: 'text',  content: 'Trub egus gk du bllm Hubk du Jrbn vleeub.' },
  { type: 'spacer' },
  { type: 'quote', content: '"Jl hrra, eukkua leeumlle mus dgu ertbnuola vlb \'m.\nMlla krm rp zun — Oagubslegi? Dru bramlle."' },
  { type: 'text',  content: 'Sucrbdu elsua zln hgj llb mgjb nuzgchs dls hgj su vuue' },
  { type: 'text',  content: 'nuzund hld. Wuad dgaucs oatslle, agup zgjb iucauslauiiu,' },
  { type: 'text',  content: 'gk mrchs rbmgddueegjk vuasaukkub.' },
  { type: 'note',  content: 'Lussuaegjk du nlbn rp nuorbjrtad.' },
  { type: 'spacer' },
  { type: 'arrow',  content: 'Naam van die loungebar is dus:' },
  { type: 'cipher', words: ['ertbnuola', 'ragubslegi'] },
  { type: 'arrow',  content: 'Hgj kubs du pelbbub vlb Hubk.\nHgj kubs dti rrk du bllm uavlb vrradls dgu ptoeguk gi.\nDls gi hus vuaolbd.' },
  { type: 'spacer' },
  { type: 'text',  content: 'Gubrun nupalls mus dgu nlisub. Zu egunub leeu dagu.' },
  { type: 'text',  content: 'Ik nl vlblvrbd zuef blla dls puacuue,' },
  { type: 'text',  content: 'Mreubisalls / Kuakpeugb. Vrra hus drbkua.' },
  { type: 'text',  content: 'Evub arbdkgjkub, frsr\'i mlkub vlb wls dlla nuoutas.' },
];

const PAGE_LABELS = ['Pagina 1', 'Pagina 2', 'Pagina 3'];

// ────────────────────────────────────────────────────────────
// Fill-in boxes component
// ────────────────────────────────────────────────────────────

function FillLine({ words }: { words: number[] }) {
  const totalBoxes = words.reduce((a, b) => a + b, 0);
  const [values, setValues] = useState<string[]>(Array(totalBoxes).fill(''));
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const focus = (idx: number) => {
    setTimeout(() => refs.current[idx]?.focus(), 0);
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (values[idx]) {
        setValues(prev => { const n = [...prev]; n[idx] = ''; return n; });
      } else if (idx > 0) {
        setValues(prev => { const n = [...prev]; n[idx - 1] = ''; return n; });
        focus(idx - 1);
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      e.preventDefault(); focus(idx - 1);
    } else if (e.key === 'ArrowRight' && idx < totalBoxes - 1) {
      e.preventDefault(); focus(idx + 1);
    } else if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
      e.preventDefault();
      setValues(prev => { const n = [...prev]; n[idx] = e.key.toUpperCase(); return n; });
      if (idx < totalBoxes - 1) focus(idx + 1);
    }
  };

  // Build boxes grouped by word
  let gi = 0; // global index across all words
  return (
    <div className="fill-line">
      {words.map((len, wi) => {
        const startIdx = gi;
        gi += len;
        return (
          <span key={wi} className="fill-group">
            {wi > 0 && <span className="fill-word-gap" />}
            {Array.from({ length: len }, (_, li) => {
              const idx = startIdx + li;
              return (
                <input
                  key={li}
                  ref={el => { refs.current[idx] = el; }}
                  value={values[idx]}
                  readOnly
                  onKeyDown={e => handleKeyDown(idx, e)}
                  onClick={() => refs.current[idx]?.focus()}
                  className="fill-box"
                  type="text"
                  tabIndex={0}
                  autoComplete="off"
                  spellCheck={false}
                />
              );
            })}
          </span>
        );
      })}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Cipher fill component  (cipher letter on top, fill box below)
// ────────────────────────────────────────────────────────────

function CipherLine({ words }: { words: string[] }) {
  const totalBoxes = words.reduce((a, b) => a + b.length, 0);
  const [values, setValues] = useState<string[]>(Array(totalBoxes).fill(''));
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const focus = (idx: number) => {
    setTimeout(() => refs.current[idx]?.focus(), 0);
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (values[idx]) {
        setValues(prev => { const n = [...prev]; n[idx] = ''; return n; });
      } else if (idx > 0) {
        setValues(prev => { const n = [...prev]; n[idx - 1] = ''; return n; });
        focus(idx - 1);
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      e.preventDefault(); focus(idx - 1);
    } else if (e.key === 'ArrowRight' && idx < totalBoxes - 1) {
      e.preventDefault(); focus(idx + 1);
    } else if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
      e.preventDefault();
      setValues(prev => { const n = [...prev]; n[idx] = e.key.toUpperCase(); return n; });
      if (idx < totalBoxes - 1) focus(idx + 1);
    }
  };

  let gi = 0;
  return (
    <div className="cipher-line">
      {words.map((word, wi) => {
        const startIdx = gi;
        gi += word.length;
        return (
          <span key={wi} className="cipher-group">
            {wi > 0 && <span className="cipher-word-gap" />}
            {[...word].map((ch, li) => {
              const idx = startIdx + li;
              return (
                <span key={li} className="cipher-cell">
                  <span className="cipher-letter">{ch}</span>
                  <input
                    ref={el => { refs.current[idx] = el; }}
                    value={values[idx]}
                    readOnly
                    onKeyDown={e => handleKeyDown(idx, e)}
                    onClick={() => refs.current[idx]?.focus()}
                    className="fill-box"
                    type="text"
                    tabIndex={0}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </span>
              );
            })}
          </span>
        );
      })}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Notebook page renderer
// ────────────────────────────────────────────────────────────

function NotebookPageElement({ lines, pageNumber, showNokiaHint = false }: { lines: Line[]; pageNumber: number; showNokiaHint?: boolean }) {
  return (
    <div className="notebook-page" style={{ position: 'relative' }}>
      <div className="page-number">{pageNumber}</div>

      {/* Subtle Nokia keyboard watermark — only visible after first unlock */}
      {showNokiaHint && (
        <div style={{
          position: 'absolute',
          bottom: '2rem',
          right: '1.5rem',
          opacity: 0.12,
          pointerEvents: 'none',
          transform: 'rotate(3deg)',
          zIndex: 0,
        }}>
          <Image
            src="/images/pages/nokia-keyboard.png"
            alt=""
            width={120}
            height={90}
            style={{ filter: 'sepia(1) brightness(0.6)' }}
          />
        </div>
      )}

      {lines.map((line, i) => {
        switch (line.type) {
          case 'spacer':
            return <div key={i} className="line-spacer" />;

          case 'rule':
            return <hr key={i} className="notebook-rule" />;

          case 'quote':
            return (
              <div key={i} className="quote-block">
                {line.content.split('\n').map((l, j) => (
                  <div key={j}>{l}</div>
                ))}
              </div>
            );

          case 'arrow':
            return (
              <div key={i} className="arrow-block">
                <span className="arrow-symbol">→</span>
                <div>
                  {line.content.split('\n').map((l, j) => (
                    <div key={j}>{l}</div>
                  ))}
                </div>
              </div>
            );

          case 'note':
            return (
              <div key={i} className="note-block">
                <span className="note-symbol">!!</span>
                <div>
                  {line.content.split('\n').map((l, j) => (
                    <div key={j}>{l}</div>
                  ))}
                </div>
              </div>
            );

          case 'fill':
            return <FillLine key={i} words={line.words} />;

          case 'cipher':
            return <CipherLine key={i} words={line.words} />;

          case 'text':
          default:
            return (
              <div key={i} className="text-line">
                {line.content}
              </div>
            );
        }
      })}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Main notebook component
// ────────────────────────────────────────────────────────────

function NotebookContent() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(0);

  const { data: gameStatus, isLoading } = useSWR(
    'game-status-notebook',
    () => gameApi.getGameStatus(),
    { revalidateOnFocus: false }
  );

  const { data: unlockedCodes } = useSWR(
    'unlocked-codes-notebook',
    () => unlockApi.getUnlocked(),
    { revalidateOnFocus: false }
  );

  const hasUnlockedCharacter = (unlockedCodes?.length ?? 0) > 0;

  useEffect(() => {
    if (!isLoading && gameStatus && !gameStatus.isPlaytest) {
      router.push('/');
    }
  }, [gameStatus, isLoading, router]);

  if (isLoading || !gameStatus?.isPlaytest) {
    return (
      <div className="h-screen bg-stone-950 flex items-center justify-center">
        <div className="text-stone-600 text-sm">Laden…</div>
      </div>
    );
  }

  const barName = gameStatus.barName || 'de bar';
  const PAGES = [makePage1(barName), PAGE_2, PAGE_3];

  return (
    <div className="h-screen bg-stone-950 flex flex-col">
      <GameHeader />

      <div className="flex-1 overflow-auto flex flex-col items-center py-8 px-4">

        <div className="notebook-wrapper">
          {/* Spiral binding */}
          <div className="binding">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="binding-hole" />
            ))}
          </div>

          {/* Page content */}
          <NotebookPageElement
            lines={PAGES[currentPage]}
            pageNumber={currentPage + 1}
            showNokiaHint={currentPage === 1 && hasUnlockedCharacter}
          />
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-6 mt-6">
          <button
            onClick={() => setCurrentPage(p => p - 1)}
            disabled={currentPage === 0}
            className="flex items-center gap-2 px-4 py-2 rounded bg-stone-800 border border-stone-700
                       text-stone-300 text-sm disabled:opacity-30 disabled:cursor-not-allowed
                       hover:bg-stone-700 hover:text-stone-100 transition-colors"
          >
            ← Vorige
          </button>

          <div className="flex gap-2">
            {PAGES.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={`w-8 h-8 rounded text-xs font-medium transition-colors ${
                  i === currentPage
                    ? 'bg-amber-800 text-amber-100 border border-amber-600'
                    : 'bg-stone-800 text-stone-400 border border-stone-700 hover:bg-stone-700'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage(p => p + 1)}
            disabled={currentPage === PAGES.length - 1}
            className="flex items-center gap-2 px-4 py-2 rounded bg-stone-800 border border-stone-700
                       text-stone-300 text-sm disabled:opacity-30 disabled:cursor-not-allowed
                       hover:bg-stone-700 hover:text-stone-100 transition-colors"
          >
            Volgende →
          </button>
        </div>

        <p className="text-stone-600 text-xs mt-3">
          {PAGE_LABELS[currentPage]} — Digitale playtestversie
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&display=swap');

        .notebook-wrapper {
          display: flex;
          flex-direction: row;
          background: #1a1714;
          border-radius: 4px 8px 8px 4px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04);
          max-width: 580px;
          width: 100%;
        }

        .binding {
          width: 32px;
          flex-shrink: 0;
          background: #111;
          border-radius: 4px 0 0 4px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-evenly;
          padding: 24px 0;
          border-right: 2px solid #2a2520;
        }

        .binding-hole {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #0a0908;
          border: 2px solid #333;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.8);
        }

        .notebook-page {
          flex: 1;
          background: #faf6ee;
          padding: 32px 36px 40px 28px;
          border-radius: 0 8px 8px 0;
          position: relative;
          min-height: 640px;
          background-image: repeating-linear-gradient(
            to bottom,
            transparent, transparent 31px,
            #d4cbb8 31px, #d4cbb8 32px
          );
          background-size: 100% 32px;
          background-position: 0 12px;
          border-left: 2px solid rgba(232,160,144,0.5);
        }

        .notebook-page::before {
          content: '';
          position: absolute;
          top: 0; left: 36px; bottom: 0;
          width: 1px;
          background: rgba(200, 80, 60, 0.2);
          pointer-events: none;
        }

        .page-number {
          font-family: 'Caveat', cursive, sans-serif;
          font-size: 11px;
          color: #b0a090;
          text-align: right;
          line-height: 32px;
          margin-bottom: 4px;
        }

        .text-line {
          font-family: 'Caveat', cursive, sans-serif;
          font-size: 19px;
          color: #2a1f0e;
          line-height: 32px;
          min-height: 32px;
          word-break: break-word;
        }

        .line-spacer { height: 32px; }

        .notebook-rule {
          border: none;
          border-top: 1px dashed #c8b8a0;
          margin: 0;
          height: 32px;
        }

        .quote-block {
          font-family: 'Caveat', cursive, sans-serif;
          font-size: 18px;
          color: #3a2a10;
          line-height: 32px;
          padding-left: 18px;
          border-left: 3px solid #8a7a60;
          margin-left: 8px;
          font-style: italic;
          word-break: break-word;
        }

        .arrow-block {
          font-family: 'Caveat', cursive, sans-serif;
          font-size: 18px;
          color: #1a3a1a;
          line-height: 32px;
          display: flex;
          gap: 8px;
          align-items: flex-start;
          background: rgba(60, 120, 60, 0.08);
          border-radius: 4px;
          padding: 0 8px;
          word-break: break-word;
        }

        .arrow-symbol {
          font-size: 20px;
          color: #2a6a2a;
          flex-shrink: 0;
          margin-top: 2px;
          font-style: normal;
        }

        /* !! annotation — red/urgent style */
        .note-block {
          font-family: 'Caveat', cursive, sans-serif;
          font-size: 17px;
          color: #7a1a1a;
          line-height: 30px;
          display: flex;
          gap: 8px;
          align-items: flex-start;
          background: rgba(180, 30, 30, 0.06);
          border-left: 3px solid rgba(180, 60, 60, 0.5);
          padding: 0 8px;
          border-radius: 0 4px 4px 0;
        }

        .note-symbol {
          font-size: 16px;
          font-weight: 700;
          color: #c04040;
          flex-shrink: 0;
          margin-top: 2px;
          font-style: normal;
          letter-spacing: -1px;
        }

        /* Fill-in boxes */
        .fill-line {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-end;
          gap: 0;
          padding-left: 29px; /* align under quote text */
          min-height: 40px;
          padding-top: 4px;
        }

        .fill-group {
          display: inline-flex;
          align-items: flex-end;
          gap: 3px;
        }

        .fill-word-gap {
          display: inline-block;
          width: 14px;
        }

        .fill-box {
          width: 21px;
          height: 30px;
          border: none;
          border-bottom: 2px solid #6a5a40;
          background: transparent;
          font-family: 'Caveat', cursive, sans-serif;
          font-size: 18px;
          color: #1a3a6a;
          font-weight: 600;
          text-align: center;
          outline: none;
          padding: 0;
          cursor: text;
          caret-color: transparent;
          border-radius: 0;
          -webkit-appearance: none;
          appearance: none;
        }

        .fill-box:focus {
          border-bottom: 2px solid #8a3020;
          background: rgba(180, 60, 30, 0.07);
        }

        /* Remove text cursor on readonly */
        .fill-box::selection { background: transparent; }

        /* Cipher fill — letter on top, fill box below */
        .cipher-line {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-end;
          gap: 0;
          padding-left: 8px;
          padding-top: 6px;
          padding-bottom: 6px;
        }

        .cipher-group {
          display: inline-flex;
          gap: 4px;
        }

        .cipher-word-gap {
          display: inline-block;
          width: 22px;
        }

        .cipher-cell {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1px;
        }

        .cipher-letter {
          font-family: 'Caveat', cursive, sans-serif;
          font-size: 13px;
          color: #7a6a50;
          line-height: 1;
          letter-spacing: 0;
          user-select: none;
        }
      `}</style>
    </div>
  );
}

export default function NotebookPage() {
  return (
    <AuthGuard>
      <NotebookContent />
    </AuthGuard>
  );
}
