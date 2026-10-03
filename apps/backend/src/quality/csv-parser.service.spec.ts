import { describe, expect, it } from 'vitest';
import { parseCsv } from './csv-parser.service.js';

describe('parseCsv', () => {
  it('should convert CSV text into records using the header row', () => {
    const csv = [
      'patient_id,appointment_id,appointment_status',
      'P001,A001,scheduled',
      'P002,A002,completed',
    ].join('\n');

    expect(parseCsv(csv)).toEqual([
      {
        patient_id: 'P001',
        appointment_id: 'A001',
        appointment_status: 'scheduled',
      },
      {
        patient_id: 'P002',
        appointment_id: 'A002',
        appointment_status: 'completed',
      },
    ]);
  });

  it('should handle quoted values containing commas', () => {
    const csv = [
      'patient_id,patient_name',
      'P001,"Smith, Ava"',
    ].join('\n');

    expect(parseCsv(csv)).toEqual([
      {
        patient_id: 'P001',
        patient_name: 'Smith, Ava',
      },
    ]);
  });

  it('should return an empty array when there are no data rows', () => {
    expect(parseCsv('patient_id,appointment_id')).toEqual([]);
  });

  it('should reject rows with inconsistent column counts', () => {
    const csv = [
      'patient_id,appointment_id',
      'P001,A001,unexpected',
    ].join('\n');

    expect(() => parseCsv(csv)).toThrow();
  });
});
