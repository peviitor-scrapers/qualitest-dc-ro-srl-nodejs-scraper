# 🤖 Qualitest DC RO S.R.L. — Node.js Job Scraper

[![Generated from: EPAM](https://img.shields.io/badge/Generated%20from-EPAM%20Template-blue)](https://github.com/sebiboga/epam-systems-international-srl-nodejs-scraper)
[![GitHub repo](https://img.shields.io/badge/GitHub-sebiboga%2Fqualitest--dc--ro--srl--nodejs--scraper-green)](https://github.com/sebiboga/qualitest-dc-ro-srl-nodejs-scraper)
[![CI](https://github.com/sebiboga/qualitest-dc-ro-srl-nodejs-scraper/actions/workflows/job-seeker-ro-spider.yml/badge.svg)](https://github.com/sebiboga/qualitest-dc-ro-srl-nodejs-scraper/actions/workflows/job-seeker-ro-spider.yml)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-%E2%9C%93-brightgreen)](https://sebiboga.github.io/qualitest-dc-ro-srl-nodejs-scraper/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Scraper automat pentru locurile de muncă **Qualitest DC RO S.R.L.** (CIF: 39814543) — extrage de pe [Workable](https://apply.workable.com/qualitest-1/) și publică pe [peviitor.ro](https://peviitor.ro).

## Company Information

- **Legal Name:** QUALITEST DC RO S.R.L.
- **Brand:** Qualitest
- **CIF:** 39814543
- **Website:** https://www.qualitestgroup.com
- **Career URL:** https://apply.workable.com/qualitest-1/
- **Scraping Method:** Workable API

## How It Works

1. **Workable API Polling**: Sends POST requests to `https://apply.workable.com/api/v3/accounts/qualitest-1/jobs`
2. **ANOFM Fallback**: Also scrapes ANOFM API by CIF for completeness
3. **SOLR Upsert**: Publishes jobs to the peviitor.ro SOLR index
4. **Scheduled**: Runs via GitHub Actions (configurable cron)

## Project Structure

```
config/
  company.json         ← Single source of truth for company identity
.github/workflows/    ← CI/CD pipeline definitions
docs/                 ← GitHub Pages site (scraped jobs display)
tests/                ← Unit, integration, e2e, and consistency tests
index.js              ← Main scraper entry point
company.js            ← Company data retrieval / ANAF validation
solr.js               ← SOLR index operations
```

## Related Repositories

- [EPAM Template](https://github.com/sebiboga/epam-systems-international-srl-nodejs-scraper) — The template this repo was derived from
- [AI-Factory / Job Seeker RO Spider](https://github.com/sebiboga/AI-Factory-job-seeker-ro-spider) — Orchestrator for all derived scrapers
- [peviitor.ro](https://peviitor.ro) — The Romanian job aggregator

## License

MIT
