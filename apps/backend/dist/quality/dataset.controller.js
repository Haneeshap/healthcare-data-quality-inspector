var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { BadRequestException, Controller, Get, Param, ParseIntPipe, Post, UploadedFile, UseInterceptors, } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DatasetService } from './dataset.service.js';
let DatasetController = class DatasetController {
    datasetService;
    constructor(datasetService) {
        this.datasetService = datasetService;
    }
    async uploadDataset(file) {
        if (!file) {
            throw new BadRequestException('Please upload a CSV file.');
        }
        if (!file.originalname.toLowerCase().endsWith('.csv')) {
            throw new BadRequestException('Only CSV files are supported.');
        }
        const csvContent = file.buffer.toString('utf8');
        return this.datasetService.createFromCsv(file.originalname, csvContent);
    }
    async findAll() {
        return this.datasetService.findAll();
    }
    async findOne(id) {
        return this.datasetService.findOne(id);
    }
};
__decorate([
    Post('upload'),
    UseInterceptors(FileInterceptor('file', {
        limits: {
            fileSize: 5 * 1024 * 1024,
        },
    })),
    __param(0, UploadedFile()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DatasetController.prototype, "uploadDataset", null);
__decorate([
    Get(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DatasetController.prototype, "findAll", null);
__decorate([
    Get(':id'),
    __param(0, Param('id', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], DatasetController.prototype, "findOne", null);
DatasetController = __decorate([
    Controller('datasets'),
    __metadata("design:paramtypes", [DatasetService])
], DatasetController);
export { DatasetController };
//# sourceMappingURL=dataset.controller.js.map