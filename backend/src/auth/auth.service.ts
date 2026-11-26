import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
import { HashUtil } from '../common/utils/hash.util';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateAdmin(loginDto: LoginDto) {
    const admin = await this.prisma.admin.findFirst({
      where: {
        OR: [
          { email: loginDto.email },
          { username: loginDto.email },
        ],
      },
    });

    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('Invalid credentials or admin account inactive');
    }

    const isPasswordValid = await HashUtil.compare(loginDto.password, admin.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last_login_at timestamp
    await this.prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    const payload = {
      sub: admin.id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      },
    };
  }

  async changePassword(dto: ChangePasswordDto) {
    const admin = await this.prisma.admin.findFirst({
      where: {
        OR: [
          { username: dto.username },
          { email: dto.username },
        ],
      },
    });

    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('Admin account not found or inactive');
    }

    const isCurrentValid = await HashUtil.compare(dto.currentPassword, admin.passwordHash);
    if (!isCurrentValid) {
      throw new UnauthorizedException('Current password does not match. Please verify your current password.');
    }

    const newHash = await HashUtil.hash(dto.newPassword);

    await this.prisma.admin.update({
      where: { id: admin.id },
      data: {
        passwordHash: newHash,
        updatedAt: new Date(),
      },
    });

    this.logger.log(`Password changed successfully for admin user: ${admin.username} (${admin.role})`);

    return {
      success: true,
      message: 'Password updated successfully! You can now login with your new password.',
    };
  }

  async getAuthStatus() {
    return {
      authMode: 'rbac_two_tier',
      jwtConfigured: true,
      rbacEnabled: true,
      roles: ['OWNER', 'MANAGER'],
      status: 'ready',
    };
  }
}
