# Project Files

## JavaScript Files — Root

| File | Description |
|------|-------------|
| `index.js` | Main scraper - full workflow: validate company → scrape → transform → upsert → generate docs/jobs.md |
| `company.js` | Validates company via ANAF + Peviitor APIs, checks if company is active/inactive |
| `solr.js` | SOLR operations module - exports querySOLR, deleteJobByUrl, upsertJobs + standalone verify/extract/company commands |
| `demoanaf.js` | CLI entry point for ANAF module (thin wrapper around src/anaf.js) |
| `validate-jobs.js` | **Generic deep validator (manual use).** Full GET requests, parses page body for "no longer available" keywords. Works with any CIF, single URL, or file. Slower but catches soft-404s. Not used by CI. |

## JavaScript Files — src/

| File | Description |
|------|-------------|
| `src/anaf.js` | ANAF API core module - exports getCompanyFromANAF(cif), getCompanyFromANAFWithFallback(cif, cached), searchCompany(brandName) |
| `src/markdown-generator.js` | Generates docs/jobs.md - exports generateJobsMarkdown(companyData, jobs) |
| `src/job-validator.js` | Shared validation primitives - exports validateByHead(url), validateByContent(url, opts), DEFAULT_EXPIRED_KEYWORDS. Used by both `validate-jobs.js` and `tests/validate-epam-jobs.js`. |

## Config — config/

| File | Description |
|------|-------------|
| `config/company.json` | **Single source of truth for company identity.** All scraper code, CI workflows, and the static HTML read from this file. |
| `config/company.js` | ESM wrapper that imports and exposes `config/company.json` to Node code |

## Test Files — tests/

| File | Description |
|------|-------------|
| `tests/package.json` | Jest config for test suite - experimental VM modules, test scripts (unit/integration/e2e/consistency) |
| `tests/company.json` | Mock ANAF company data used in unit tests |
| `tests/validate-epam-jobs.js` | **CI-friendly fast validator.** HEAD requests only. Called nightly by `automation-testing.yml`. Supports `--dry-run` and `--delete`. |
| `tests/unit/index.test.js` | Unit tests for index.js - parseApiJobs, mapToJobModel, transformJobsForSOLR |
| `tests/unit/company.test.js` | Unit tests for company.js - getCompanyBrand, validateAndGetCompany, fallback caching |
| `tests/unit/solr.test.js` | Unit tests for solr.js - query, upsert, delete, HTTP error handling |
| `tests/unit/demoanaf.test.js` | Unit tests for ANAF search and company retrieval with mocked responses |
| `tests/integration/workflow.test.js` | Integration tests - ANAF live API, Peviitor API, SOLR company/job cores |
| `tests/e2e/scraper.test.js` | E2E tests - full pipeline with real APIs |
| `tests/consistency/public.test.js` | Verifies repository is public on GitHub |
| `tests/consistency/repo.test.js` | Verifies default branch, GitHub Pages, SOLR_AUTH secret, workflow files |
| `tests/consistency/topics.test.js` | Verifies repository has required topics: job-seeker-ro-spider, peviitor-ro |
| `tests/consistency/workflow-naming.test.js` | Validates workflow file naming conventions |

## Markdown Files

| File | Description |
|------|-------------|
| `INSTRUCTIONS.md` | Project documentation - workflow, technologies, API endpoints, how to update models |
| `AGENTS.md` | Rules and conventions for AI agents working on this project |
| `CHANGELOG.md` | Version history |
| `CONTRIBUTING.md` | Contribution guidelines |
| `README.md` | Project overview and badges |
| `ROBOTS.md` | Robots.txt analysis and scraping policy for the target careers site |
| `files.md` | This file - complete project file listing |
| `company-model.md` | Peviitor company model schema documentation |
| `job-model.md` | Peviitor job model schema documentation |
| `UPDATE-REPO-ABOUT.md` | Instructions for updating GitHub repo description and topics |
| `PUBLIC.md` | Policy documentation about repository visibility |
| `TOPICS.md` | Required GitHub topics for all derived scrapers |
| `VERIFY.md` | Pre-merge verification checklist |
| `ISSUES.md` | Issue tracking requirements |
| `LICENSE` | MIT License |

## Config Files — Root

| File | Description |
|------|-------------|
| `package.json` | Project metadata and dependencies |
| `.gitignore` | Git ignore rules |

## Workflow Files — .github/workflows/

| File | Description |
|------|-------------|
| `job-seeker-ro-spider.yml` | Main scraper workflow - runs daily, full pipeline |
| `automation-testing.yml` | Automated testing - runs on push/PR/schedule |

## Documentation — config/

| File | Description |
|------|-------------|
| `config/company.json` | Single source of truth for company identity |

## Documentation — docs/

| File | Description |
|------|-------------|
| `docs/index.html` | GitHub Pages landing page - job listing UI |
| `docs/company.json` | Company data for GitHub Pages (regenerated on each scrape) |
| `docs/jobs.md` | Generated markdown with latest job listings |
| `docs/README.md` | Romanian-language documentation |

## Root-level Data Files

| File | Description |
|------|-------------|
| `delete_request.json` | **Manual maintenance tool** — SOLR payload to delete ALL jobs for CIF 39814543 |
| `company.json` | ANAF cache (regenerated on each scrape) |
