import { Controller, Get, Res } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';

@ApiTags('Root')
@Controller()
export class AppController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'Backend root status endpoint' })
  @ApiResponse({ status: 200, description: 'Backend service status' })
  getRoot() {
    return {
      success: true,
      service: 'Hotel Radha Palace - Management Backend API',
      status: 'Live & Operational',
      version: '1.0.0',
      database: 'Neon PostgreSQL Connected',
      hotelName: 'Hotel Radha Palace',
      endpoints: {
        health: '/api/v1/health',
        documentation: '/api/docs',
        auth: '/api/v1/auth/login',
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('favicon.ico')
  @ApiExcludeEndpoint()
  getFavicon(@Res() res: any) {
    res.status(204).end();
  }
}
