import { describe, expect, it } from 'vitest';
import { profileRecords } from './profiling.service.js';

describe('profileRecords', () => {
  it('profiles completeness, uniqueness, types, and sample values', () => {
    const records = [
      {
        patient_id: '101',
        appointment_date: '2026-10-01',
        active: 'true',
        score: '98.5',
        city: 'Bengaluru',
      },
      {
        patient_id: '102',
        appointment_date: '2026-10-02',
        active: 'false',
        score: '100',
        city: 'Bengaluru',
      },
      {
        patient_id: '',
        appointment_date: '2026-10-03',
        active: 'true',
        score: '87.25',
        city: 'Mysuru',
      },
    ];

    const profiles = profileRecords(records);

    expect(profiles).toHaveLength(5);

    expect(profiles.find((profile) => profile.column === 'patient_id')).toEqual({
      column: 'patient_id',
      inferredType: 'INTEGER',
      totalValues: 3,
      nonEmptyValues: 2,
      missingValues: 1,
      completeness: 67,
      uniqueValues: 2,
      sampleValues: ['101', '102'],
    });

    expect(
      profiles.find((profile) => profile.column === 'appointment_date')
        ?.inferredType,
    ).toBe('DATE');

    expect(
      profiles.find((profile) => profile.column === 'active')?.inferredType,
    ).toBe('BOOLEAN');

    expect(
      profiles.find((profile) => profile.column === 'score')?.inferredType,
    ).toBe('DECIMAL');

    expect(
      profiles.find((profile) => profile.column === 'city')?.uniqueValues,
    ).toBe(2);
  });

  it('treats an invalid calendar date as text', () => {
    const profiles = profileRecords([
      { appointment_date: '2026-02-30' },
    ]);

    expect(profiles[0].inferredType).toBe('TEXT');
  });

  it('returns an empty profile for an empty dataset', () => {
    expect(profileRecords([])).toEqual([]);
  });
});
