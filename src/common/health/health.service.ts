import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly prisma: PrismaService) {}

  async checkHealth() {
    const startTime = Date.now();

    try {
      // Check database connectivity
      await this.prisma.$queryRaw`SELECT 1`;
      const dbResponseTime = Date.now() - startTime;

      // Get memory usage
      const memoryUsage = process.memoryUsage();

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected',
        uptime: Math.floor(process.uptime()),
        memory: {
          used: `${Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100} MB`,
          total: `${Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100} MB`,
        },
        responseTime: `${dbResponseTime}ms`,
      };
    } catch (error) {
      this.logger.error('Health check failed', error);
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error.message,
      };
    }
  }

  // async checkHealth() {
  //   const startTime = Date.now();

  //   const memoryUsage = process.memoryUsage();

  //   return {
  //     status: 'ok',
  //     timestamp: new Date().toISOString(),
  //     // Không query DB ở đây
  //     database: 'not-checked',
  //     uptime: Math.floor(process.uptime()),
  //     memory: {
  //       used: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
  //       total: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
  //     },
  //     responseTime: `${Date.now() - startTime}ms`,
  //   };
  // }

  async checkDatabase() {
    const startTime = Date.now();

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;

      return {
        status: 'ok',
        database: 'connected',
        responseTime: `${responseTime}ms`,
      };
    } catch (error) {
      this.logger.error('Database check failed', error);
      return {
        status: 'error',
        database: 'disconnected',
        error: error.message,
      };
    }
  }
}
