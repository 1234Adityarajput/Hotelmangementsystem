import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('System Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'System and database health check' })
  @ApiResponse({
    status: 200,
    description: 'System health status and database connectivity details',
  })
  async getHealth() {
    return this.healthService.checkHealth();
  }
}
