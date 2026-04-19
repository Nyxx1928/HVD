import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RateLimitService } from './rate-limit.service';
import { RateLimitGuard } from './rate-limit.guard';

/**
 * Rate Limit Module
 * 
 * Provides database-backed rate limiting functionality for API endpoints.
 * Imports PrismaModule to access the database for persistent rate limit tracking.
 * Exports both the service and guard for use in other modules.
 */
@Module({
  imports: [PrismaModule],
  providers: [RateLimitService, RateLimitGuard],
  exports: [RateLimitService, RateLimitGuard],
})
export class RateLimitModule {}
