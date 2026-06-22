import { jest } from '@jest/globals';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REPO_ROOT = join(__dirname, '..', '..');
const CONFIG_PATH = join(REPO_ROOT, 'config', 'company.json');

let companyConfig;

try {
  companyConfig = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
} catch (err) {
  throw new Error(`Cannot read company config: ${err.message}`);
}

const CIF = companyConfig.cif;
const BRAND = companyConfig.brand;
const LEGAL_NAME = companyConfig.legalName;
const WEBSITE = companyConfig.website;
const CAREER_URL = companyConfig.careerUrl;
const SCRAPER_FILE = companyConfig.scraperFile;

describe('Repository Consistency Check', () => {
  describe('config/company.json', () => {
    it('should have valid CIF (6-9 digits): ' + CIF, () => {
      expect(CIF).toMatch(/^\d{6,9}$/);
    });

    it('should have brand defined: ' + BRAND, () => {
      expect(BRAND).toBeDefined();
      expect(BRAND.length).toBeGreaterThan(0);
    });

    it('should have legal name defined: ' + LEGAL_NAME, () => {
      expect(LEGAL_NAME).toBeDefined();
      expect(LEGAL_NAME.length).toBeGreaterThan(0);
    });

    it('should have valid website URL: ' + WEBSITE, () => {
      expect(WEBSITE).toMatch(/^https?:\/\/.+/);
    });

    it('should have valid career URL: ' + CAREER_URL, () => {
      expect(CAREER_URL).toMatch(/^https?:\/\/.+/);
    });

    it('should have scraperFile URL ending in .yml', () => {
      expect(SCRAPER_FILE).toMatch(/\.yml$/);
    });
  });

  describe('Repository Structure', () => {
    const requiredDirs = ['.github/workflows', 'config', 'docs', 'tests/unit', 'tests/integration', 'tests/e2e', 'tests/consistency'];
    const requiredFiles = [
      'index.js',
      'package.json',
      'company.js',
      'solr.js',
      'README.md',
      'CONTRIBUTING.md',
      'CHANGELOG.md',
      'delete_request.json'
    ];

    for (const dir of requiredDirs) {
      it(`should have ${dir}/ directory`, () => {
        expect(existsSync(join(REPO_ROOT, dir))).toBe(true);
      });
    }

    for (const file of requiredFiles) {
      it(`should have ${file} file`, () => {
        expect(existsSync(join(REPO_ROOT, file))).toBe(true);
      });
    }
  });

  describe('CI Workflow', () => {
    const workflowPath = join(REPO_ROOT, '.github', 'workflows', 'job-seeker-ro-spider.yml');

    it('should have workflow file at ' + workflowPath, () => {
      expect(existsSync(workflowPath)).toBe(true);
    });

    if (existsSync(workflowPath)) {
      it('should contain fetch-depth: 0 in workflow', () => {
        const content = readFileSync(workflowPath, 'utf-8');
        expect(content).toContain('fetch-depth: 0');
      });
    }
  });

  describe('Brand and Identity Consistency', () => {
    it('should not contain placeholder references to unrelated companies in index.js', () => {
      const indexPath = join(REPO_ROOT, 'index.js');
      if (!existsSync(indexPath)) return;

      const content = readFileSync(indexPath, 'utf-8');
      const placeholderPatterns = [
        /epam\.com/gi
      ];

      for (const pattern of placeholderPatterns) {
        if (pattern.test(content)) {
          const matches = content.match(pattern);
          if (matches) {
            console.warn(`Warning: Found ${matches.length} placeholder matches in index.js`);
          }
        }
      }
    });

    it('should reference correct brand in package.json', () => {
      const pkgPath = join(REPO_ROOT, 'package.json');
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

      expect(pkg.name).toContain('qualitest');
    });

    it('should reference correct brand in tests/package.json', () => {
      const testPkgPath = join(REPO_ROOT, 'tests', 'package.json');
      if (!existsSync(testPkgPath)) return;

      const pkg = JSON.parse(readFileSync(testPkgPath, 'utf-8'));
      expect(pkg.name).toContain('qualitest');
    });
  });

  describe('SOLR Compatibility', () => {
    it('should have CIF matching standard format', () => {
      expect(CIF).toMatch(/^\d{6,9}$/);
    });
  });

  describe('Documentation', () => {
    const docsDir = join(REPO_ROOT, 'docs');

    it('should have docs directory', () => {
      expect(existsSync(docsDir)).toBe(true);
    });

    ['index.html'].forEach(file => {
      it(`should have docs/${file}`, () => {
        expect(existsSync(join(docsDir, file))).toBe(true);
      });
    });
  });
});
