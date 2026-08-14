# Robots.txt Analysis — QualityAI Careers

Sursa: https://careers.quality-ai.com/robots.txt

## Reguli

```
User-agent: *
Disallow: /applybutton/
Disallow: /talentcommunity/
Disallow: /mobile/talentcommunity/
Disallow: /emailsubscribe/
Disallow: /email/image/
Disallow: /services/
Disallow: /preapply/
Disallow: /error
Disallow: /unsubscribe/
Disallow: /reset/
```

## Interpretare

| Cale | Accesibil? | Ce conține |
|---|---|---|
| `/jobs` (`/jobs/search`) | ✅ Allowed | Pagina SSR HTML de search de la care scraper-ul extrage datele |
| `/` | ✅ Allowed | Restul site-ului public |
| `/applybutton/`, `/talentcommunity/`, `/preapply/`, etc. | 🚫 Disallowed | Formulare/canale secundare — nu le accesăm |

## Recomandare

robots.txt permite căile de job-uri (doar formularele secundare sunt disallowed).

- `GET https://careers.quality-ai.com/jobs/search?q=Bucharest&searchby=location` răspunde cu 200 OK cu `User-Agent` normal, fără autentificare.
- Paginile individuale de job sunt accesibile; noi le verificăm accesibilitatea în teste.
- Scraperul face o singură cerere la search pentru toate job-urile (fără paginare agresivă) — comportament rezonabil, nu agresiv.

**Concluzie**: Risc minim. `/jobs` e permis de robots.txt, pagina e publică, iar scraperul e politicos (rate limiting, User-Agent standard).
