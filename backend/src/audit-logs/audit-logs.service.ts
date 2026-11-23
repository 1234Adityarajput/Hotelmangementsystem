import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryAuditLogDto) {
    const { entityType, action, entityId, search, startDate, endDate, page = 1, limit = 25 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (entityType && entityType !== 'ALL') where.entityType = entityType;
    if (action && action !== ('ALL' as any)) where.action = action;
    if (entityId) where.entityId = entityId;

    if (startDate && endDate) {
      where.changedAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (search && search.trim()) {
      where.description = { contains: search.trim(), mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { changedAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
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
    const log = await this.prisma.auditLog.findUnique({
      where: { id },
    });

    if (!log) {
      throw new NotFoundException(`Audit log entry with ID ${id} not found`);
    }

    return log;
  }
}
