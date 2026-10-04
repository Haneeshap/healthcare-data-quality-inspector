import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { parseCsv } from './csv-parser.service.js';
import {
  analyzeRecords,
  calculateQualityScore,
} from './quality.service.js';
import { profileRecords } from './profiling.service.js';

@Injectable()
export class DatasetService {
  constructor(private readonly prisma: PrismaService) {}

  async createFromCsv(filename: string, csvContent: string) {
    if (!csvContent.trim()) {
      throw new BadRequestException('The uploaded CSV file is empty.');
    }

    let records;

    try {
      records = parseCsv(csvContent);
    } catch {
      throw new BadRequestException(
        'Unable to parse the CSV file. Check its formatting and column structure.',
      );
    }

    if (records.length === 0) {
      throw new BadRequestException(
        'The CSV file does not contain any data rows.',
      );
    }

    const issues = analyzeRecords(records);

    return this.prisma.$transaction(async (transaction) => {
      const dataset = await transaction.dataset.create({
        data: {
          filename,
          totalRows: records.length,
        },
      });

      const recordIds: number[] = [];

      for (const record of records) {
        const savedRecord = await transaction.dataRecord.create({
          data: {
            datasetId: dataset.id,
            recordIdentifier: record.appointment_id || null,
            recordData: JSON.stringify(record),
          },
        });

        recordIds.push(savedRecord.id);
      }

      for (const issue of issues) {
        const recordId =
  issue.rowNumber === null
    ? null
    : recordIds[issue.rowNumber - 2] ?? null;

        await transaction.dataIssue.create({
          data: {
            datasetId: dataset.id,
            recordId,
            rowNumber: issue.rowNumber,
            field: issue.field,
            issueType: issue.issueType,
            severity: issue.severity,
            description: issue.description,
            suggestedCorrection: issue.suggestedCorrection,
          },
        });
      }

      return {
        datasetId: dataset.id,
        filename: dataset.filename,
        totalRows: dataset.totalRows,
        totalIssues: issues.length,
        errors: issues.filter((issue) => issue.severity === 'ERROR').length,
        warnings: issues.filter((issue) => issue.severity === 'WARNING').length,
      };
    });
  }
  async findAll() {
  const datasets = await this.prisma.dataset.findMany({
    orderBy: {
      uploadedAt: 'desc',
    },
    include: {
      _count: {
        select: {
          records: true,
          issues: true,
        },
      },
      issues: {
        select: {
          rowNumber: true,
          issueType: true,
          severity: true,
        },
      },
    },
  });

      return datasets.map((dataset) => ({
      id: dataset.id,
      filename: dataset.filename,
      uploadedAt: dataset.uploadedAt,
      totalRows: dataset.totalRows,
      _count: dataset._count,
      qualityScore: calculateQualityScore(dataset.totalRows, dataset.issues),
    }));
  }

  async findOne(id: number) {
  const dataset = await this.prisma.dataset.findUnique({
    where: { id },
    include: {
      records: true,
      issues: {
        orderBy: {
          rowNumber: 'asc',
        },
      },
    },
  });

  if (!dataset) {
    throw new NotFoundException(`Dataset ${id} was not found.`);
  }

    const parsedRecords = dataset.records.map((record) => {
      try {
        return JSON.parse(record.recordData) as Record<string, string>;
      } catch {
        return {};
      }
    });

    return {
      ...dataset,
      qualityScore: calculateQualityScore(dataset.totalRows, dataset.issues),
      columnProfiles: profileRecords(parsedRecords),
    };
  }

  async updateIssueStatus(
    datasetId: number,
    issueId: number,
    status: string,
  ) {
    const allowedStatuses = ['OPEN', 'RESOLVED', 'IGNORED'];

    if (!allowedStatuses.includes(status)) {
      throw new BadRequestException(
        'Status must be OPEN, RESOLVED, or IGNORED.',
      );
    }

    const issue = await this.prisma.dataIssue.findFirst({
      where: {
        id: issueId,
        datasetId,
      },
    });

    if (!issue) {
      throw new NotFoundException(
        `Issue ${issueId} was not found in dataset ${datasetId}.`,
      );
    }

    return this.prisma.dataIssue.update({
      where: {
        id: issueId,
      },
      data: {
        status,
      },
    });
  }
}
