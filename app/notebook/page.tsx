'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { AuthGuard } from '@/components/game/auth-guard';
import { GameHeader } from '@/components/game/game-header';
import { gameApi } from '@/lib/api';

// ────────────────────────────────────────────────────────────
// Page content types
// ────────────────────────────────────────────────────────────

type Line =
  | { type: 'text';   content: string }
  | { type: 'quote';  content: string }
  | { type: 'arrow';  content: string }
  | { type: 'note';   content: string }          // !! annotation
  | { type: 'fill';   words: number[] }          // infillable boxes
  | { type: 'spacer' }
  | { type: 'rule' };

// ────────────────────────────────────────────────────────────
// Page 1
// ────────────────────────────────────────────────────────────

const PAGE_1: Line[] = [
  { type: 'text',   content: 'Ywkhjgcwf ewl tjgf — cjgwy, dssl.' },
  { type: 'text',   content: 'Tsjesf. Lw dgk fs kdmalafyklabv.' },
  { type: 'text',   content: 'Ualssl [rg ygwv sdk dwllwjdabc]:' },
  { type: 'quote',  content: '"Yjgfv oakkwdl zawj owd nscwj\nnsf waywfssj. Fawl sdlabv fwlbwk.\nOaw zwl owwl, ogjvl wj twlwj\nnsf."' },
  { type: 'text',   content: 'Klghlw rauzrwdx. Oakl vsl zab' },
  { type: 'text',   content: 'lw nwwd rwa. Twklwdvw fgy wwf' },
  { type: 'text',   content: 'tawjlbw & rowwy.' },
  { type: 'spacer' },
  { type: 'arrow',  content: 'FSYWLJGCCWF: csvsklwj TW\nHwjuwwd — jglgfvw F264/\nKafywd, Tssjdw-Zwjlgy.' },
  { type: 'text',   content: 'Wwjklw jwyakljslaw: 25-04-2006' },
  { type: 'text',   content: 'Nóój vaw vslme: FAWL af' },
  { type: 'text',   content: 'Twdyakuz csvsklwj lwjmy' },
  { type: 'text',   content: 'lw nafvwf.' },
  { type: 'spacer' },
  { type: 'text',   content: 'Ywjwyakljwwjv waywfssj:' },
  { type: 'text',   content: 'TMJYWEWWKLWJ — T-Z.' },
  { type: 'spacer' },
  { type: 'text',   content: 'Hjanétwral? Ywwf ssfcggh-' },
  { type: 'text',   content: 'sclw ywngfvwf. Ywwf nwadafy.' },
  { type: 'text',   content: 'Ywwf wjxwfak.' },
  { type: 'spacer' },
  { type: 'rule' },
  { type: 'arrow',  content: 'ZGW CGE BW RGESSJ SSF\nWWF KLMC YJGFV?' },
  { type: 'spacer' },
  { type: 'text',   content: 'Tsjesf owwl ewwj.' },
  { type: 'text',   content: 'Lwjmycgewf. Nggjrauzlay.' },
];

// ────────────────────────────────────────────────────────────
// Page 2
// ────────────────────────────────────────────────────────────

const PAGE_2: Line[] = [
  { type: 'text',  content: '22 2 777 6 2 66 0 666 7 66 444 33 88 9 0 4 33 7777 7 777 666 55 33 66 .' },
  { type: 'text',  content: '66 88 0 66 88 222 44 8 33 777 . 0 3 444 222 44 8 33 0 44 666 88 3 444 66 4' },
  { type: 'text',  content: '888 2 66 0 44 33 8 0 22 33 4 444 66 0 2 333 0 2 2 66 .' },
  { type: 'text',  content: '4 33 888 777 2 2 4 3 0 66 2 2 777 0 44 33 8 0 7 33 777 222 33 33 555' },
  { type: 'text',  content: '22 444 5 0 3 33 0 777 666 8 666 66 3 33 . 0 44 444 5 0 44 2 2 555 3 33' },
  { type: 'text',  content: '9999 444 5 66 0 7777 222 44 666 88 3 33 777 7777 0 666 7 .' },
  { type: 'quote', content: '" 9 33 33 8 0 444 55 0 66 444 55 7777 0 888 2 66 . 0 4 777 666 66 3\n444 7777 0 4 777 666 66 3 . "' },
  { type: 'text',  content: '3 666 666 777 4 33 888 777 2 2 4 3 . 0 9 444 33 0 444 7777 0 3 33' },
  { type: 'text',  content: '33 444 4 33 66 2 2 777 ? 0 666 333 0 44 444 5 0 3 33 0 22 88 777 4 33 -' },
  { type: 'text',  content: '6 33 33 7777 8 33 777 0 55 33 66 8 .' },
  { type: 'text',  content: '44 444 5 0 2 2 777 9999 33 555 3 33 . 0 9999 33 444 0 8 666 33 66 :' },
  { type: 'quote', content: '" 777 444 55 55 33 777 8 ? 0 3 444 33 0 55 33 66 0 444 55\n66 2 88 9 33 555 444 5 55 7777 . "' },
  { type: 'text',  content: '" 777 444 55 55 33 777 8 . " 0 66 444 33 8 0 " 3 33 0 22 88 777 4 33 -' },
  { type: 'text',  content: '6 33 33 7777 8 33 777 . " 0 66 444 33 8 0 " 6 33 66 33 33 777 0 222 555 2 33 7777 . "' },
  { type: 'text',  content: '777 444 55 55 33 777 8 .' },
  { type: 'spacer' },
  { type: 'text',  content: '44 33 6 0 33 777 666 7 0 2 2 66 4 33 7777 7 777 666 55 33 66 .' },
  { type: 'text',  content: '44 444 5 0 8 777 666 55 0 9999 444 5 66 0 888 33 777 44 2 2 555 0 444 66 .' },
  { type: 'quote', content: '" 444 33 3 33 777 33 33 66 0 44 444 33 777 0 55 33 66 8 0 44 33 6\n9999 666 . 0 55 555 33 444 66 0 3 666 777 7 . "' },
  { type: 'text',  content: '3 2 2 777 66 2 : 0 66 444 55 7777 0 6 33 33 777 .' },
  { type: 'text',  content: '7 666 33 8 7777 3 666 33 55 0 4 33 7 2 55 8 . 0 777 88 4' },
  { type: 'text',  content: '8 666 33 4 33 55 33 33 777 3 .' },
  { type: 'spacer' },
  { type: 'arrow', content: '" 66 2 88 9 33 555 444 5 55 7777 " 0 55 33 66 66 33 66 0 66 666 33 6\n5 33 0 444 33 6 2 66 3 0 66 444 33 8 0 22 444 5 0 9999 444 5 66\n22 444 5 66 2 2 6 .' },
  { type: 'spacer' },
  { type: 'text',  content: '8 444 5 3 0 666 6 0 44 33 8 0 7 33 777 222 33 33 555 0 9999 33 555 333' },
  { type: 'text',  content: '8 33 0 22 33 55 444 5 55 33 66 . 0 777 666 8 666 66 3 33 0 66 2 6 4 .' },
  { type: 'text',  content: '6 666 777 4 33 66 666 222 44 8 33 66 3 0 888 777 666 33 4 .' },
];

