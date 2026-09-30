import { Module } from '@nestjs/common';
import { PrismaService } from './database.service.js';

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
