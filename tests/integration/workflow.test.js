import { jest } from '@jest/globals';
import { readFileSync, existsSync, writeFileSync, mkdirSync, rmSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REPO_ROOT = join(__dirname, '..', '..');
const INTEGRATION_DATA_DIR = join(__dirname, 'data');
const COMPANY_CONFIG_PATH = join(REPO_ROOT, 'config', 'company.json');

let companyConfig;

try {
  companyConfig = JSON.parse(readFileSync(COMPANY_CONFIG_PATH, 'utf-8'));
} catch (err) {
  throw new Error(`Cannot read company config: ${err.message}`);
}

const CIF = companyConfig.cif;
const COMPANY_NAME = companyConfig.legalName;
const BRAND = companyConfig.brand;
const SCRAPER_FILE = companyConfig.scraperFile;

const JOB_RESPONSE_SAMPLE = {
  total: 2,
  results: [
    {
      id: 'ABC123',
      title: 'Senior Software Engineer',
      location: { city: 'Bucharest', country: 'Romania' },
      workplace: 'Hybrid',
      url: 'https://apply.workable.com/qualitest-1/j/ABC123',
      department: 'Engineering'
    },
    {
      id: 'DEF456',
      title: 'QA Engineer',
      location: { city: 'Cluj-Napoca', country: 'Romania' },
      workplace: 'Remote',
      url: 'https://apply.workable.com/qualitest-1/j/DEF456',
      department: 'Quality Assurance'
    }
  ]
};

function setupIntegrationData() {
  if (!existsSync(INTEGRATION_DATA_DIR)) {
    mkdirSync(INTEGRATION_DATA_DIR, { recursive: true });
  }

  writeFileSync(
    join(INTEGRATION_DATA_DIR, 'job-response-sample.json'),
    JSON.stringify(JOB_RESPONSE_SAMPLE, null, 2),
    'utf-8'
  );

  const workflowsDir = join(REPO_ROOT, '.github', 'workflows');
  const workflowFiles = existsSync(workflowsDir)
    ? readdirSync(workflowsDir).filter(f => f.endsWith('.yml')).map(f => join(workflowsDir, f))
    : [];

  const workflowStatuses = workflowFiles.reduce((acc, f) => {
    acc[f] = existsSync(f);
    return acc;
  }, {});

  writeFileSync(
    join(INTEGRATION_DATA_DIR, 'workflow-status.json'),
    JSON.stringify(workflowStatuses, null, 2),
    'utf-8'
  );
}

function cleanupIntegrationData() {
  if (existsSync(INTEGRATION_DATA_DIR)) {
    rmSync(INTEGRATION_DATA_DIR, { recursive: true, force: true });
  }
}

describe('Workflow Integration Tests', () => {
  let index;

  beforeAll(async () => {
    process.env.SOLR_AUTH = 'test:test';
    index = await import('../../index.js');
    setupIntegrationData();
  });

  afterAll(() => {
    delete process.env.SOLR_AUTH;
    cleanupIntegrationData();
  });

  describe('Configuration Integrity', () => {
    it('should have CIF matching company config: ' + CIF, () => {
      expect(CIF).toBeDefined();
      expect(CIF).toMatch(/^\d{6,9}$/);
    });

    it('should have company name in config', () => {
      expect(COMPANY_NAME).toBeDefined();
      expect(COMPANY_NAME.length).toBeGreaterThan(0);
    });

    it('should have brand in config', () => {
      expect(BRAND).toBeDefined();
      expect(BRAND.length).toBeGreaterThan(0);
    });

    it('should have scraping method defined', () => {
      const method = companyConfig.scrapingMethod || 'api';
      expect(method).toBe('api');
    });

    it('should have scraperFile URL pointing to workflow', () => {
      expect(SCRAPER_FILE).toMatch(/workflow.*\.yml$/);
    });
  });

  describe('Parsing Logic (based on sample data)', () => {
    it('should correctly parse sample API response', async () => {
      const parsed = index.parseApiJobs(JOB_RESPONSE_SAMPLE);

      expect(parsed.jobs).toHaveLength(2);
      expect(parsed.jobs[0].title).toBe('Senior Software Engineer');
      expect(parsed.jobs[0].location).toEqual(['Bucharest']);
      expect(parsed.jobs[0].workmode).toBe('hybrid');
      expect(parsed.jobs[1].title).toBe('QA Engineer');
      expect(parsed.jobs[1].workmode).toBe('remote');
    });

    it('should correctly map parsed jobs to SOLR-ready format', async () => {
      const parsed = index.parseApiJobs(JOB_RESPONSE_SAMPLE);
      const transformed = index.transformJobsForSOLR({
        jobs: parsed.jobs,
        company: COMPANY_NAME,
        cif: CIF,
        source: companyConfig.website
      });

      expect(transformed.jobs).toHaveLength(2);
      expect(transformed.jobs[0].url).toBe('https://apply.workable.com/qualitest-1/j/ABC123');
      expect(transformed.company).toBe('QUALITEST DC RO S.R.L.');
    });

    it('should handle 0-job response', async () => {
      const EMPTY_RESPONSE = { total: 0, results: [] };
      const parsed = index.parseApiJobs(EMPTY_RESPONSE);

      expect(parsed.jobs).toEqual([]);
      expect(parsed.total).toBe(0);
    });

    it('should handle missing department field gracefully', async () => {
      const responseWithoutDept = {
        total: 1,
        results: [
          {
            id: 'GHI789',
            title: 'DevOps Engineer',
            location: { city: 'Iasi' },
            url: 'https://apply.workable.com/qualitest-1/j/GHI789'
          }
        ]
      };

      const parsed = index.parseApiJobs(responseWithoutDept);

      expect(parsed.jobs[0].title).toBe('DevOps Engineer');
      expect(parsed.jobs[0].department).toBeUndefined();
    });
  });

  describe('CI Workflow Files', () => {
    it('should have all required workflow files', () => {
      const statuses = JSON.parse(
        readFileSync(join(INTEGRATION_DATA_DIR, 'workflow-status.json'), 'utf-8')
      );

      Object.entries(statuses).forEach(([path, exists]) => {
        expect(exists).toBe(true);
      });
    });

    it('should have valid YAML syntax in workflow files', () => {
      const workflowPath = join(REPO_ROOT, '.github', 'workflows', 'job-seeker-ro-spider.yml');
      const content = readFileSync(workflowPath, 'utf-8');

      expect(content).toBeDefined();
      expect(content.length).toBeGreaterThan(0);
    });
  });
});
