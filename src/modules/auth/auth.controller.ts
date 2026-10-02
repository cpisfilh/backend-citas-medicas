import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(loginDto.email, loginDto.password);

    this.setAuthCookies(response, result.accessToken, result.refreshToken);

    return { user: result.user };
  }

  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.[REFRESH_COOKIE];

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const result = await this.authService.refresh(refreshToken);

    this.setAuthCookies(response, result.accessToken, result.refreshToken);

    return { user: result.user };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(ACCESS_COOKIE, this.cookieOptions('/'));
    response.clearCookie(REFRESH_COOKIE, this.cookieOptions('/auth/refresh'));

    return { message: 'Logged out successfully' };
  }

  private setAuthCookies(
    response: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    response.cookie(ACCESS_COOKIE, accessToken, this.cookieOptions('/'));
    response.cookie(REFRESH_COOKIE, refreshToken, this.cookieOptions('/auth/refresh', 7 * 24 * 60 * 60 * 1000));
  }

  private cookieOptions(path: string, maxAge?: number) {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path,
      ...(maxAge === undefined ? {} : { maxAge }),
    };
  }
}
