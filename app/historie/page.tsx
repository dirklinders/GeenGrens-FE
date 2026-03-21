import { PageLayout, BlogArticle, ImageBox } from "@/components/grensverkenner"

export default function HistoriePage() {
  return (
    <PageLayout tagline="De diepte in">
      <BlogArticle date="31 MAART 2026" title="Waarom we hier met twee maten meten">
        <p>
          Men vraagt mij vaak: &ldquo;Viktor, waarom die obsessie met een paar lijnen op de grond?&rdquo; 
          Mijn antwoord is altijd hetzelfde: omdat die lijnen het verhaal vertellen van achthonderd 
          jaar koppigheid.
        </p>

        <ImageBox caption="De oude grenzen, vastgelegd in documenten die ouder zijn dan de meeste landen." />

        <p>
          De historie van Baarle begon niet aan een vergadertafel, maar in de modder van de 
          middeleeuwen. Hertogen en heren ruilden grond alsof het speelkaarten waren. De Hertog 
          van Brabant wilde de belastinginkomsten van zijn bebouwde gronden niet kwijt, terwijl 
          de Heer van Breda de woeste gronden eromheen kreeg.
        </p>

        <p>
          Toen de grens tussen Nederland en België in de 19e eeuw definitief werd getrokken, 
          was de puzzel al zo ingewikkeld dat niemand hem durfde op te lossen. Ze lieten het 
          zoals het was. Dat is wat ik zo prachtig vind aan Baarle: het is een levend protest 
          tegen de drang om alles in nette vakjes in te delen.
        </p>
      </BlogArticle>
    </PageLayout>
  )
}
