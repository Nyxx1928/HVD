import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { LoveNotesModule } from './love-notes/love-notes.module';
import { CommentsModule } from './comments/comments.module';
import { RateLimitModule } from './rate-limit/rate-limit.module';

@Module({
  imports: [PrismaModule, LoveNotesModule, CommentsModule, RateLimitModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
