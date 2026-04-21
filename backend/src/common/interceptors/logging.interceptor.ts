import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const { method, url, ip } = request;
    const timestamp = new Date().toISOString();

    // Extract IP from headers (for proxy/load balancer scenarios)
    const clientIp =
      (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      request.headers['x-real-ip'] ||
      ip ||
      'unknown';

    // Log incoming request
    this.logger.log(
      `Incoming: ${method} ${url} - IP: ${clientIp} - Time: ${timestamp}`,
    );

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const { statusCode } = response;

          // Log successful response
          this.logger.log(
            `Outgoing: ${method} ${url} - Status: ${statusCode} - Duration: ${duration}ms`,
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error?.status || 500;

          // Log error response
          this.logger.error(
            `Error: ${method} ${url} - Status: ${statusCode} - Duration: ${duration}ms - Message: ${error?.message || 'Unknown error'}`,
          );
        },
      }),
    );
  }
}
