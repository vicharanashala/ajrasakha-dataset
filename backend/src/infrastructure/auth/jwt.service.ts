import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import jwt, { SignOptions } from 'jsonwebtoken';

export interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExpiresIn: string | number;
  private readonly refreshExpiresIn: string | number;

  constructor(private readonly configService: ConfigService) {
    this.accessSecret =
      this.configService.get<string>('JWT_SECRET') ||
      'your-super-secret-jwt-key-change-in-production';
    this.refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      this.accessSecret + '_refresh';
    this.accessExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '5s';
    this.refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';
  }

  generateAccessToken(userId: string, email: string): string {
    const payload: JwtPayload = {
      sub: userId,
      email: email,
    };
    const options: SignOptions = {
      expiresIn: this.accessExpiresIn as jwt.SignOptions['expiresIn'],
    };
    return jwt.sign(payload, this.accessSecret, options);
  }

  generateRefreshToken(userId: string, email: string): string {
    const payload: JwtPayload = {
      sub: userId,
      email: email,
    };
    const options: SignOptions = {
      expiresIn: this.refreshExpiresIn as jwt.SignOptions['expiresIn'],
    };
    return jwt.sign(payload, this.refreshSecret, options);
  }

  verifyAccessToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.accessSecret) as JwtPayload;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  verifyRefreshToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.refreshSecret) as JwtPayload;
    } catch (e: any) {
      throw new UnauthorizedException('JWT verify error: ' + e.message);
    }
  }

  decodeToken(token: string): JwtPayload | null {
    return jwt.decode(token) as JwtPayload;
  }
}
