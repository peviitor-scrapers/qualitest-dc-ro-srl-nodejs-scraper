# Instructions

## Project Purpose

This scraper extracts job listings from Qualitest careers page (Romania only) and imports them to peviitor.ro.

Target: https://apply.workable.com/qualitest-1/

## Model Schemas

The job and company models are defined in:
- `job-model.md` - Job model schema
- `company-model.md` - Company model schema

## Important

These models are **dynamic** and can change over time. They are based on the official Peviitor Core schemas which may be updated.

## How to Keep Models Updated

When working on this scraper:

1. **Check for updates** in the Peviitor Core repository:
   - Repository: https://github.com/peviitor-ro/peviitor_core
   - Main file: README.md (contains Job and Company model schemas)

2. **When to update**:
   - Before starting new development work
   - If field requirements or validations have changed
   - If new fields have been added

3. **How to update**:
   - Fetch the latest README.md from peviitor_core main branch
   - Compare with current job-model.md and company-model.md
   - Update local files if there are differences
   - Update index.js mapping logic if field requirements changed

## Technologies

- **Node.js & JavaScript** - For scraping and data extraction
- **Apache SOLR** - For data storage and indexing

## Workflow Steps

1. **Start with brand** - We know the brand (e.g., "Qualitest")
2. **Search in DemoANAF** - Find company by brand, get CIF from search results
3. **Get company details from ANAF** - Using CIF, fetch full company data from ANAF
4. **Validate with Peviitor** - Verify company exists in Peviitor, get group/brand info
5. **Check existing jobs in SOLR** - Query SOLR by CIF to see what jobs already exist

## Project Structure

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
```

## API Endpoints Used

| Service | Endpoint | Method |
|---------|----------|--------|
| ANAF Search | `https://demoanaf.ro/api/search?q=<BRAND>` | GET |
| ANAF Company | `https://demoanaf.ro/api/company/<CIF>` | GET |
| Workable Jobs | `https://apply.workable.com/api/v3/accounts/qualitest-1/jobs` | POST |
| ANOFM Jobs | `https://www.anofm.ro/api/entity/vw_public_job_posting` | POST |
| Peviitor API | `https://api.peviitor.ro/v1/company/?cif=<CIF>` | GET |
| SOLR job core | `https://solr.peviitor.ro/solr/job/select?q=cif:<CIF>` | GET |
| SOLR company core | `https://solr.peviitor.ro/solr/company/select?q=id:<CIF>` | GET |
| SOLR upsert | `https://solr.peviitor.ro/solr/job/update?commit=true` | POST |
| SOLR delete | `https://solr.peviitor.ro/solr/job/update?commit=true` | POST |

## Testing Guide

```bash
# Unit tests (mock-uri, fără env vars)
npm run test:unit

# Integration tests (API-uri live)
npm run test:integration

# E2E (API real Workable + ANAF + SOLR)
npm run test:e2e

# Consistency tests
npm run test:consistency

# All tests
npm test
```

## Debugging

- Check `tmp/jobs.json` after each scrape
- SOLR auth is read from `SOLR_AUTH` env var
- ANAF API is public and rate-limited
- Workable API requires no auth for public listings
