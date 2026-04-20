import { Module } from '@nestjs/common';
import { LoveNotesController } from './love-notes.controller';
import { LoveNotesService } from './love-notes.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';

@Module({
  imports: [PrismaModule, RateLimitModule],
  controllers: [LoveNotesController],
  providers: [LoveNotesService],
  exports: [LoveNotesService],
})
export class LoveNotesModule {}
