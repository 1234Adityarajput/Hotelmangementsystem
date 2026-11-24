import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { QueryReportsDto } from './dto/query-reports.dto';

@ApiTags('Reports and Analytics')
@ApiBearerAuth('JWT-auth')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('report-types')
  @ApiOperation({ summary: 'Get list of all 19 available Hotel and Staff report types' })
  async getReportTypes() {
    return this.reportsService.getReportTypes();
  }

  @Get('executive')
  @ApiOperation({ summary: 'Get comprehensive executive operational and financial analytics' })
  async getExecutiveReport(@Query() query: QueryReportsDto) {
    return this.reportsService.getExecutiveReport(query);
  }

  @Get(':reportType')
  @ApiOperation({ summary: 'Generate specific hotel or staff report with date filters and stats' })
  async generateReport(@Param('reportType') reportType: string, @Query() query: QueryReportsDto) {
    if (reportType === 'executive') {
      return this.reportsService.getExecutiveReport(query);
    }
    if (reportType === 'report-types') {
      return this.reportsService.getReportTypes();
    }
    return this.reportsService.generateReport(reportType, query);
  }
}
