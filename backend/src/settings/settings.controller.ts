import { Controller, Get, Patch, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateHotelSettingDto } from './dto/update-settings.dto';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Hotel Settings')
@ApiBearerAuth('JWT-auth')
@Roles('OWNER')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get singleton hotel operational profile and settings' })
  async getSettings() {
    return this.settingsService.getSettings();
  }

  @Patch()
  @ApiOperation({ summary: 'Update singleton hotel settings' })
  async updateSettings(@Body() dto: UpdateHotelSettingDto) {
    return this.settingsService.updateSettings(dto);
  }

  @Get('health')
  @ApiOperation({ summary: 'Get live infrastructure health, database latency, and backup status' })
  async getSystemHealth() {
    return this.settingsService.getSystemHealth();
  }

  @Get('backup')
  @ApiOperation({ summary: 'Generate and download full on-demand database snapshot backup' })
  async createDatabaseBackup() {
    return this.settingsService.createDatabaseBackup();
  }
}
