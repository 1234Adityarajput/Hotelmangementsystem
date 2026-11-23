import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('Admin Dashboard')
@ApiBearerAuth('JWT-auth')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get core hotel operational & financial metrics from live database' })
  @ApiResponse({ status: 200, description: 'Live dashboard statistics' })
  async getStats() {
    return this.dashboardService.getStats();
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get comprehensive operational & business analytics breakdowns' })
  @ApiResponse({ status: 200, description: 'Live dashboard analytics' })
  async getAnalytics() {
    return this.dashboardService.getAnalytics();
  }

  @Get('recent-bookings')
  @ApiOperation({ summary: 'Get list of most recent bookings' })
  async getRecentBookings(@Query('limit') limit?: number) {
    return this.dashboardService.getRecentBookings(limit ? Number(limit) : 6);
  }

  @Get('recent-activities')
  @ApiOperation({ summary: 'Get recent system audit activities' })
  async getRecentActivities(@Query('limit') limit?: number) {
    return this.dashboardService.getRecentActivities(limit ? Number(limit) : 10);
  }

  @Get('occupancy-stats')
  @ApiOperation({ summary: 'Get room type occupancy breakdowns' })
  async getOccupancyStats() {
    return this.dashboardService.getOccupancyStats();
  }
}
