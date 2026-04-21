import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    const timestamp = new Date().toISOString();
    let databaseStatus = 'connected';

    try {
      // Test database connection with a simple query
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      databaseStatus = 'disconnected';
    }

    return {
      status: 'ok',
      timestamp,
      database: databaseStatus,
    };
  }
}
