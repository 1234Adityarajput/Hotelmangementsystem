import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
import { HashUtil } from '../common/utils/hash.util';
import { LoginDto } from './dto/login.dto';

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
    };

    return {
      accessToken: this.jwtService.sign(payload),
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
      },
    };
  }

  async getAuthStatus() {
    return {
      authMode: 'single_admin',
      jwtConfigured: true,
      rbacEnabled: false,
      status: 'ready',
    };
  }
}
