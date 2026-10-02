import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../../database/database.service.js';

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthenticatedUser = {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class AuthService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExpiresIn: JwtSignOptions['expiresIn'];
  private readonly refreshExpiresIn: JwtSignOptions['expiresIn'];

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    this.accessSecret = config.getOrThrow<string>('JWT_ACCESS_SECRET');
    this.refreshSecret = config.getOrThrow<string>('JWT_REFRESH_SECRET');
    this.accessExpiresIn = (config.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m') as JwtSignOptions['expiresIn'];
    this.refreshExpiresIn = (config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d') as JwtSignOptions['expiresIn'];
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user || !(await argon2.verify(user.password, password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.createTokens(user.id, user.email);
    const publicUser = {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return { user: publicUser, ...tokens };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; email: string; type: string }>(refreshToken, {
        secret: this.refreshSecret,
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return {
        user,
        ...(await this.createTokens(user.id, user.email)),
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async createTokens(userId: string, email: string): Promise<AuthTokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        { sub: userId, email, type: 'access' },
        { secret: this.accessSecret, expiresIn: this.accessExpiresIn },
      ),
      this.jwt.signAsync(
        { sub: userId, email, type: 'refresh' },
        { secret: this.refreshSecret, expiresIn: this.refreshExpiresIn },
      ),
    ]);

    return { accessToken, refreshToken };
  }
}
