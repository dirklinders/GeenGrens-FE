import Link from 'next/link';
import { PageLayout, BlogArticle, ImageBox } from "@/components/grensverkenner"

export default function EnclavesPage() {
  return (
    <PageLayout tagline="De Puzzel van Baarle" showSecretLink>
      <BlogArticle date="20 APRIL 2026" title="Een land binnen een land">
        <p>
          Wie door Baarle wandelt, raakt onherroepelijk gedesoriënteerd. Het is niet simpelweg
          één grens die het dorp doormidden snijdt; het is een lappendeken. Er zijn 22 Belgische
          enclaves die als eilanden in het Nederlandse landschap liggen.
        </p>

        <ImageBox
          caption="De waanzinnige complexiteit van de grenslijnen in het centrum."
          src="/images/pages/enclaves.jpeg"
        />

        <p>
          Maar de echte fascinatie zit in de details: de zogenaamde <strong><Link href="https://geengrens.nl" className="hover:text-accent transition-colors cursor-default">&copy;</Link>ounter-enclaves</strong>. 
          Binnen de Belgische enclaves liggen namelijk weer zeven stukjes Nederlands grondgebied. 
          Het is een geografische &lsquo;Inception&rsquo;. Je bevindt je in Nederland, binnen een stukje 
          België, dat weer volledig omsloten is door Nederland.
        </p>

        <p>
          Dit zorgt voor de beroemde &lsquo;voordeurregel&rsquo;. De nationaliteit van een woning wordt 
          bepaald door waar de voordeur zich bevindt. Ik heb panden gezien waar de grens de 
          deurbel in tweeën splitst. Het herinnert ons eraan dat wetten en grenzen uiteindelijk 
          menselijke constructies zijn, die hier in Baarle tot het uiterste worden getest.
        </p>
      </BlogArticle>
    </PageLayout>
  )
}
