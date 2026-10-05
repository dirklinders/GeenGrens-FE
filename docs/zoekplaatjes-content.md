# Zoekplaatjes — eerste speelbare inhoud

Maak in **Beheer → Locaties** drie locaties aan of open de bestaande locatie en kies
`Zoekfoto`. Plak per locatie de JSON hieronder via **Ruwe JSON bekijken / bewerken**.
De speler zoekt zelf in de afbeelding; de klikzones zijn niet zichtbaar.

## Librije

```json
{
  "note": "Notitie politie: op de grond ligt een boek getiteld ‘Stadsprivileges en muntrechten Zutphen’. De ketting is doorgeknipt, maar ligt er nog — anders dan bij de overige boeken.",
  "image": "/images/zoekplaatjes/librije.png",
  "hotspots": [
    {
      "id": "book",
      "x": 46,
      "y": 59,
      "label": "Het opengeslagen boek",
      "detail": "Dit is geen willekeurig boek: het gaat over stadsprivileges en muntrechten van Zutphen. In de marge staat, met andere inkt: ‘nooit ingetrokken?’"
    },
    {
      "id": "chain",
      "x": 76,
      "y": 78,
      "label": "Doorgeknipte boekenketting",
      "detail": "De ketting is nog aanwezig. De snede is vers en platgedrukt: mogelijk gemaakt met een betonschaar. Iemand wilde dit ene boek los hebben, niet laten verdwijnen."
    },
    {
      "id": "margin",
      "x": 54,
      "y": 52,
      "label": "Aantekening in de marge",
      "detail": "Later toegevoegd, haastig geschreven: ‘E. (cafehouder) kent koper.’"
    }
  ]
}
```

## Ida Gerhardt-standbeeld

```json
{
  "note": "Notitie politie over de locatie: ‘Kade lijkt gebruikt te zijn, verse verfvegen aanwezig.’ ‘Standbeeld licht beschadigd, alsof iets ijzers en zwaars ertegenaan kwam.’",
  "image": "/images/zoekplaatjes/ida-gerhardt.png",
  "hotspots": [
    {
      "id": "paint",
      "x": 48,
      "y": 78,
      "label": "Verse verf op de kade",
      "detail": "De verf is nog glanzend en loopt naar de waterkant. Dit is geen oude onderhoudsvlek."
    },
    {
      "id": "coin",
      "x": 28,
      "y": 88,
      "label": "Munt tussen de klinkers",
      "detail": "Close-up: op de rand zitten resten die mogelijk bloed zijn. De munt is te opvallend achtergelaten om toeval te zijn."
    }
  ]
}
```

## De Munt

```json
{
  "note": "Notitie politie: toegangslog van T. Bouwmeester gevonden, gebruikt rond de tijd van de moord.",
  "image": "/images/zoekplaatjes/de-munt.png",
  "hotspots": [
    {
      "id": "crank",
      "x": 74,
      "y": 38,
      "label": "De nieuwe zwengel",
      "detail": "De pers is oud en donker van olie, maar deze zwengel is splinternieuw. Ook de bouten zijn recent geplaatst."
    },
    {
      "id": "filings",
      "x": 19,
      "y": 67,
      "label": "Metaalvijlsel",
      "detail": "Vers vijlsel en olie op de werkbank: hier is kort geleden aan metaal gewerkt."
    },
    {
      "id": "ledger",
      "x": 76,
      "y": 74,
      "label": "Toegangslog",
      "detail": "De log vermeldt toegang rond het vermoedelijke tijdstip van de moord. Naamplaatje in de buurt: T. Bouwmeester."
    }
  ]
}
```
