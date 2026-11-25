import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { QueryAttendanceDto } from './dto/query-attendance.dto';
import { BulkMarkAttendanceDto } from './dto/bulk-attendance.dto';

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

  @Get('matrix')
  @ApiOperation({ summary: 'Get complete monthly attendance matrix/grid across all active staff' })
  async getMonthlyMatrix(
    @Query('year') year: number,
    @Query('month') month: number,
    @Query('department') department?: string,
  ) {
    return this.attendanceService.getMonthlyMatrix(
      Number(year) || new Date().getFullYear(),
      Number(month) || new Date().getMonth() + 1,
      department,
    );
  }

  @Get('history')
  @ApiOperation({ summary: 'Get monthly attendance history including deleted audit logs' })
  async getHistory(
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.attendanceService.getHistory(month, year);
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

  @Post('bulk')
  @ApiOperation({ summary: 'Bulk mark attendance for all or selected staff on a given date' })
  @ApiResponse({ status: 200, description: 'Bulk attendance successfully recorded' })
  async bulkMarkAttendance(@Body() dto: BulkMarkAttendanceDto) {
    return this.attendanceService.bulkMark(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update/correct an attendance record' })
  async update(@Param('id') id: string, @Body() dto: UpdateAttendanceDto) {
    return this.attendanceService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an attendance record and archive to audit log' })
  async remove(@Param('id') id: string) {
    return this.attendanceService.delete(id);
  }
}
