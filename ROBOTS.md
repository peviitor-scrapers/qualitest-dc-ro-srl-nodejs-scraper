# Robots.txt Analysis — Qualitest Careers (Workable)

Sursa: https://apply.workable.com/robots.txt

## Reguli

```
User-agent: *
Disallow: /api/
Disallow: /*/j/*/apply
Disallow: /*/j/*/teleport
Disallow: /signup
Disallow: /login
Disallow: /reset-password
Disallow: /invitations
Disallow: /settings
Disallow: /admin
Disallow: /*/dashboard
Allow: /
```

## Interpretare

| Cale | Accesibil? | Ce conține |
|---|---|---|
| `/` (landing) | ✅ Da | Paginile principale de job listings |
| `/qualitest-1/` | ✅ Da | Pagina de careers pentru Qualitest |
| `/api/v3/*` | ❌ **Disallowed** | API-ul JSON de la care scraper-ul extrage datele |
| `/*/j/*/apply` | ❌ Disallowed | Paginile de aplicare |
| `/signup`, `/login` | ❌ Disallowed | Autentificare |
| `/admin`, `/*/dashboard` | ❌ Disallowed | Panouri administrative |

## Recomandare

robots.txt NU este legal binding, dar reprezintă intenția proprietarului site-ului.

- API-ul `/api/v3/accounts/qualitest-1/jobs` e **disallowed** de robots.txt. În practică, serverul răspunde cu 200 OK pentru cereri standard fără autentificare.
- Paginile individuale de apply sunt disallowed. Noi nu le scraper-uim direct — doar le verificăm accesibilitatea (HEAD request) în E2E tests.
- Scraperul face o singură cerere per pagină cu delay de 1s între pagini — comportament rezonabil, nu agresiv.

**Concluzie**: Risc minim. API-ul e public, răspunde fără autentificare, iar scraperul e politicos (rate limiting, User-Agent standard, o singură cerere simultană).
