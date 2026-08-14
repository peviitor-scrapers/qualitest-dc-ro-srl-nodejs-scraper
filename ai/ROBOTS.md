# Robots.txt Analysis — Qualitest Workable

Sursa: https://apply.workable.com/robots.txt

## Reguli

```
User-agent: *
Content-Signal: search=yes, ai-input=yes, ai-train=no
Disallow:
```

## Interpretare

| Cale | Accesibil? | Ce conține |
|---|---|---|
| `/` | ✅ Allowed | Tot site-ul (fără Disallow) |
| API (`/api/v3/accounts/...`) | ✅ Allowed | API-ul JSON de la care scraper-ul extrage datele |

## Recomandare

robots.txt este permissiv — nu există nicio cale disallowed.

- API-ul `POST https://apply.workable.com/api/v3/accounts/qualitest-1/jobs` răspunde cu 200 OK cu `User-Agent` normal și fără autentificare.
- Paginile individuale de job sunt accesibile; noi nu le scraper-uim direct — doar le verificăm accesibilitatea (HEAD request) în teste.
- Scraperul face o singură cerere la API pentru toate job-urile — comportament rezonabil, nu agresiv.

**Concluzie**: Risc minim. robots.txt permite tot, API-ul e public, iar scraperul e politicos (rate limiting, User-Agent standard).
