import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditLogsService } from './audit-logs.service';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Audit Logging')
@ApiBearerAuth('JWT-auth')
@Roles('OWNER')
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @ApiOperation({ summary: 'List immutable audit logs with entity, action, and date filters' })
  async findAll(@Query() query: QueryAuditLogDto) {
    return this.auditLogsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single audit log change payload' })
  async findOne(@Param('id') id: string) {
    return this.auditLogsService.findOne(id);
  }
}
