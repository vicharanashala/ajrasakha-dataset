import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import jwt, { SignOptions } from 'jsonwebtoken';

export interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtService {
  private readonly secret: string;
  private readonly expiresIn: string | number;

  constructor(private readonly configService: ConfigService) {
    this.secret =
      this.configService.get<string>('JWT_SECRET') ||
      'your-super-secret-jwt-key-change-in-production';
    this.expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '7d';
  }

  generateToken(userId: string, email: string): string {
    const payload: JwtPayload = {
      sub: userId,
      email: email,
    };

    const options: SignOptions = {
      expiresIn: this.expiresIn as jwt.SignOptions['expiresIn'],
    };

    return jwt.sign(payload, this.secret, options);
  }

  verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.secret) as JwtPayload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  decodeToken(token: string): JwtPayload | null {
    return jwt.decode(token) as JwtPayload;
  }
}
