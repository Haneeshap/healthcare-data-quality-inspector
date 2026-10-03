import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseCsv } from './csv-parser.service.js';
import { analyzeRecords } from './quality.service.js';

describe('CSV quality analysis integration', () => {
  it('should parse and detect all expected issues in the sample dataset', () => {
    const csvPath = resolve(
      process.cwd(),
      '../../sample-data/appointments.csv',
    );

    const csvContent = readFileSync(csvPath, 'utf8');
    const records = parseCsv(csvContent);
    const issues = analyzeRecords(records);

    expect(records).toHaveLength(8);

    expect(issues.map((issue) => issue.issueType)).toEqual(
      expect.arrayContaining([
        'INVALID_EMAIL',
        'INVALID_DATE',
        'INVALID_STATUS',
        'MISSING_VALUE',
        'DUPLICATE_RECORD',
      ]),
    );

    expect(issues).toHaveLength(5);
  });
});
