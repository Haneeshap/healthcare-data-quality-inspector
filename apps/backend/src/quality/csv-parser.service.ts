import { parse } from 'csv-parse/sync';
import type { CsvRecord } from '../quality/quality.service.js';

export function parseCsv(csvContent: string): CsvRecord[] {
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
    relax_column_count: false,
  }) as CsvRecord[];

  return records;
}
