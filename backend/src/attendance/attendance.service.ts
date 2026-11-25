import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { QueryAttendanceDto } from './dto/query-attendance.dto';
import { BulkMarkAttendanceDto } from './dto/bulk-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  private parseDateOnly(dateStr?: string): Date {
    if (!dateStr) {
      const now = new Date();
      return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    }
    const parts = dateStr.split('T')[0].split('-').map(Number);
    return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  }

  private parseTimeToHours(timeStr?: string | null): number | null {
    if (!timeStr) return null;
    const trimmed = timeStr.trim().toUpperCase();
    const match = trimmed.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/);
    if (!match) return null;

    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3];

    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    return hours + minutes / 60;
  }

  private calculateHours(
    status: string,
    checkIn?: string | null,
    checkOut?: string | null,
    userWorkingHours?: number,
    userOvertime?: number,
  ): { workingHours: number; overtimeHours: number } {
    if (status === 'ABSENT' || status === 'LEAVE' || status === 'WEEKLY_OFF') {
      return { workingHours: 0, overtimeHours: 0 };
    }

    if (userWorkingHours !== undefined && userWorkingHours !== null) {
      return {
        workingHours: Number(userWorkingHours),
        overtimeHours: userOvertime !== undefined ? Number(userOvertime) : Math.max(0, Number(userWorkingHours) - 8),
      };
    }

    if (checkIn && checkOut) {
      const inH = this.parseTimeToHours(checkIn);
      const outH = this.parseTimeToHours(checkOut);
      if (inH !== null && outH !== null) {
        let diff = outH - inH;
        if (diff < 0) diff += 24; // overnight shift
        const roundedDiff = Math.round(diff * 100) / 100;
        const overtime = Math.max(0, Math.round((roundedDiff - 8) * 100) / 100);
        return { workingHours: roundedDiff, overtimeHours: overtime };
      }
    }

    if (status === 'HALF_DAY') {
      return { workingHours: 4.0, overtimeHours: 0 };
    }

    return { workingHours: 8.0, overtimeHours: 0 };
  }

  async markAttendance(dto: MarkAttendanceDto) {
    const staff = await this.prisma.staff.findUnique({
      where: { id: dto.staffId },
    });
    if (!staff) {
      throw new NotFoundException(`Staff member with ID ${dto.staffId} not found`);
    }

    if (staff.employmentStatus !== 'ACTIVE') {
      throw new BadRequestException(
        `Cannot record attendance: Staff member is marked as ${staff.employmentStatus}`,
      );
    }

    const attDate = this.parseDateOnly(dto.attendanceDate);

    const { workingHours, overtimeHours } = this.calculateHours(
      dto.attendanceStatus,
      dto.checkInTime,
      dto.checkOutTime,
      dto.workingHours,
      dto.overtimeHours,
    );

    const record = await this.prisma.attendance.upsert({
      where: {
        staffId_attendanceDate: {
          staffId: dto.staffId,
          attendanceDate: attDate,
        },
      },
      update: {
        attendanceStatus: dto.attendanceStatus,
        checkInTime: dto.checkInTime,
        checkOutTime: dto.checkOutTime,
        workingHours,
        overtimeHours,
        notes: dto.notes,
      },
      create: {
        staffId: dto.staffId,
        attendanceDate: attDate,
        attendanceStatus: dto.attendanceStatus,
        checkInTime: dto.checkInTime,
        checkOutTime: dto.checkOutTime,
        workingHours,
        overtimeHours,
        notes: dto.notes,
      },
      include: {
        staff: true,
      },
    });

    return record;
  }

  async update(id: string, dto: UpdateAttendanceDto) {
    const existing = await this.prisma.attendance.findUnique({
      where: { id },
      include: { staff: true },
    });
    if (!existing) {
      throw new NotFoundException(`Attendance entry with ID ${id} not found`);
    }

    const status = dto.attendanceStatus || existing.attendanceStatus;
    const checkIn = dto.checkInTime !== undefined ? dto.checkInTime : existing.checkInTime;
    const checkOut = dto.checkOutTime !== undefined ? dto.checkOutTime : existing.checkOutTime;

    const { workingHours, overtimeHours } = this.calculateHours(
      status,
      checkIn,
      checkOut,
      dto.workingHours,
      dto.overtimeHours,
    );

    const updated = await this.prisma.attendance.update({
      where: { id },
      data: {
        attendanceStatus: status,
        checkInTime: checkIn,
        checkOutTime: checkOut,
        workingHours,
        overtimeHours,
        notes: dto.notes !== undefined ? dto.notes : existing.notes,
      },
      include: { staff: true },
    });

    return updated;
  }

  async getDailyRegister(dateStr?: string, department?: string) {
    const targetDate = this.parseDateOnly(dateStr);

    const staffWhere: any = { employmentStatus: 'ACTIVE' };
    if (department && department !== 'ALL') {
      staffWhere.department = department;
    }

    const allStaff = await this.prisma.staff.findMany({
      where: staffWhere,
      orderBy: { fullName: 'asc' },
    });

    const attendances = await this.prisma.attendance.findMany({
      where: {
        attendanceDate: targetDate,
        staffId: { in: allStaff.map((s) => s.id) },
      },
    });

    const attMap = new Map<string, any>();
    attendances.forEach((a) => attMap.set(a.staffId, a));

    const register = allStaff.map((s) => ({
      staff: s,
      attendance: attMap.get(s.id) || null,
      isMarked: attMap.has(s.id),
    }));

    // Stats
    const stats = {
      totalStaff: allStaff.length,
      marked: attendances.length,
      unmarked: allStaff.length - attendances.length,
      present: attendances.filter((a) => a.attendanceStatus === 'PRESENT').length,
      absent: attendances.filter((a) => a.attendanceStatus === 'ABSENT').length,
      halfDay: attendances.filter((a) => a.attendanceStatus === 'HALF_DAY').length,
      leave: attendances.filter((a) => a.attendanceStatus === 'LEAVE').length,
      weeklyOff: attendances.filter((a) => a.attendanceStatus === 'WEEKLY_OFF').length,
    };

    return {
      date: targetDate.toISOString().split('T')[0],
      stats,
      register,
    };
  }

  async getMonthlySummary(year: number, month: number, staffId?: string) {
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 1));

    const where: any = {
      attendanceDate: {
        gte: startDate,
        lt: endDate,
      },
    };

    if (staffId) {
      where.staffId = staffId;
    }

    const records = await this.prisma.attendance.findMany({
      where,
      include: { staff: true },
      orderBy: [{ attendanceDate: 'asc' }, { staff: { fullName: 'asc' } }],
    });

    return records;
  }

  async getStaffHistory(staffId: string, query: QueryAttendanceDto) {
    const { startDate, endDate, status, page = 1, limit = 31 } = query;
    const skip = (page - 1) * limit;

    const where: any = { staffId };

    if (status) where.attendanceStatus = status;

    if (startDate && endDate) {
      where.attendanceDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.attendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { attendanceDate: 'desc' },
      }),
      this.prisma.attendance.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async bulkMark(dto: BulkMarkAttendanceDto) {
    const attDate = this.parseDateOnly(dto.attendanceDate);

    const staffWhere: any = { employmentStatus: 'ACTIVE' };
    if (dto.staffIds && dto.staffIds.length > 0) {
      staffWhere.id = { in: dto.staffIds };
    } else if (dto.department && dto.department !== 'ALL') {
      staffWhere.department = dto.department;
    }

    const targetStaff = await this.prisma.staff.findMany({
      where: staffWhere,
      select: { id: true, fullName: true, employeeCode: true },
    });

    if (targetStaff.length === 0) {
      return { success: true, count: 0, message: 'No active staff found matching criteria' };
    }

    const { workingHours, overtimeHours } = this.calculateHours(
      dto.attendanceStatus,
      dto.checkInTime,
      dto.checkOutTime,
    );

    // Upsert attendance for all selected staff
    const results = await Promise.all(
      targetStaff.map((s) =>
        this.prisma.attendance.upsert({
          where: {
            staffId_attendanceDate: {
              staffId: s.id,
              attendanceDate: attDate,
            },
          },
          update: {
            attendanceStatus: dto.attendanceStatus,
            checkInTime: dto.checkInTime,
            checkOutTime: dto.checkOutTime,
            workingHours,
            overtimeHours,
            notes: dto.notes || `Bulk marked as ${dto.attendanceStatus}`,
          },
          create: {
            staffId: s.id,
            attendanceDate: attDate,
            attendanceStatus: dto.attendanceStatus,
            checkInTime: dto.checkInTime,
            checkOutTime: dto.checkOutTime,
            workingHours,
            overtimeHours,
            notes: dto.notes || `Bulk marked as ${dto.attendanceStatus}`,
          },
        }),
      ),
    );

    // Audit Log
    await this.prisma.auditLog.create({
      data: {
        entityType: 'ATTENDANCE',
        entityId: dto.attendanceDate,
        action: 'UPDATE',
        description: `Bulk marked attendance for ${results.length} staff as ${dto.attendanceStatus} on ${dto.attendanceDate}`,
      },
    });

    return {
      success: true,
      count: results.length,
      attendanceDate: dto.attendanceDate,
      attendanceStatus: dto.attendanceStatus,
    };
  }

  async getMonthlyMatrix(year: number, month: number, department?: string) {
    const y = Number(year) || new Date().getFullYear();
    const m = Number(month) || new Date().getMonth() + 1;

    // Number of days in the month
    const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const startDate = new Date(Date.UTC(y, m - 1, 1));
    const endDate = new Date(Date.UTC(y, m, 1));

    const staffWhere: any = { employmentStatus: 'ACTIVE' };
    if (department && department !== 'ALL') {
      staffWhere.department = department;
    }

    const allStaff = await this.prisma.staff.findMany({
      where: staffWhere,
      orderBy: [{ department: 'asc' }, { fullName: 'asc' }],
    });

    const attendances = await this.prisma.attendance.findMany({
      where: {
        staffId: { in: allStaff.map((s) => s.id) },
        attendanceDate: {
          gte: startDate,
          lt: endDate,
        },
      },
      orderBy: { attendanceDate: 'asc' },
    });

    // Map by staffId -> dayNumber (1..daysInMonth) -> record
    const staffDayMap = new Map<string, Map<number, any>>();
    allStaff.forEach((s) => staffDayMap.set(s.id, new Map<number, any>()));

    attendances.forEach((a) => {
      const recDate = new Date(a.attendanceDate);
      const day = recDate.getUTCDate();
      const sMap = staffDayMap.get(a.staffId);
      if (sMap) {
        sMap.set(day, a);
      }
    });

    // Compute row for each staff member
    const staffRows = allStaff.map((s) => {
      const dayMap = staffDayMap.get(s.id) || new Map<number, any>();
      const dailyRecords: Record<number, any> = {};

      let presentCount = 0;
      let absentCount = 0;
      let halfDayCount = 0;
      let leaveCount = 0;
      let weeklyOffCount = 0;
      let totalWorkingHours = 0;
      let totalOvertimeHours = 0;

      for (let d = 1; d <= daysInMonth; d++) {
        const rec = dayMap.get(d) || null;
        if (rec) {
          dailyRecords[d] = {
            id: rec.id,
            status: rec.attendanceStatus,
            checkInTime: rec.checkInTime,
            checkOutTime: rec.checkOutTime,
            workingHours: Number(rec.workingHours || 0),
            overtimeHours: Number(rec.overtimeHours || 0),
            notes: rec.notes,
          };

          if (rec.attendanceStatus === 'PRESENT') presentCount++;
          else if (rec.attendanceStatus === 'ABSENT') absentCount++;
          else if (rec.attendanceStatus === 'HALF_DAY') halfDayCount++;
          else if (rec.attendanceStatus === 'LEAVE') leaveCount++;
          else if (rec.attendanceStatus === 'WEEKLY_OFF') weeklyOffCount++;

          totalWorkingHours += Number(rec.workingHours || 0);
          totalOvertimeHours += Number(rec.overtimeHours || 0);
        } else {
          dailyRecords[d] = null;
        }
      }

      const totalRecordedDays = presentCount + absentCount + halfDayCount + leaveCount + weeklyOffCount;
      const workingDaysDenominator = presentCount + absentCount + halfDayCount + leaveCount;
      const attendanceRate =
        workingDaysDenominator > 0
          ? Math.round(((presentCount + halfDayCount * 0.5) / workingDaysDenominator) * 100)
          : 0;

      return {
        staff: s,
        dailyRecords,
        summary: {
          presentCount,
          absentCount,
          halfDayCount,
          leaveCount,
          weeklyOffCount,
          totalRecordedDays,
          totalWorkingHours: Math.round(totalWorkingHours * 100) / 100,
          totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
          attendanceRate,
        },
      };
    });

    // Overall summary across the entire hotel for this month
    const totalStaff = allStaff.length;
    const overallStats = {
      year: y,
      month: m,
      daysInMonth,
      totalStaff,
      totalPresent: staffRows.reduce((sum, r) => sum + r.summary.presentCount, 0),
      totalAbsent: staffRows.reduce((sum, r) => sum + r.summary.absentCount, 0),
      totalHalfDay: staffRows.reduce((sum, r) => sum + r.summary.halfDayCount, 0),
      totalLeave: staffRows.reduce((sum, r) => sum + r.summary.leaveCount, 0),
      totalWeeklyOff: staffRows.reduce((sum, r) => sum + r.summary.weeklyOffCount, 0),
      totalWorkingHours: Math.round(staffRows.reduce((sum, r) => sum + r.summary.totalWorkingHours, 0) * 100) / 100,
      totalOvertimeHours: Math.round(staffRows.reduce((sum, r) => sum + r.summary.totalOvertimeHours, 0) * 100) / 100,
    };

    return {
      year: y,
      month: m,
      daysInMonth,
      overallStats,
      staffRows,
    };
  }

  async delete(id: string) {
    const existing = await this.prisma.attendance.findUnique({
      where: { id },
      include: {
        staff: true,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Attendance record with ID ${id} not found`);
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Snapshot full attendance record into AuditLog for permanent history preservation
      await tx.auditLog.create({
        data: {
          entityType: 'ATTENDANCE',
          entityId: id,
          action: 'DELETE',
          previousValues: {
            ...existing,
            staffName: existing.staff.fullName,
            employeeCode: existing.staff.employeeCode,
            department: existing.staff.department,
            designation: existing.staff.designation,
            deletedAt: new Date().toISOString(),
          } as any,
          description: `Deleted attendance record for ${existing.staff.fullName} (${existing.staff.employeeCode}) on ${existing.attendanceDate.toISOString().split('T')[0]}. Preserved in audit history.`,
        },
      });

      // 2. Delete attendance record from active database
      await tx.attendance.delete({ where: { id } });

      return {
        success: true,
        message: `Attendance record for ${existing.staff.fullName} on ${existing.attendanceDate.toISOString().split('T')[0]} deleted successfully and archived in Monthly History.`,
        attendanceId: id,
        staffName: existing.staff.fullName,
      };
    });
  }

  async getHistory(monthParam?: string, yearParam?: string) {
    const now = new Date();
    const month = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1;
    const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();

    const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // 1. Fetch active attendance records for this month
    const activeRecords = await this.prisma.attendance.findMany({
      where: {
        attendanceDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        staff: true,
      },
      orderBy: { attendanceDate: 'desc' },
    });

    const enrichedActive = activeRecords.map((a) => ({
      id: a.id,
      staffId: a.staffId,
      employeeCode: a.staff.employeeCode,
      staffName: a.staff.fullName,
      department: a.staff.department,
      designation: a.staff.designation,
      attendanceDate: a.attendanceDate.toISOString().split('T')[0],
      attendanceStatus: a.attendanceStatus,
      checkInTime: a.checkInTime,
      checkOutTime: a.checkOutTime,
      workingHours: Number(a.workingHours || 0),
      overtimeHours: Number(a.overtimeHours || 0),
      notes: a.notes,
      createdAt: a.createdAt,
      isDeleted: false,
    }));

    // 2. Fetch deleted attendance records from AuditLog for this month
    const deletedLogs = await this.prisma.auditLog.findMany({
      where: {
        entityType: 'ATTENDANCE',
        action: 'DELETE',
        changedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { changedAt: 'desc' },
    });

    const deletedItems = deletedLogs.map((log) => {
      const prev: any = log.previousValues || {};
      const attDate = prev.attendanceDate ? new Date(prev.attendanceDate).toISOString().split('T')[0] : log.changedAt.toISOString().split('T')[0];
      return {
        id: log.entityId,
        staffId: prev.staffId,
        employeeCode: prev.employeeCode || 'EMP-ARCHIVED',
        staffName: prev.staffName || 'Archived Employee',
        department: prev.department || 'General',
        designation: prev.designation || 'Staff',
        attendanceDate: attDate,
        attendanceStatus: prev.attendanceStatus || 'PRESENT',
        checkInTime: prev.checkInTime,
        checkOutTime: prev.checkOutTime,
        workingHours: Number(prev.workingHours || 0),
        overtimeHours: Number(prev.overtimeHours || 0),
        notes: prev.notes,
        createdAt: prev.createdAt || log.changedAt,
        deletedAt: log.changedAt,
        isDeleted: true,
      };
    });

    const allHistory = [...enrichedActive, ...deletedItems].sort(
      (a, b) =>
        new Date(b.attendanceDate || b.createdAt).getTime() -
        new Date(a.attendanceDate || a.createdAt).getTime()
    );

    return {
      month,
      year,
      monthName: startDate.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      totalCount: allHistory.length,
      activeCount: enrichedActive.length,
      deletedCount: deletedItems.length,
      items: allHistory,
    };
  }
}
