import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendOtp(email: string, otp: string): Promise<void> {
    // NOTE: This is a mock email service. In production, integrate with
    // a real email provider (e.g., SendGrid, AWS SES, Nodemailer, etc.)
    this.logger.log(`[MOCK EMAIL] To: ${email} | OTP: ${otp}`);
    console.log(`\n📧 ===== MOCK EMAIL =====`);
    console.log(`To: ${email}`);
    console.log(`Subject: Your verification code`);
    console.log(`Message: Your OTP is ${otp}. It expires in 10 minutes.`);
    console.log(`=========================\n`);
    return Promise.resolve();
  }
}