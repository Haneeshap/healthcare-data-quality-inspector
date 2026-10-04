import type { CsvRecord } from './quality.service.js';

export type InferredDataType =
  | 'INTEGER'
  | 'DECIMAL'
  | 'DATE'
  | 'BOOLEAN'
  | 'TEXT';

export type ColumnProfile = {
  column: string;
  inferredType: InferredDataType;
  totalValues: number;
  nonEmptyValues: number;
  missingValues: number;
  completeness: number;
  uniqueValues: number;
  sampleValues: string[];
};

function inferValueType(value: string): InferredDataType {
  if (/^-?\d+$/.test(value)) {
    return 'INTEGER';
  }

  if (/^-?(?:\d+\.\d+|\d+\.\d*|\.\d+)$/.test(value)) {
    return 'DECIMAL';
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = new Date(`${value}T00:00:00.000Z`);

    if (
      !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    ) {
      return 'DATE';
    }
  }

  if (/^(true|false)$/i.test(value)) {
    return 'BOOLEAN';
  }

  return 'TEXT';
}

function inferColumnType(values: string[]): InferredDataType {
  const nonEmptyValues = values.filter((value) => value !== '');

  if (nonEmptyValues.length === 0) {
    return 'TEXT';
  }

  const detectedTypes = nonEmptyValues.map(inferValueType);

  const numericValues = detectedTypes.filter(
    (type) => type === 'INTEGER' || type === 'DECIMAL',
  ).length;

  if (numericValues / detectedTypes.length >= 0.75) {
    return detectedTypes.includes('DECIMAL') ? 'DECIMAL' : 'INTEGER';
  }

  const candidateTypes: InferredDataType[] = [
    'DATE',
    'BOOLEAN',
    'INTEGER',
    'DECIMAL',
    'TEXT',
  ];

  let dominantType: InferredDataType = 'TEXT';
  let dominantCount = 0;

  for (const type of candidateTypes) {
    const count = detectedTypes.filter(
      (detectedType) => detectedType === type,
    ).length;

    if (count > dominantCount) {
      dominantType = type;
      dominantCount = count;
    }
  }

  return dominantCount / detectedTypes.length >= 0.75
    ? dominantType
    : 'TEXT';
}

export function profileRecords(records: CsvRecord[]): ColumnProfile[] {
  if (records.length === 0) {
    return [];
  }

  const columns = Object.keys(records[0]);

  return columns.map((column) => {
    const values = records.map((record) =>
      String(record[column] ?? '').trim(),
    );

    const nonEmptyValues = values.filter((value) => value !== '');
    const missingValues = values.length - nonEmptyValues.length;

    const uniqueValues = new Set(nonEmptyValues).size;

    const sampleValues = [...new Set(nonEmptyValues)].slice(0, 3);

    return {
      column,
      inferredType: inferColumnType(values),
      totalValues: values.length,
      nonEmptyValues: nonEmptyValues.length,
      missingValues,
      completeness: Math.round(
        (nonEmptyValues.length / values.length) * 100,
      ),
      uniqueValues,
      sampleValues,
    };
  });
}
