import { jest } from '@jest/globals';
import { readFileSync, existsSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROJECT_ROOT = join(__dirname, '..');

jest.setTimeout(60000);

let companyConfig;

try {
  const configPath = join(PROJECT_ROOT, 'config', 'company.json');
  companyConfig = JSON.parse(readFileSync(configPath, 'utf-8'));
} catch (err) {
  throw new Error(`Cannot read company config: ${err.message}`);
}

const CIF = companyConfig.cif;
const COMPANY_NAME = companyConfig.legalName;
const BRAND = companyConfig.brand;
const CAREER_URL = companyConfig.careerUrl;

function isWorkableUrl(url) {
  return url.includes('apply.workable.com');
}

describe('E2E: Scraper Execution Flow', () => {
  let index;

  beforeAll(async () => {
    process.env.SOLR_AUTH = 'test:test';
    index = await import(`${PROJECT_ROOT}/index.js`);
  });

  afterAll(() => {
    delete process.env.SOLR_AUTH;
  });

  describe('Career URL Accessibility', () => {
    it('should have a valid career URL: ' + CAREER_URL, () => {
      expect(CAREER_URL).toBeDefined();
      expect(CAREER_URL).toMatch(/^https?:\/\//);
    });

    it('should be a Workable URL', () => {
      expect(isWorkableUrl(CAREER_URL)).toBe(true);
    });
  });

  describe('Job Fetching and Parsing', () => {
    it('should fetch and parse jobs from Workable API without throwing', async () => {
      // This test verifies the fetch-and-parse pipeline completes
      // without errors, even if no jobs are currently posted.
      let result;

      try {
        result = await index.fetchAndParseJobs(index.fetchWorkableJobs);
      } catch (err) {
        // If the API is unavailable, mark as skipped rather than failed
        if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED' || err.type === 'system') {
          console.log('Workable API unavailable (network issue) — skipping');
          return;
        }
        throw err;
      }

      expect(result).toBeDefined();
      expect(result).toHaveProperty('jobs');
      expect(Array.isArray(result.jobs)).toBe(true);
    }, 30000);
  });

  describe('Data Format Validation', () => {
    it('should generate SOLR-ready job objects', () => {
      const testJob = {
        url: 'https://apply.workable.com/qualitest-1/j/TEST123',
        title: 'Test E2E Job',
        location: ['Bucharest'],
        workmode: 'hybrid'
      };

      const result = index.mapToJobModel(testJob, CIF, COMPANY_NAME);

      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('company', COMPANY_NAME);
      expect(result).toHaveProperty('cif', CIF);
      expect(result).toHaveProperty('status', 'scraped');
    });

    it('should transform jobs for SOLR submission', () => {
      const payload = {
        jobs: [
          {
            url: 'https://apply.workable.com/qualitest-1/j/TEST1',
            title: 'Job A',
            location: ['Bucharest'],
            workmode: 'remote'
          }
        ],
        company: COMPANY_NAME,
        cif: CIF,
        source: companyConfig.website
      };

      const result = index.transformJobsForSOLR(payload);

      expect(result).toHaveProperty('jobs');
      expect(result.jobs[0].workmode).toBe('remote');
      expect(result.company).toBe('QUALITEST DC RO S.R.L.');
    });
  });

  describe('End-to-End Pipeline', () => {
    it('should complete the full fetch → parse → transform pipeline', async () => {
      let result;

      try {
        result = await index.fetchAndParseJobs(index.fetchWorkableJobs);
      } catch (err) {
        if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED' || err.type === 'system') {
          console.log('Workable API unavailable — skipping full pipeline test');
          return;
        }
        throw err;
      }

      if (result && result.jobs && result.jobs.length > 0) {
        const payload = {
          jobs: result.jobs,
          company: COMPANY_NAME,
          cif: CIF,
          source: companyConfig.website
        };

        const transformed = index.transformJobsForSOLR(payload);

        expect(transformed.jobs.length).toBeGreaterThan(0);
        expect(transformed.jobs[0]).toHaveProperty('company');
        expect(transformed.company).toBe('QUALITEST DC RO S.R.L.');
      }
    }, 30000);
  });
});
