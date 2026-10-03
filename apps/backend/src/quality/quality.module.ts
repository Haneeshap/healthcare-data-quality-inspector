import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { DatasetController } from './dataset.controller.js';
import { DatasetService } from './dataset.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [DatasetController],
  providers: [DatasetService],
})
export class QualityModule {}
