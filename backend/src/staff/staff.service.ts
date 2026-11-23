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
  constructor(private readonly prisma: PrismaService) {}

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

    const employeeCode = await this.generateEmployeeCode();

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
        designation: dto.designation,
        department: dto.department,
        joiningDate: new Date(dto.joiningDate),
        monthlySalary: dto.monthlySalary,
        bankAccountHolder: dto.bankAccountHolder,
        bankAccountNumber: dto.bankAccountNumber,
        bankIfscCode: dto.bankIfscCode,
        notes: dto.notes,
        employmentStatus: 'ACTIVE',
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
        designation: dto.designation,
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
        _count: {
          select: { attendanceRecords: true, salaryRecords: true, advances: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Staff member with ID ${id} not found`);
    }

    // If records exist, mark TERMINATED instead of hard delete to preserve referential integrity
    if (
      existing._count.attendanceRecords > 0 ||
      existing._count.salaryRecords > 0 ||
      existing._count.advances > 0
    ) {
      const updated = await this.prisma.staff.update({
        where: { id },
        data: { employmentStatus: 'TERMINATED' },
      });

      await this.prisma.auditLog.create({
        data: {
          entityType: 'STAFF',
          entityId: id,
          action: 'UPDATE',
          previousValues: { employmentStatus: existing.employmentStatus },
          newValues: { employmentStatus: 'TERMINATED' },
          description: `Archived/Terminated employee ${existing.fullName} (${existing.employeeCode}) due to existing linked payroll/attendance records`,
        },
      });

      return {
        message: `Employee ${existing.fullName} marked as TERMINATED (preserved attendance and payroll audit history)`,
        staff: updated,
      };
    }

    await this.prisma.staff.delete({ where: { id } });

    await this.prisma.auditLog.create({
      data: {
        entityType: 'STAFF',
        entityId: id,
        action: 'DELETE',
        previousValues: { employeeCode: existing.employeeCode, fullName: existing.fullName },
        description: `Deleted employee profile ${existing.fullName} (${existing.employeeCode})`,
      },
    });

    return { message: `Employee ${existing.fullName} deleted successfully` };
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
