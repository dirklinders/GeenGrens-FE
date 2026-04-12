import { PageLayout, BlogArticle } from "@/components/grensverkenner"

export default function BedrijvenPage() {
  return (
    <PageLayout tagline="Ondernemen op twee stoelen">
      <BlogArticle date="8 APRIL 2026" title="Welk land is uw leverancier eigenlijk?">
        <p>
          Baarle is niet alleen een geografisch raadsel — het is ook een zakelijk avontuur.
          Ondernemers hier zijn gewend aan vragen die elders nooit worden gesteld.
          &ldquo;Heeft u een Nederlandse of Belgische rekening?&rdquo; is in Baarle geen vreemde opener.
        </p>

        <p>
          Ik bezocht een handjevol bedrijven die de grens niet als obstakel zien, maar als
          handelsmerk. Elk van hen vertelde mij iets anders over wat het betekent om in twee
          landen tegelijk te bestaan.
        </p>

        <h3 className="font-serif text-lg font-semibold text-foreground mt-6 mb-2">
          De Biergrens: een streep op de vloer
        </h3>
        <p>
          Wie het vaker in Baarle-Hertog komt, stuit vroeg of laat op De Biergrens —
          een drankhandel die zijn naam volledig waarmaakt. Dwars door de winkel loopt een lijn
          op de vloer, zichtbaar gemarkeerd: hier houdt Nederland op en begint België. Klanten
          die een kratje Belgisch bier pakken doen dat technisch gezien op Belgisch grondgebied.
          Wie afrekent aan de kassa is even later alweer in een ander land.
        </p>

        <h3 className="font-serif text-lg font-semibold text-foreground mt-6 mb-2">
          De webshop zonder adres
        </h3>
        <p>
          De meest moderne variant trof ik in een woonwijk aan de rand van het dorp.
          Een jonge ondernemer runt een Europese webshop voor vintage fietsonderdelen.
          Zijn magazijn: deels NL, deels BE. Hij koos bewust voor een Belgische
          ondernemingsinschrijving omdat het Belgisch btw-tarief op tweedehands goederen
          gunstig uitvalt. Zijn klanten — verspreid over tien landen — hebben geen idee
          dat hun pakket een grens oversteekt vóórdat het het magazijn verlaat.
        </p>

        <h3 className="font-serif text-lg font-semibold text-foreground mt-6 mb-2">
          KvK vs. KBO: twee systemen, één dorp
        </h3>
        <p>
          Het fundamentele verschil voor iedereen die zaken doet in dit grensgebied:
          een Nederlands bedrijf identificeert zich met een <strong>KvK-nummer</strong> van
          acht cijfers, uitgegeven door de Kamer van Koophandel. Een Belgisch bedrijf heeft
          een <strong>ondernemingsnummer</strong> van tien cijfers (formaat:
          0xxx.xxx.xxx), uitgegeven door de Kruispuntbank van Ondernemingen — KBO in het
          Nederlands, BCE in het Frans. Achter dat eerste cijfer, altijd een nul of een één,
          schuilt het hele Belgische handelsregister.
        </p>

        <p>
          Als u hier een factuur ontvangt, let dan op de lengte van het registratienummer.
          Acht cijfers: u heeft met Nederland te maken. Tien: België. In Baarle is dat niet
          alleen boekhoudkundige precisie — het bepaalt welk rechtssysteem van toepassing is
          als er ooit een conflict ontstaat.
        </p>

      </BlogArticle>
    </PageLayout>
  )
}
