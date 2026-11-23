import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { QueryReportsDto } from './dto/query-reports.dto';

@ApiTags('Reports and Analytics')
@ApiBearerAuth('JWT-auth')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('executive')
  @ApiOperation({ summary: 'Get comprehensive executive operational and financial analytics' })
  async getExecutiveReport(@Query() query: QueryReportsDto) {
    return this.reportsService.getExecutiveReport(query);
  }
}
