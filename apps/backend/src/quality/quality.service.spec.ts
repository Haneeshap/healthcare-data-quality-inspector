
import { describe, expect, it } from 'vitest';
import {
  analyzeRecords,
  calculateQualityScore,
} from './quality.service.js';

const validRecord: CsvRecord = {
  patient_id: 'P001',
  appointment_id: 'A001',
  appointment_date: '2026-10-03',
  patient_email: 'patient@example.com',
  appointment_status: 'scheduled',
};

describe('analyzeRecords', () => {
  it('should return no issues for a valid record', () => {
    expect(analyzeRecords([validRecord])).toEqual([]);
  });

  it('should detect missing required fields', () => {
    const record = {
      ...validRecord,
      patient_id: '',
    };

    const issues = analyzeRecords([record]);

    expect(issues.some(
      (issue) =>
        issue.field === 'patient_id' &&
        issue.issueType === 'MISSING_VALUE',
    )).toBe(true);
  });

  it('should detect missing required columns only once per column', () => {
    const records: CsvRecord[] = [
      {
        patient_name: 'John Doe',
        patient_email: 'john@example.com',
      },
      {
        patient_name: 'Jane Doe',
        patient_email: 'jane@example.com',
      },
    ];

    const issues = analyzeRecords(records);

    const missingColumns = issues.filter(
      (issue) => issue.issueType === 'MISSING_COLUMN',
    );

    expect(missingColumns).toHaveLength(4);
    expect(missingColumns.every((issue) => issue.rowNumber === null)).toBe(true);
  });

  it('should not report missing columns when all required headers exist', () => {
    const issues = analyzeRecords([validRecord]);

    expect(
      issues.some((issue) => issue.issueType === 'MISSING_COLUMN'),
    ).toBe(false);
  });

  it('should detect an invalid email', () => {
    const record = {
      ...validRecord,
      patient_email: 'not-an-email',
    };

    const issues = analyzeRecords([record]);

    expect(issues.some(
      (issue) => issue.issueType === 'INVALID_EMAIL',
    )).toBe(true);
  });

  it('should detect an invalid calendar date', () => {
    const record = {
      ...validRecord,
      appointment_date: '2026-02-30',
    };

    const issues = analyzeRecords([record]);

    expect(issues.some(
      (issue) => issue.issueType === 'INVALID_DATE',
    )).toBe(true);
  });

  it('should detect an unrecognised appointment status', () => {
    const record = {
      ...validRecord,
      appointment_status: 'unknown',
    };

    const issues = analyzeRecords([record]);

    expect(issues.some(
      (issue) => issue.issueType === 'INVALID_STATUS',
    )).toBe(true);
  });

  it('should detect duplicate appointment IDs', () => {
    const secondRecord = {
      ...validRecord,
      patient_id: 'P002',
    };

    const issues = analyzeRecords([validRecord, secondRecord]);

    expect(issues.some(
      (issue) => issue.issueType === 'DUPLICATE_RECORD',
    )).toBe(true);
  });
});

describe('calculateQualityScore', () => {
  it('should return 100 when there are no errors', () => {
    expect(calculateQualityScore(8, [])).toBe(100);
  });

  it('should count each affected record only once', () => {
    const issues = [
      { rowNumber: 2, issueType: 'MISSING_VALUE', severity: 'ERROR' as const },
      { rowNumber: 2, issueType: 'INVALID_EMAIL', severity: 'ERROR' as const },
      { rowNumber: 5, issueType: 'INVALID_DATE', severity: 'ERROR' as const },
    ];

    expect(calculateQualityScore(8, issues)).toBe(75);
  });

  it('should ignore warnings when calculating the score', () => {
    const issues = [
      { rowNumber: 3, issueType: 'DUPLICATE_RECORD', severity: 'WARNING' as const },
    ];

    expect(calculateQualityScore(8, issues)).toBe(100);
  });

  it('should return 0 when a required column is missing or the dataset is empty', () => {
    const issues = [
      { rowNumber: null, issueType: 'MISSING_COLUMN', severity: 'ERROR' as const },
    ];

    expect(calculateQualityScore(8, issues)).toBe(0);
    expect(calculateQualityScore(0, [])).toBe(0);
  });
});