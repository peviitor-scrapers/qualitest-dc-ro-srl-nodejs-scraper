import { jest } from '@jest/globals';

describe('index.js Component Tests', () => {
  let index;

  beforeAll(async () => {
    index = await import('../../scraper/index.js');
  });

  const sampleHtml = `
<html>
<body>
  <div class="career-list-wrap">17 Result(s)</div>
  <div class="attrax-vacancy-tile">
    <div class="attrax-vacancy-tile__title">Senior Developer</div>
    <a href="/en/job/123/senior-developer">View job</a>
    <div class="attrax-vacancy-tile__item">
      <div class="attrax-vacancy-tile__item-label">Location</div>
      <div class="attrax-vacancy-tile__item-value">Bucharest</div>
    </div>
    <div class="attrax-vacancy-tile__item">
      <div class="attrax-vacancy-tile__item-label">Work model</div>
      <div class="attrax-vacancy-tile__item-value">Remote</div>
    </div>
  </div>
  <div class="attrax-vacancy-tile">
    <div class="attrax-vacancy-tile__title">Backend Engineer</div>
    <a href="/en/job/456/backend-engineer">View job</a>
    <div class="attrax-vacancy-tile__item">
      <div class="attrax-vacancy-tile__item-label">Location</div>
      <div class="attrax-vacancy-tile__item-value">Cluj-Napoca</div>
    </div>
    <div class="attrax-vacancy-tile__item">
      <div class="attrax-vacancy-tile__item-label">Work model</div>
      <div class="attrax-vacancy-tile__item-value">Hybrid</div>
    </div>
  </div>
</body>
</html>
`;

  describe('transformJobsForSOLR', () => {
    it('should filter locations to only Romanian cities', () => {
      const payload = {
        jobs: [
          { url: 'https://test.com/1', title: 'Job 1', location: ['România'] },
          { url: 'https://test.com/2', title: 'Job 2', location: ['Bucharest'] },
          { url: 'https://test.com/3', title: 'Job 3', location: ['Bulgaria'] },
          { url: 'https://test.com/4', title: 'Job 4', location: ['Cluj-Napoca'] },
          { url: 'https://test.com/5', title: 'Job 5', location: [] }
        ]
      };

      const result = index.transformJobsForSOLR(payload);

      expect(result.jobs[0].location).toEqual(['România']);
      expect(result.jobs[1].location).toEqual(['Bucharest']);
      expect(result.jobs[2].location).toEqual(['România']);
      expect(result.jobs[3].location).toEqual(['Cluj-Napoca']);
      expect(result.jobs[4].location).toEqual(['România']);
    });

    it('should keep company uppercase', () => {
      const payload = {
        source: 'careers.quality-ai.com',
        company: 'qualitest srl',
        cif: '50823992',
        jobs: [
          { url: 'https://test.com/1', title: 'Job 1', company: 'qualitest srl', cif: '50823992' }
        ]
      };

      const result = index.transformJobsForSOLR(payload);

      expect(result.company).toBe('QUALITEST SRL');
    });

    it('should normalize workmode values', () => {
      const payload = {
        jobs: [
          { url: 'https://test.com/1', title: 'Job 1', workmode: 'Remote' },
          { url: 'https://test.com/2', title: 'Job 2', workmode: 'ON-SITE' },
          { url: 'https://test.com/3', title: 'Job 3', workmode: 'Hybrid' },
          { url: 'https://test.com/4', title: 'Job 4', workmode: 'hybrid' }
        ]
      };

      const result = index.transformJobsForSOLR(payload);

      expect(result.jobs[0].workmode).toBe('remote');
      expect(result.jobs[1].workmode).toBe('on-site');
      expect(result.jobs[2].workmode).toBe('hybrid');
      expect(result.jobs[3].workmode).toBe('hybrid');
    });

    it('should handle empty jobs array', () => {
      const result = index.transformJobsForSOLR({ jobs: [] });
      expect(result.jobs).toEqual([]);
    });
  });

  describe('mapToJobModel', () => {
    it('should map raw job to job model format', () => {
      const rawJob = {
        url: 'https://careers.quality-ai.com/job/123',
        title: 'Senior Developer',
        location: ['Bucharest'],
        tags: ['Java', 'Spring'],
        workmode: 'hybrid'
      };

      const COMPANY_NAME = 'QUALITEST S.R.L.';
      const COMPANY_CIF = '50823992';

      const result = index.mapToJobModel(rawJob, COMPANY_CIF, COMPANY_NAME);

      expect(result.url).toBe(rawJob.url);
      expect(result.title).toBe(rawJob.title);
      expect(result.company).toBe(COMPANY_NAME);
      expect(result.cif).toBe(COMPANY_CIF);
      expect(result.location).toEqual(rawJob.location);
      expect(result.tags).toEqual(rawJob.tags);
      expect(result.workmode).toBe(rawJob.workmode);
      expect(result.status).toBe('scraped');
      expect(result.date).toBeDefined();
    });

    it('should remove undefined fields', () => {
      const rawJob = {
        url: 'https://test.com/1',
        title: 'Job 1'
      };

      const result = index.mapToJobModel(rawJob, '50823992');

      expect(result.location).toBeUndefined();
      expect(result.tags).toBeUndefined();
      expect(result.workmode).toBeUndefined();
    });

    it('should handle missing title', () => {
      const rawJob = { url: 'https://test.com/1' };

      const result = index.mapToJobModel(rawJob, '50823992');

      expect(result.title).toBeUndefined();
      expect(result.url).toBe('https://test.com/1');
    });
  });

  describe('parsePageJobs', () => {
    const sampleHtml = `
<table>
  <tr class="data-row">
    <td class="colTitle" headers="hdrTitle">
      <span class="jobTitle hidden-phone">
        <a href="/job/Bucharest-Senior-Embedded-Engineer/57481544/" class="jobTitle-link">Senior Embedded Engineer</a>
      </span>
      <span class="jobLocation">Bucharest, RO</span>
    </td>
  </tr>
  <tr class="data-row">
    <td class="colTitle" headers="hdrTitle">
      <span class="jobTitle hidden-phone">
        <a href="/job/Bucharest-Senior-C-Developer-%28Hybrid%29/56575644/" class="jobTitle-link">Senior C# Developer (Hybrid)</a>
      </span>
      <span class="jobLocation">Bucharest, RO</span>
    </td>
  </tr>
</table>
<div class="pagination-label-row">
  <span class="paginationLabel" aria-label="Results 1 - 25">Results <b>1 - 25</b> of <b>25</b></span>
</div>`;

    it('should parse QualityAI search HTML results', () => {
      const result = index.parsePageJobs(sampleHtml);

      expect(result.total).toBe(25);
      expect(result.jobs).toHaveLength(2);

      const first = result.jobs[0];
      expect(first.title).toBe('Senior Embedded Engineer');
      expect(first.url).toBe('https://careers.quality-ai.com/job/Bucharest-Senior-Embedded-Engineer/57481544/');
      expect(first.location).toEqual(['București']);
      expect(first.workmode).toBe('on-site');
      expect(first.uid).toBe('57481544');

      const second = result.jobs[1];
      expect(second.title).toBe('Senior C# Developer (Hybrid)');
      expect(second.workmode).toBe('hybrid');
    });

    it('should handle empty results', () => {
      const result = index.parsePageJobs('<table></table>');

      expect(result.jobs).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle missing data', () => {
      const result = index.parsePageJobs('');

      expect(result.jobs).toEqual([]);
    });

    it('should detect remote jobs from slug', () => {
      const html = `
<table>
  <tr class="data-row">
    <td class="colTitle" headers="hdrTitle">
      <span class="jobTitle hidden-phone">
        <a href="/job/Bucharest-Devops-Engineer-Remote/99999944/" class="jobTitle-link">DevOps Engineer</a>
      </span>
      <span class="jobLocation">Bucharest, RO</span>
    </td>
  </tr>
</table>`;
      const result = index.parsePageJobs(html);

      expect(result.jobs[0].workmode).toBe('remote');
      expect(result.jobs[0].uid).toBe('99999944');
    });
  });
});
