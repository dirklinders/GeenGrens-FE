import { PaperSheet } from '@/components/game/paper-sheet';

export function NewspaperHeadline() {
  return (
    <PaperSheet className="max-w-md mx-auto">
      <header className="border-b-4 border-double border-stone-800 pb-3 mb-5">
        <p className="font-serif text-2xl md:text-3xl font-bold text-center tracking-tight">
          Zutphense Courant
        </p>
        <div className="flex justify-between gap-3 text-xs text-stone-700 mt-3">
          <span>Stadsnieuws</span>
          <time dateTime="2001-10-16">16 oktober 2001</time>
        </div>
      </header>
      <article className="font-serif">
        <h2 className="text-2xl md:text-3xl font-bold leading-tight mb-2">
          Willem Thieme dood aangetroffen
        </h2>
        <p className="text-lg italic text-stone-700 mb-4">
          Politie staat voor een raadsel
        </p>
        <p className="text-sm leading-relaxed text-stone-800">
          <span className="font-bold">ZUTPHEN — </span>
          Op 15 oktober is het lichaam van Willem Thieme uit het water gehaald.
          Thieme was een bekende verschijning in de stad en stond bekend om zijn
          voorliefde voor een borrel. De politie vermoedt moord. Door de vergevorderde
          staat van ontbinding kan de doodsoorzaak niet worden vastgesteld.
        </p>
      </article>
    </PaperSheet>
  );
}
