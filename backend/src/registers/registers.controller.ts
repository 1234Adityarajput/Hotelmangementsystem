import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RegistersService } from './registers.service';
import { QueryRegisterDto } from './dto/query-register.dto';

@ApiTags('Digital Registers')
@ApiBearerAuth('JWT-auth')
@Controller('registers')
export class RegistersController {
  constructor(private readonly registersService: RegistersService) {}

  @Get()
  @ApiOperation({ summary: 'Query digital registers (read-only audit views over database entities)' })
  async getRegisterData(@Query() query: QueryRegisterDto) {
    return this.registersService.getRegisterData(query);
  }
}
