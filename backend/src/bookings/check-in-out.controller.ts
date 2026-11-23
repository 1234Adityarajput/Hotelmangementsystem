import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CheckInCheckOutService } from './check-in-out.service';
import { RelocateRoomDto } from './dto/relocate-room.dto';
import { PerformCheckInDto } from './dto/check-in.dto';
import { PerformCheckOutDto } from './dto/check-out.dto';

@ApiTags('Check-In & Check-Out Stays')
@ApiBearerAuth('JWT-auth')
@Controller('stays')
export class CheckInCheckOutController {
  constructor(private readonly staysService: CheckInCheckOutService) {}

  @Get('today-check-ins')
  @ApiOperation({ summary: 'Get list of bookings expected to check in today' })
  async getTodayCheckIns() {
    return this.staysService.getTodayCheckIns();
  }

  @Get('today-check-outs')
  @ApiOperation({ summary: 'Get list of bookings expected to check out today' })
  async getTodayCheckOuts() {
    return this.staysService.getTodayCheckOuts();
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all currently active in-house checked-in stays' })
  async getActiveStays() {
    return this.staysService.getActiveStays();
  }

  @Get('completed')
  @ApiOperation({ summary: 'Get digital archive of all completed and checked-out stays' })
  async getCompletedStays(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.staysService.getCompletedStays({ search, page, limit });
  }

  @Get(':id/checkout-summary')
  @ApiOperation({ summary: 'Calculate and preview checkout bill folio breakdown before settlement' })
  async getCheckoutSummary(@Param('id') id: string) {
    return this.staysService.getCheckoutSummary(id);
  }

  @Post(':id/check-in')
  @ApiOperation({ summary: 'Perform check-in action with check-in time and optional advance payment' })
  async performCheckIn(@Param('id') id: string, @Body() dto?: PerformCheckInDto) {
    return this.staysService.performCheckIn(id, dto);
  }

  @Post(':id/check-out')
  @ApiOperation({ summary: 'Perform digital check-out, record settlement payment and finalize invoice' })
  async performCheckOut(@Param('id') id: string, @Body() dto?: PerformCheckOutDto) {
    return this.staysService.performCheckOut(id, dto);
  }

  @Post(':id/relocate')
  @ApiOperation({ summary: 'Relocate guest to a different room' })
  async relocateRoom(@Param('id') id: string, @Body() dto: RelocateRoomDto) {
    return this.staysService.relocateRoom(id, dto);
  }
}
