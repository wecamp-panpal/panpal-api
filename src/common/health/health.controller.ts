import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    example: {
      status: 'ok',
      timestamp: '2023-09-18T12:00:00.000Z',
      database: 'connected',
      uptime: 123456,
      memory: {
        used: '50.2 MB',
        total: '512 MB',
      },
    },
  })
  async check() {
    return this.healthService.checkHealth();
  }

  @Get('database')
  @ApiOperation({ summary: 'Database connectivity check' })
  @ApiResponse({
    status: 200,
    description: 'Database is accessible',
    example: {
      status: 'ok',
      database: 'connected',
      responseTime: '12ms',
    },
  })
  async checkDatabase() {
    return this.healthService.checkDatabase();
  }
}
