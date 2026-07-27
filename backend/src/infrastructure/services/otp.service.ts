import { Injectable } from '@nestjs/common';

@Injectable()
export class OtpService {
  private readonly OTP_LENGTH = 6;
  private readonly OTP_TTL_MINUTES = 10;

  generateOtp(): string {
    const min = Math.pow(10, this.OTP_LENGTH - 1);
    const max = Math.pow(10, this.OTP_LENGTH) - 1;
    return Math.floor(min + Math.random() * (max - min + 1)).toString();
  }

  getExpiry(): Date {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_TTL_MINUTES);
    return expiresAt;
  }

  isExpired(expiresAt: Date | undefined): boolean {
    if (!expiresAt) return true;
    return new Date() > new Date(expiresAt);
  }
}
