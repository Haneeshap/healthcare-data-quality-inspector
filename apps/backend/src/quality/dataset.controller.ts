import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import { DatasetService } from './dataset.service.js';

@Controller('datasets')
export class DatasetController {
  constructor(private readonly datasetService: DatasetService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  async uploadDataset(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Please upload a CSV file.');
    }

    if (!file.originalname.toLowerCase().endsWith('.csv')) {
      throw new BadRequestException('Only CSV files are supported.');
    }

    const csvContent = file.buffer.toString('utf8');

    return this.datasetService.createFromCsv(
      file.originalname,
      csvContent,
    );
  }
  @Get()
  async findAll() {
    return this.datasetService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.datasetService.findOne(id);
  }
}
