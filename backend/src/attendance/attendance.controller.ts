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
import { AttendanceService } from './attendance.service';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { QueryAttendanceDto } from './dto/query-attendance.dto';

@ApiTags('Staff Attendance')
@ApiBearerAuth('JWT-auth')
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get('daily')
  @ApiOperation({ summary: 'Get daily attendance register for a specific date across active staff' })
  async getDailyRegister(
    @Query('date') date?: string,
    @Query('department') department?: string,
  ) {
    return this.attendanceService.getDailyRegister(date, department);
  }

  @Get('monthly')
  @ApiOperation({ summary: 'Get monthly attendance records for a year and month' })
  async getMonthly(
    @Query('year') year: number,
    @Query('month') month: number,
    @Query('staffId') staffId?: string,
  ) {
    return this.attendanceService.getMonthlySummary(
      Number(year) || new Date().getFullYear(),
      Number(month) || new Date().getMonth() + 1,
      staffId,
    );
  }

  @Get('staff/:staffId')
  @ApiOperation({ summary: 'Get attendance history for a single employee' })
  async getStaffHistory(
    @Param('staffId') staffId: string,
    @Query() query: QueryAttendanceDto,
  ) {
    return this.attendanceService.getStaffHistory(staffId, query);
  }

  @Post()
  @ApiOperation({ summary: 'Mark or update attendance for an employee on a given date' })
  @ApiResponse({ status: 200, description: 'Attendance successfully recorded' })
  async markAttendance(@Body() dto: MarkAttendanceDto) {
    return this.attendanceService.markAttendance(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update/correct an attendance record' })
  async update(@Param('id') id: string, @Body() dto: UpdateAttendanceDto) {
    return this.attendanceService.update(id, dto);
  }
}
