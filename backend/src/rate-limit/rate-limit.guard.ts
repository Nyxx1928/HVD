import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { RateLimitService } from './rate-limit.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Guard that implements database-backed rate limiting for API endpoints.
 * Extracts client IP from headers and enforces different limits based on the request path.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly rateLimitService: RateLimitService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Determines if a request should be allowed based on rate limiting rules.
   * 
   * @param context - The execution context containing request details
   * @returns true if request is allowed, throws HttpException if rate limited
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Extract client IP from headers
    const ip = this.extractIp(request);

    // Get rate limit configuration based on request path
    const { maxRequests, windowMs } = this.getRateLimitConfig(request.path);

    // Check if request is allowed
    const result = await this.rateLimitService.checkRateLimit(
      ip,
      maxRequests,
      windowMs,
    );

    if (!result.allowed) {
      // Rate limit exceeded - set Retry-After header and throw 429
      response.setHeader('Retry-After', result.retryAfter.toString());
      throw new HttpException(
        'Too many requests, please try again later',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Request is allowed - record this request
    // Check if record exists and is not expired to decide whether to increment or reset
    const now = new Date();
    const existingRecord = await this.prisma.rateLimit.findUnique({
      where: { ip },
    });

    if (!existingRecord || existingRecord.reset_at <= now) {
      // No record or expired - create/reset with count=1
      await this.rateLimitService.resetRateLimit(ip, windowMs);
    } else {
      // Active record - increment count
      await this.rateLimitService.incrementCount(ip);
    }

    return true;
  }

  /**
   * Extracts the client IP address from request headers.
   * Checks x-forwarded-for (proxy/load balancer) first, then x-real-ip, then falls back to 'unknown'.
   * 
   * @param request - The Express request object
   * @returns The client IP address
   */
  private extractIp(request: Request): string {
    // Extract IP from x-forwarded-for header (proxy/load balancer)
    // Falls back to x-real-ip, then 'unknown' if neither present
    const forwardedFor = request.headers['x-forwarded-for'];
    if (forwardedFor) {
      // x-forwarded-for can be a comma-separated list, take the first IP
      const ip = Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : forwardedFor.split(',')[0];
      return ip.trim();
    }

    const realIp = request.headers['x-real-ip'];
    if (realIp) {
      return Array.isArray(realIp) ? realIp[0] : realIp;
    }

    return 'unknown';
  }

  /**
   * Returns rate limit configuration based on the request path.
   * Different endpoints have different rate limits:
   * - /love-notes: 5 requests per 60 seconds
   * - /comments: 10 requests per 60 seconds
   * 
   * @param path - The request path
   * @returns Configuration object with maxRequests and windowMs
   */
  private getRateLimitConfig(path: string): {
    maxRequests: number;
    windowMs: number;
  } {
    // Check if path contains 'comments'
    if (path.includes('comments')) {
      return {
        maxRequests: 10,
        windowMs: 60000, // 60 seconds
      };
    }

    // Default to love-notes rate limit
    return {
      maxRequests: 5,
      windowMs: 60000, // 60 seconds
    };
  }
}
