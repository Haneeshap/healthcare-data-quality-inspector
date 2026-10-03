var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { DatasetController } from './dataset.controller.js';
import { DatasetService } from './dataset.service.js';
let QualityModule = class QualityModule {
};
QualityModule = __decorate([
    Module({
        imports: [PrismaModule],
        controllers: [DatasetController],
        providers: [DatasetService],
    })
], QualityModule);
export { QualityModule };
//# sourceMappingURL=quality.module.js.map