# job_seeker_ro_spider

**job_seeker_ro_spider** — scraper pentru job-urile QUALITEST DC RO S.R.L. din România.

Extrage anunțurile de pe [Qualitest Workable](https://apply.workable.com/qualitest-1/) și le publică în [peviitor.ro](https://peviitor.ro) prin API-ul Peviitor.

## Identificare

Toate request-urile HTTP folosesc User-Agent-ul:

```
job_seeker_ro_spider
```

## Ce face

1. **Validează compania** — interoghează API-ul public ANAF ([demoanaf.ro](https://demoanaf.ro)) după CIF-ul 39814543 și verifică:
   - Denumirea oficială: QUALITEST DC RO S.R.L.
   - Status: activ/inactiv/radiat
   - Adresa completă din registrul comerțului
2. **Cross-validează cu Peviitor** — verifică existența companiei în API-ul Peviitor
3. **Scrape-uiește job-urile** — extrage lista completă de job-uri din API-ul public Workable (POST `/api/v3/accounts/qualitest-1/jobs`)
4. **Transformă datele** — normalizează locațiile (doar orașe românești), tag-urile (lowercase), workmode-ul (remote/on-site/hybrid)
5. **Stochează prin Peviitor API** — upsert pentru job-uri și datele companiei
6. **Generează docs/jobs.md** — fișier markdown cu informații companie + toate job-urile curente, publicat pe GitHub Pages

## Structură proiect

```
├── scraper/
│   ├── config/company.json         # Sursa unică de adevăr (id, brand, URL-uri)
│   ├── config/company.js           # Loader ESM pentru config/company.json
│   ├── config/scraper.json         # Config scraper (apiBase, apiAccount)
│   ├── index.js                    # Orchestrator principal (Workable API scraping)
│   ├── company.js                  # Validare companie (ANAF + Peviitor)
│   ├── anaf.js                     # Modul ANAF API
│   ├── api.js                      # Operații Peviitor API (query, upsert, delete)
│   ├── markdown-generator.js       # Generează docs/jobs.md
│   ├── job-validator.js            # Validare job URL (HEAD/content/browser)
│   ├── validate-jobs.js            # Validator deep (CLI)
│   └── demoanaf.js                 # CLI ANAF
├── tmp/company.json                # Cache ANAF (gitignored, TTL 7 zile)
├── company.json                    # Cache ANAF committed (TTL 7 zile)
├── ai/                             # Documentație proiect (INSTRUCTIONS, models, etc.)
├── docs/
│   ├── jobs.md                     # Job-uri generate după fiecare scrape
│   └── test-results/               # Rapoarte teste HTML
├── tests/
│   ├── unit/                       # Teste unitare
│   ├── integration/                # Teste de integrare (ANAF + Peviitor live)
│   ├── e2e/                        # Teste end-to-end (Workable API real)
│   └── consistency/                # Teste config repo
└── .github/workflows/
    ├── job-seeker-ro-spider.yml    # Rulează zilnic la 6 AM UTC
    ├── automation-testing.yml      # Teste automate la fiecare push/PR
    └── job-recovery-from-disaster.yml  # Restaurare company core
```

## API-uri folosite

| API | URL | Autentificare |
|---|---|---|
| Workable Jobs | `https://apply.workable.com/api/v3/accounts/qualitest-1/jobs` | Public (POST JSON) |
| ANAF (demoanaf) | `https://demoanaf.ro/api/...` | Public |
| ANOFM | `https://mediere.anofm.ro/api/entity/vw_public_job_posting` | Public |
| Peviitor | `https://api.peviitor.ro/v1` | Public (fără auth) |

## Robots.txt

Workable [robots.txt](https://apply.workable.com/robots.txt) permite tot (`Disallow:` gol, `Content-Signal: ai-input=yes`). Scraper-ul face o singură cerere la API per scrape.

Pentru analiza completă, vezi [ROBOTS.md](../ai/ROBOTS.md).

## Testare

```bash
# Toate testele
npm test

# Doar unitare
npm run test:unit

# Doar integrare (ANAF live, Peviitor conditional)
npm run test:integration

# Doar E2E (Workable API real + ANAF + Peviitor)
npm run test:e2e
```

Testele se auto-skip dacă API-urile externe nu sunt disponibile. Nu e nevoie de `SOLR_AUTH` — toate operațiile merg prin Peviitor API.
