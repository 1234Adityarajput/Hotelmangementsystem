import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { QueryStaffDto } from './dto/query-staff.dto';

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) { }

  private async generateEmployeeCode(): Promise<string> {
    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    const prefix = `EMP-${yearMonth}-`;

    const lastStaff = await this.prisma.staff.findFirst({
      where: { employeeCode: { startsWith: prefix } },
      orderBy: { employeeCode: 'desc' },
      select: { employeeCode: true },
    });

    let nextNumber = 1;
    if (lastStaff?.employeeCode) {
      const parts = lastStaff.employeeCode.split('-');
      const num = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(num)) nextNumber = num + 1;
    }

    return `${prefix}${String(nextNumber).padStart(4, '0')}`;
  }

  async create(dto: CreateStaffDto) {
    const existing = await this.prisma.staff.findFirst({
      where: { mobileNumber: dto.mobileNumber },
    });
    if (existing) {
      throw new ConflictException(`Staff member with mobile number ${dto.mobileNumber} already registered (${existing.employeeCode})`);
    }

    let employeeCode = dto.employeeCode?.trim();
    if (employeeCode) {
      const codeExists = await this.prisma.staff.findUnique({
        where: { employeeCode },
      });
      if (codeExists) {
        throw new ConflictException(`Employee ID ${employeeCode} already exists`);
      }
    } else {
      employeeCode = await this.generateEmployeeCode();
    }

    const staff = await this.prisma.staff.create({
      data: {
        employeeCode,
        fullName: dto.fullName,
        mobileNumber: dto.mobileNumber,
        alternateMobileNumber: dto.alternateMobileNumber,
        email: dto.email,
        address: dto.address,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
        emergencyContact: dto.emergencyContact,
        designation: dto.designation?.trim() || 'Staff',
        department: dto.department,
        joiningDate: new Date(dto.joiningDate),
        monthlySalary: dto.monthlySalary,
        bankAccountHolder: dto.bankAccountHolder,
        bankAccountNumber: dto.bankAccountNumber,
        bankIfscCode: dto.bankIfscCode,
        notes: dto.notes,
        employmentStatus: dto.employmentStatus || 'ACTIVE',
      },
    });

    // Create Audit Log
    await this.prisma.auditLog.create({
      data: {
        entityType: 'STAFF',
        entityId: staff.id,
        action: 'CREATE',
        newValues: { employeeCode, fullName: staff.fullName, department: staff.department },
        description: `Registered employee ${staff.fullName} (${employeeCode}) in ${staff.department}`,
      },
    });

    return staff;
  }

  async findAll(query: QueryStaffDto) {
    const { search, department, employmentStatus, page = 1, limit = 15 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (department && department !== 'ALL') {
      where.department = department;
    }

    if (employmentStatus && employmentStatus !== ('ALL' as any)) {
      where.employmentStatus = employmentStatus;
    }

    if (search && search.trim()) {
      const s = search.trim();
      where.OR = [
        { employeeCode: { contains: s, mode: 'insensitive' } },
        { fullName: { contains: s, mode: 'insensitive' } },
        { mobileNumber: { contains: s, mode: 'insensitive' } },
        { email: { contains: s, mode: 'insensitive' } },
        { designation: { contains: s, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.staff.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              attendanceRecords: true,
              salaryRecords: true,
              advances: true,
            },
          },
        },
      }),
      this.prisma.staff.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { id },
      include: {
        attendanceRecords: {
          take: 10,
          orderBy: { attendanceDate: 'desc' },
        },
        salaryRecords: {
          take: 5,
          orderBy: [{ payrollYear: 'desc' }, { payrollMonth: 'desc' }],
        },
        advances: {
          take: 5,
          orderBy: { advanceDate: 'desc' },
        },
        _count: {
          select: {
            attendanceRecords: true,
            salaryRecords: true,
            advances: true,
          },
        },
      },
    });

    if (!staff) {
      throw new NotFoundException(`Staff member with ID ${id} not found`);
    }

    return staff;
  }

  async update(id: string, dto: UpdateStaffDto) {
    const existing = await this.prisma.staff.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Staff member with ID ${id} not found`);
    }

    if (dto.mobileNumber && dto.mobileNumber !== existing.mobileNumber) {
      const conflict = await this.prisma.staff.findFirst({
        where: { mobileNumber: dto.mobileNumber, id: { not: id } },
      });
      if (conflict) {
        throw new ConflictException(`Mobile number ${dto.mobileNumber} is already used by ${conflict.employeeCode}`);
      }
    }

    const updated = await this.prisma.staff.update({
      where: { id },
      data: {
        fullName: dto.fullName,
        mobileNumber: dto.mobileNumber,
        alternateMobileNumber: dto.alternateMobileNumber,
        email: dto.email,
        address: dto.address,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        emergencyContact: dto.emergencyContact,
        designation: dto.designation !== undefined ? (dto.designation.trim() || 'Staff') : undefined,
        department: dto.department,
        joiningDate: dto.joiningDate ? new Date(dto.joiningDate) : undefined,
        monthlySalary: dto.monthlySalary,
        bankAccountHolder: dto.bankAccountHolder,
        bankAccountNumber: dto.bankAccountNumber,
        bankIfscCode: dto.bankIfscCode,
        notes: dto.notes,
        employmentStatus: dto.employmentStatus,
      },
    });

    // Create Audit Log
    await this.prisma.auditLog.create({
      data: {
        entityType: 'STAFF',
        entityId: id,
        action: 'UPDATE',
        previousValues: { designation: existing.designation, status: existing.employmentStatus, salary: existing.monthlySalary },
        newValues: { designation: updated.designation, status: updated.employmentStatus, salary: updated.monthlySalary },
        description: `Updated profile details for employee ${updated.fullName} (${updated.employeeCode})`,
      },
    });

    return updated;
  }

  async delete(id: string) {
    const existing = await this.prisma.staff.findUnique({
      where: { id },
      include: {
        attendanceRecords: true,
        salaryRecords: true,
        advances: true,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Staff member with ID ${id} not found`);
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Snapshot full employee dossier into AuditLog for permanent history preservation
      await tx.auditLog.create({
        data: {
          entityType: 'STAFF',
          entityId: id,
          action: 'DELETE',
          previousValues: {
            ...existing,
            deletedAt: new Date().toISOString(),
          } as any,
          description: `Deleted employee profile ${existing.fullName} (${existing.employeeCode}), Department: ${existing.department}, Designation: ${existing.designation}. Complete dossier preserved in history.`,
        },
      });

      // 2. Safely clean up dependent records
      await tx.attendance.deleteMany({ where: { staffId: id } });
      await tx.staffAdvance.deleteMany({ where: { staffId: id } });
      await tx.salaryRecord.deleteMany({ where: { staffId: id } });

      // 3. Delete staff record from active database
      await tx.staff.delete({ where: { id } });

      return {
        success: true,
        message: `Employee ${existing.fullName} (${existing.employeeCode}) permanently removed from active directory and archived in Monthly History.`,
        employeeCode: existing.employeeCode,
        fullName: existing.fullName,
      };
    });
  }

  async getHistory(monthParam?: string, yearParam?: string) {
    const now = new Date();
    const month = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1;
    const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();

    const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // 1. Fetch active staff records
    const activeStaff = await this.prisma.staff.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const enrichedActive = activeStaff.map((s) => ({
      id: s.id,
      employeeCode: s.employeeCode,
      fullName: s.fullName,
      mobileNumber: s.mobileNumber,
      alternateMobileNumber: s.alternateMobileNumber,
      email: s.email,
      department: s.department,
      designation: s.designation,
      joiningDate: s.joiningDate,
      monthlySalary: Number(s.monthlySalary),
      employmentStatus: s.employmentStatus,
      bankAccountHolder: s.bankAccountHolder,
      bankAccountNumber: s.bankAccountNumber,
      bankIfscCode: s.bankIfscCode,
      address: s.address,
      emergencyContact: s.emergencyContact,
      createdAt: s.createdAt,
      isDeleted: false,
    }));

    // 2. Fetch deleted staff from AuditLog
    const deletedLogs = await this.prisma.auditLog.findMany({
      where: {
        entityType: 'STAFF',
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
      return {
        id: log.entityId,
        employeeCode: prev.employeeCode || 'EMP-ARCHIVED',
        fullName: prev.fullName || 'Archived Employee',
        mobileNumber: prev.mobileNumber || '',
        alternateMobileNumber: prev.alternateMobileNumber,
        email: prev.email,
        department: prev.department || 'General',
        designation: prev.designation || 'Staff',
        joiningDate: prev.joiningDate || log.changedAt,
        monthlySalary: Number(prev.monthlySalary || 0),
        employmentStatus: 'TERMINATED',
        bankAccountHolder: prev.bankAccountHolder,
        bankAccountNumber: prev.bankAccountNumber,
        bankIfscCode: prev.bankIfscCode,
        address: prev.address,
        emergencyContact: prev.emergencyContact,
        createdAt: prev.createdAt || log.changedAt,
        deletedAt: log.changedAt,
        isDeleted: true,
      };
    });

    const allHistory = [...enrichedActive, ...deletedItems].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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

  async getStats() {
    const [total, active, inactive, terminated, resigned, departments] = await Promise.all([
      this.prisma.staff.count(),
      this.prisma.staff.count({ where: { employmentStatus: 'ACTIVE' } }),
      this.prisma.staff.count({ where: { employmentStatus: 'INACTIVE' } }),
      this.prisma.staff.count({ where: { employmentStatus: 'TERMINATED' } }),
      this.prisma.staff.count({ where: { employmentStatus: 'RESIGNED' } }),
      this.prisma.staff.groupBy({
        by: ['department'],
        _count: { id: true },
        where: { employmentStatus: 'ACTIVE' },
      }),
    ]);

    return {
      total,
      active,
      inactive,
      terminated,
      resigned,
      departments: departments.map((d) => ({
        department: d.department,
        count: d._count.id,
      })),
    };
  }
}
