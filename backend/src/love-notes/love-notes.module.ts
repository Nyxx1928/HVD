import { Module } from '@nestjs/common';
import { LoveNotesController } from './love-notes.controller';
import { LoveNotesService } from './love-notes.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LoveNotesController],
  providers: [LoveNotesService],
  exports: [LoveNotesService],
})
export class LoveNotesModule {}
