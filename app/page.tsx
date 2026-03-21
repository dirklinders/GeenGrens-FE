import { PageLayout, BlogArticle } from "@/components/grensverkenner"

export default function Home() {
  return (
    <PageLayout tagline="Observaties van Viktor Vermeer">
      {/* Bio Section */}
      <section className="mb-10 flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-medium text-muted-foreground">
          FOTO
        </div>
        <div>
          <h2 className="font-serif text-xl font-bold text-foreground">Viktor Vermeer</h2>
          <p className="text-sm text-muted-foreground">Onderzoeksjournalist Geografie</p>
        </div>
      </section>

      {/* Blog Post */}
      <BlogArticle date="17 MAART 2026" title="De schoonheid van een versnipperd dorp">
        <p>
          Mijn naam is Viktor Vermeer en ik ben verliefd op een grens. Wat voor velen een 
          administratieve hoofdpijn lijkt, zie ik als een prachtig historisch monument. 
          Baarle-Nassau en Baarle-Hertog vormen samen de meest complexe grensstructuur ter wereld.
        </p>
        <p>
          Hier vind je geen muren, maar witte kruizen die dwars door huizen en tuinen lopen. 
          Het is een plek waar de logica soms ver te zoeken is, maar waar de menselijke 
          geschiedenis tastbaar wordt in elke stoeptegel. Op deze site leg ik vast wat dit 
          dorp zo uniek maakt.
        </p>
      </BlogArticle>
    </PageLayout>
  )
}
