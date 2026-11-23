import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CheckInCheckOutService } from './check-in-out.service';
import { RelocateRoomDto } from './dto/relocate-room.dto';

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
  @ApiOperation({ summary: 'Get all currently active checked-in stays' })
  async getActiveStays() {
    return this.staysService.getActiveStays();
  }

  @Post(':id/check-in')
  @ApiOperation({ summary: 'Perform check-in action (marks booking CHECKED_IN, room OCCUPIED)' })
  async performCheckIn(@Param('id') id: string) {
    return this.staysService.performCheckIn(id);
  }

  @Post(':id/check-out')
  @ApiOperation({ summary: 'Perform check-out action (marks booking CHECKED_OUT, room AVAILABLE)' })
  async performCheckOut(@Param('id') id: string) {
    return this.staysService.performCheckOut(id);
  }

  @Post(':id/relocate')
  @ApiOperation({ summary: 'Relocate guest to a different room' })
  async relocateRoom(@Param('id') id: string, @Body() dto: RelocateRoomDto) {
    return this.staysService.relocateRoom(id, dto);
  }
}
