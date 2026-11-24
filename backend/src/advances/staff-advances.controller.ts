import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { StaffAdvancesService } from './staff-advances.service';
import { IssueAdvanceDto } from './dto/issue-advance.dto';
import { RepayAdvanceDto } from './dto/repay-advance.dto';
import { QueryAdvanceDto } from './dto/query-advance.dto';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Staff Advances')
@ApiBearerAuth('JWT-auth')
@Roles('OWNER')
@Controller('advances')
export class StaffAdvancesController {
  constructor(private readonly advancesService: StaffAdvancesService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get advances financial overview and status breakdown' })
  async getStats() {
    return this.advancesService.getStats();
  }

  @Get()
  @ApiOperation({ summary: 'List advances with staff, status, and date range filters' })
  async findAll(@Query() query: QueryAdvanceDto) {
    return this.advancesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single advance ledger record' })
  async findOne(@Param('id') id: string) {
    return this.advancesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Disburse a new salary advance to a staff member' })
  @ApiResponse({ status: 201, description: 'Advance successfully disbursed' })
  async issueAdvance(@Body() dto: IssueAdvanceDto) {
    return this.advancesService.issueAdvance(dto);
  }

  @Post(':id/repay')
  @ApiOperation({ summary: 'Record a recovery or repayment against an outstanding advance' })
  async recordRepayment(@Param('id') id: string, @Body() dto: RepayAdvanceDto) {
    return this.advancesService.recordRepayment(id, dto);
  }
}
