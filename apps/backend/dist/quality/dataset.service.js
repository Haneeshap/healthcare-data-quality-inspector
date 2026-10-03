var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { BadRequestException, Injectable, NotFoundException, } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { parseCsv } from './csv-parser.service.js';
import { analyzeRecords } from './quality.service.js';
let DatasetService = class DatasetService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createFromCsv(filename, csvContent) {
        if (!csvContent.trim()) {
            throw new BadRequestException('The uploaded CSV file is empty.');
        }
        let records;
        try {
            records = parseCsv(csvContent);
        }
        catch {
            throw new BadRequestException('Unable to parse the CSV file. Check its formatting and column structure.');
        }
        if (records.length === 0) {
            throw new BadRequestException('The CSV file does not contain any data rows.');
        }
        const issues = analyzeRecords(records);
        return this.prisma.$transaction(async (transaction) => {
            const dataset = await transaction.dataset.create({
                data: {
                    filename,
                    totalRows: records.length,
                },
            });
            const recordIds = [];
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
                const recordIndex = issue.rowNumber - 2;
                const recordId = recordIds[recordIndex] ?? null;
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
        return this.prisma.dataset.findMany({
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
            },
        });
    }
    async findOne(id) {
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
        return dataset;
    }
};
DatasetService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], DatasetService);
export { DatasetService };
//# sourceMappingURL=dataset.service.js.map