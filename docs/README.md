# job_seeker_ro_spider

**job_seeker_ro_spider** — scraper pentru job-urile Qualitest din România.

Extrage anunțurile de pe [Workable — Qualitest careers](https://apply.workable.com/qualitest-1/) și le publică în [peviitor.ro](https://peviitor.ro) prin API-ul SOLR.

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
3. **Scrape-uiește job-urile** — extrage lista completă de job-uri din API-ul public Workable, filtrat pe România
4. **Transformă datele** — normalizează locațiile (doar orașe românești), tag-urile (lowercase), workmode-ul (remote/on-site/hybrid)
5. **Stochează în SOLR** — upsert în `job` core (job-urile) și `company` core (datele companiei cu adresa completă)
6. **Generează docs/jobs.md** — fișier markdown cu informații companie + toate job-urile curente, publicat pe [GitHub Pages](https://sebiboga.github.io/qualitest-dc-ro-srl-nodejs-scraper/jobs.md)

## Structură proiect

```
├── config/company.json         # Sursa unică de adevăr (CIF, brand, URL-uri, API)
├── index.js                    # Orchestrator scraper
├── company.js                  # Validare companie (ANAF + SOLR)
├── solr.js                     # Operații SOLR
├── demoanaf.js                 # Interfață CLI pentru ANAF
├── validate-jobs.js            # Validator manual (deep / content-aware)
├── tests/                      # Test suites
│   ├── unit/                   #   Unit tests (mock-uri)
│   ├── integration/            #   Integration tests (API-uri live)
│   ├── e2e/                    #   End-to-end tests (pipeline complet)
│   ├── consistency/            #   Consistency tests (repo config)
│   └── package.json            #   Jest config + raportare HTML
├── .github/workflows/          # Workflow-uri CI/CD
│   ├── job-seeker-ro-spider.yml      # Main scraper
│   └── automation-testing.yml        # Test automation
└── docs/                       # GitHub Pages site
    ├── index.html              # Interfață web
    ├── company.json            # Date companie (regenerate la fiecare scrape)
    └── jobs.md                 # Listă job-uri (generată)
```

## API Endpoints folosite

| Serviciu | Endpoint | Metodă |
|----------|----------|--------|
| ANAF Search | `https://demoanaf.ro/api/search?q=<BRAND>` | GET |
| ANAF Company | `https://demoanaf.ro/api/company/<CIF>` | GET |
| Workable Jobs | `https://apply.workable.com/api/v3/accounts/qualitest-1/jobs` | POST |
| ANOFM Jobs | `https://www.anofm.ro/api/entity/vw_public_job_posting` | POST |
| SOLR select | `https://solr.peviitor.ro/solr/job/select?q=cif:<CIF>` | GET |
| SOLR update | `https://solr.peviitor.ro/solr/job/update?commit=true` | POST |
| Peviitor API | `https://api.peviitor.ro/v1/company/?cif=<CIF>` | GET |

## Sursă date — Workable API

| Proprietate | Valoare |
|-------------|---------|
| API URL | `POST https://apply.workable.com/api/v3/accounts/qualitest-1/jobs` |
| Autentificare | None (public) |
| Format request | JSON (`{query, department, location, workplace, worktype, page, pageSize}`) |
| Format răspuns | `{total, results: [{id, title, location, workplace, url, ...}]}` |
| Paginare | Paginat, 50 per pagină |

## Politica față de robots.txt

Workable [robots.txt](https://apply.workable.com/robots.txt) dezactivează:

| Cale | Status | Impact |
|------|--------|--------|
| `/api/v3/*` | ❌ Disallowed | API-ul JSON — folosit de scraper |
| `/*/j/*/apply` | ❌ Disallowed | Pagini de aplicare — nu sunt scraper-uite |
| `/signup`, `/login` | ❌ Disallowed | Autentificare — nefolosit |

robots.txt nu este legal binding, dar scraperul respectă bunele practici: rate limiting, User-Agent standard, o singură cerere simultană.

## Ghid testare

```bash
# Doar unit (mock-uri, rapid)
npm run test:unit

# Doar integration (ANAF live + verificare configurație)
npm run test:integration

# Doar E2E (API real Workable + ANAF + SOLR)
npm run test:e2e

# Doar consistency (repo config)
npm run test:consistency

# Toate testele
npm test
```
