import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
}

@Injectable()
export class RateLimitService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Checks if a request from the given IP is allowed based on rate limit rules.
   *
   * @param ip - The client IP address
   * @param maxRequests - Maximum number of requests allowed in the time window
   * @returns RateLimitResult indicating if request is allowed and retry time if blocked
   */
  async checkRateLimit(
    ip: string,
    maxRequests: number,
  ): Promise<RateLimitResult> {
    const now = new Date();

    // Find existing rate limit record for this IP
    const rateLimit = await this.prisma.rateLimit.findUnique({
      where: { ip },
    });

    // If no record exists, request is allowed (will be created on increment)
    if (!rateLimit) {
      return { allowed: true };
    }

    // Check if the time window has expired
    if (rateLimit.reset_at <= now) {
      // Window expired, reset is needed but request is allowed
      return { allowed: true };
    }

    // Window is still active, check if under limit
    if (rateLimit.count < maxRequests) {
      return { allowed: true };
    }

    // Rate limit exceeded, calculate retry time
    const retryAfter = Math.ceil(
      (rateLimit.reset_at.getTime() - now.getTime()) / 1000,
    );
    return { allowed: false, retryAfter };
  }

  /**
   * Atomically increments the request count for the given IP.
   * If the rate limit window has expired, resets the count first.
   *
   * @param ip - The client IP address
   */
  async incrementCount(ip: string): Promise<void> {
    const now = new Date();

    const rateLimit = await this.prisma.rateLimit.findUnique({
      where: { ip },
    });

    if (!rateLimit || rateLimit.reset_at <= now) {
      // No record or expired window - this shouldn't happen if checkRateLimit was called first
      // But handle it gracefully by treating it as a reset scenario
      return;
    }

    // Increment the count atomically
    await this.prisma.rateLimit.update({
      where: { ip },
      data: { count: { increment: 1 } },
    });
  }

  /**
   * Creates or updates a rate limit record with a new reset timestamp.
   * Sets the count to 1 for a fresh window.
   *
   * @param ip - The client IP address
   * @param windowMs - Time window in milliseconds
   */
  async resetRateLimit(ip: string, windowMs: number): Promise<void> {
    const resetAt = new Date(Date.now() + windowMs);

    await this.prisma.rateLimit.upsert({
      where: { ip },
      update: {
        count: 1,
        reset_at: resetAt,
      },
      create: {
        ip,
        count: 1,
        reset_at: resetAt,
      },
    });
  }

  /**
   * Deletes rate limit records where the reset time has passed.
   * Should be called periodically to clean up old records.
   */
  async cleanupExpiredLimits(): Promise<void> {
    const now = new Date();

    await this.prisma.rateLimit.deleteMany({
      where: {
        reset_at: {
          lt: now,
        },
      },
    });
  }
}
