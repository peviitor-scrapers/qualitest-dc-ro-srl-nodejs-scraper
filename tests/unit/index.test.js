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
        source: 'apply.workable.com',
        company: 'qualitest dc ro srl',
        cif: '39814543',
        jobs: [
          { url: 'https://test.com/1', title: 'Job 1', company: 'qualitest dc ro', cif: '39814543' }
        ]
      };

      const result = index.transformJobsForSOLR(payload);

      expect(result.company).toBe('QUALITEST DC RO SRL');
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
        url: 'https://apply.workable.com/job/123',
        title: 'Senior Developer',
        location: ['Bucharest'],
        tags: ['Java', 'Spring'],
        workmode: 'hybrid'
      };

      const COMPANY_NAME = 'QUALITEST DC RO S.R.L.';
      const COMPANY_CIF = '39814543';

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

      const result = index.mapToJobModel(rawJob, '39814543');

      expect(result.location).toBeUndefined();
      expect(result.tags).toBeUndefined();
      expect(result.workmode).toBeUndefined();
    });

    it('should handle missing title', () => {
      const rawJob = { url: 'https://test.com/1' };

      const result = index.mapToJobModel(rawJob, '39814543');

      expect(result.title).toBeUndefined();
      expect(result.url).toBe('https://test.com/1');
    });
  });

  describe('parseApiJobs', () => {
    const sampleApiData = {
      results: [
        {
          id: "123",
          title: "Senior Developer",
          url: "https://apply.workable.com/qualitest-1/j/123",
          workplace: "Remote",
          location: { city: "Bucharest", country: "Romania" }
        },
        {
          id: "456",
          title: "Backend Engineer",
          url: "https://apply.workable.com/qualitest-1/j/456",
          workplace: "On-site",
          location: { city: "Cluj-Napoca", country: "Romania" }
        }
      ],
      total: 17
    };

    it('should parse Workable API results', () => {
      const result = index.parseApiJobs(sampleApiData);

      expect(result.total).toBe(17);
      expect(result.jobs).toHaveLength(2);

      const first = result.jobs[0];
      expect(first.title).toBe('Senior Developer');
      expect(first.url).toMatch(/^https:\/\/apply\.workable\.com\//);
      expect(first.location).toEqual(['Bucharest']);
      expect(first.workmode).toBe('remote');

      const second = result.jobs[1];
      expect(second.title).toBe('Backend Engineer');
      expect(second.location).toEqual(['Cluj-Napoca']);
      expect(second.workmode).toBe('on-site');
    });

    it('should handle empty results', () => {
      const result = index.parseApiJobs({ results: [], total: 0 });

      expect(result.jobs).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle missing data', () => {
      const result = index.parseApiJobs({});

      expect(result.jobs).toEqual([]);
    });

    it('should fall back to constructed URL when url is missing', () => {
      const data = { results: [{ id: "999", title: "QA Engineer", workplace: "Hybrid" }], total: 1 };
      const result = index.parseApiJobs(data);

      expect(result.jobs[0].url).toBe('https://apply.workable.com/qualitest-1/j/999');
      expect(result.jobs[0].location).toEqual([]);
      expect(result.jobs[0].workmode).toBe('hybrid');
    });
  });
});