// ────────────────────────────────────────────────────────────
// Page 3
// words in fill: [5,2,3,4,2,3,4,2,3]
//   e t a o i  = 5  (etaoi)
//   o s        = 2  (os)
//   n r h      = 3  (nrh)
//   d l u c    = 4  (dluc)
//   m o        = 2  (mo)
//   f w y      = 3  (fwy)
//   g l u p    = 4  (glup)
//   m o        = 2  (mo)
//   b w k      = 3  (bwk)
// ────────────────────────────────────────────────────────────

const PAGE_3: Line[] = [
  { type: 'text',  content: 'kdtop aod rihhano. suoa hiioos.' },
  { type: 'text',  content: 'chs iuor eoa aoddous hy coa' },
  { type: 'text',  content: 'oos cooaiusa. mlld jhcb.' },
  { type: 'text',  content: 'aokdomos pozucea.' },
  { type: 'text',  content: 'euj zhp cuj. nahb zujs ehsm tr.' },
  { type: 'quote', content: '"Juj ctoa mo pdtsmtrzuceaod\nzujs?"' },
  { type: 'text',  content: 'ub bsubao. iolpos, chhd' },
  { type: 'text',  content: 'euj rdhhaao coaoos.' },
  { type: 'quote', content: '"dubboda zou hi mha jo ztl\nbtcos. pdtta postop atce,\nmua nalb?"' },
  { type: 'text',  content: 'ub zou fousup. euj klimo' },
  { type: 'text',  content: 'mo nauiao zoiy tr.' },
  { type: 'quote', content: '"stp ata zhaodmhp fhceaos\nos mo pdtsm un khs tsn."' },
  { type: 'text',  content: 'atos, hinty euj ehdmtr mhcea:' },
  { type: 'quote', content: '"sl etros mha muo ghdchs\npostopos sooca coa muo\noxadh auos cuiio. nceiocuoi\nfooa suoa oosn mha muo\nghdcoum zujs oupos mtceaod un."' },
  { type: 'note',  content: 'ghdchs hypobtCea.\nghdcoum = mtCeaod khs\nghdchs. fooa eoa Zoiy suoa.' },
  { type: 'spacer' },
  { type: 'text',  content: 'Gevraagd naar de hotelnaam.' },
  { type: 'text',  content: 'Hij flapte het er uit:' },
  { type: 'quote', content: '"hotel os nrh dluc mo fwy glup mo bwk\nBinnenkort:\ne t a o i  o s  n r h  d l u c  m o  f w y  g l u p  m o  b w k."' },
  { type: 'fill',  words: [5, 2, 3, 4, 2, 3, 4, 2, 3] },
  { type: 'spacer' },
  { type: 'text',  content: 'atos ydtsnao euj.' },
  { type: 'quote', content: '"etozt fooa oos trzuceaod\nmo etaoishhc suoa?"' },
  { type: 'text',  content: 'ub iuoa mo iolpos khiios.' },
  { type: 'text',  content: 'mudoca pokdhhpm: eto un' },
  { type: 'text',  content: 'Cihon hhs muo pdtsm pobtcos?' },
  { type: 'quote', content: '"suoa mha eoa jo hhsphha.\noodiujb kodbdopos. sl\nfopfozos."' },
  { type: 'arrow', content: 'Zhaodmhp un mo mohmiuso.\nfousup auJm.\nktiposmo nahr: nahmelun.\ntlmo pdtsmmtnnuodn uszuos.\nos hin eoa bhs — Cihon\nzoiy nrdobos.' },
];

const PAGES = [PAGE_1, PAGE_2, PAGE_3];
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
// Notebook page renderer
// ────────────────────────────────────────────────────────────

function NotebookPageElement({ lines, pageNumber }: { lines: Line[]; pageNumber: number }) {
  return (
    <div className="notebook-page">
      <div className="page-number">{pageNumber}</div>

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
          <NotebookPageElement lines={PAGES[currentPage]} pageNumber={currentPage + 1} />
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
        }

        .fill-box:focus {
          border-bottom-color: #3a5a9a;
          background: rgba(60, 90, 160, 0.06);
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