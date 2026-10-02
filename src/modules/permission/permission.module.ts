import { Module } from '@nestjs/common';
import { PermissionService } from './permission.service.js';
import { PermissionController } from './permission.controller.js';
import { PrismaModule } from '../../database/database.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [PermissionController],
  providers: [PermissionService],
})
export class PermissionModule {}
