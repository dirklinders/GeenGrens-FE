'use client';

export function NewspaperHeadline() {
  return (
    <div className="bg-amber-50 text-stone-900 p-8 md:p-12 max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
      {/* Paper texture overlay */}
      <div 
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Newspaper header */}
      <header className="border-b-4 border-double border-stone-800 pb-4 mb-6 relative">
        <div className="flex justify-between items-center text-xs text-stone-600 mb-2">
          <span>Baarle Courant</span>
          <span>Woensdag 19 maart 2026</span>
          <span>Jaargang 142, Nr. 67</span>
        </div>
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-center tracking-tight">
          DE BAARLE COURANT
        </h1>
        <div className="text-center text-xs text-stone-600 mt-2 italic">
          &quot;De stem van de grensstreek sinds 1884&quot;
        </div>
      </header>

      {/* Main headline */}
      <article className="relative">
        <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-center mb-6">
          Viktor Vermeer, dood aangetroffen in woning
        </h2>
        
        {/* Subheadline with strikethrough and handwritten correction */}
        <div className="text-center mb-8 relative">
          <p className="font-serif text-xl md:text-2xl text-stone-700 inline-block relative">
            <span className="relative">
              politie gaat{' '}
              <span className="relative inline-block">
                <span className="relative z-10">niet uit van een misdrijf</span>
                {/* Red pen strikethrough - multiple lines for realistic effect */}
                <svg 
                  className="absolute -left-2 top-1/2 -translate-y-1/2 w-[calc(100%+16px)] h-8 pointer-events-none z-20"
                  viewBox="0 0 200 30"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M2 14 Q 30 10, 60 16 T 120 12 T 180 15 T 198 13"
                    stroke="#b91c1c"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                    style={{
                      filter: 'url(#penTexture)',
                    }}
                  />
                  <path
                    d="M4 16 Q 40 20, 80 14 T 140 18 T 196 15"
                    stroke="#b91c1c"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    opacity="0.7"
                  />
                  <defs>
                    <filter id="penTexture">
                      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" result="noise" />
                      <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
                    </filter>
                  </defs>
                </svg>
              </span>
            </span>
          </p>
          
          {/* Handwritten "MOORD" in red pen */}
          <div className="mt-4 relative">
            <span 
              className="font-[family-name:var(--font-handwritten)] text-red-700 text-4xl md:text-5xl font-bold relative inline-block -rotate-2"
              style={{
                textShadow: '1px 1px 0 rgba(185, 28, 28, 0.3)',
              }}
            >
              MOORD
              {/* Underline scribble */}
              <svg 
                className="absolute -bottom-2 left-0 w-full h-4"
                viewBox="0 0 100 15"
                preserveAspectRatio="none"
              >
                <path
                  d="M0 8 Q 20 4, 40 10 T 80 6 T 100 9"
                  stroke="#b91c1c"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </div>
        </div>

        {/* Article columns */}
        <div className="grid md:grid-cols-2 gap-6 text-sm leading-relaxed text-stone-800 border-t border-stone-300 pt-6">
          <div className="space-y-4">
            <p className="first-letter:text-4xl first-letter:font-serif first-letter:font-bold first-letter:float-left first-letter:mr-2 first-letter:mt-1">
              De bekende journalist en grensonderzoeker Viktor Vermeer (58) is gisterenavond 
              dood aangetroffen in zijn woning aan de Singel in Baarle-Nassau. De politie 
              werd rond 21:30 uur gealarmeerd door een bezorgde buurman die al enkele dagen 
              niets van Vermeer had vernomen.
            </p>
            <p>
              Vermeer was de afgelopen maanden bezig met een groot onderzoek naar de 
              historische grensverdragen tussen Nederland en België. Bronnen dicht bij 
              het onderzoek suggereren dat hij op het punt stond om &quot;explosieve 
              onthullingen&quot; te doen over verborgen documenten.
            </p>
          </div>
          <div className="space-y-4">
            <p>
              De politie laat weten dat er &quot;geen aanwijzingen zijn voor een misdrijf&quot; 
              en gaat uit van een natuurlijke doodsoorzaak. Echter, meerdere collega&apos;s 
              van Vermeer hebben hun twijfels geuit over deze conclusie.
            </p>
            <p>
              &quot;Viktor was kerngezond en had geen enkele medische voorgeschiedenis,&quot; 
              aldus een anonieme bron. &quot;En hij vertelde me vorige week nog dat hij 
              zich bedreigd voelde. Dit klopt niet.&quot;
            </p>
            <p className="italic text-stone-600">
              Lees meer over het leven en werk van Viktor Vermeer op pagina 4-5.
            </p>
          </div>
        </div>
      </article>

      {/* Coffee stain effect */}
      <div 
        className="absolute bottom-12 right-8 w-24 h-24 rounded-full opacity-10 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, #78350f 32%, #78350f 40%, transparent 42%, transparent 60%, #78350f 62%, #78350f 70%, transparent 72%)',
          transform: 'rotate(15deg)',
        }}
      />
    </div>
  );
}
