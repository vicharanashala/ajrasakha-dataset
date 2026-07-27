import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  private transporter: any;

  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    const emailUser = this.configService.get<string>('EMAIL_USER');
    const emailPass = this.configService.get<string>('EMAIL_PASS');

    // Zoho SMTP configuration
    this.transporter = nodemailer.createTransport({
      host: 'smtp.zoho.in',
      port: 465,
      secure: true,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });
  }

  async sendOtp(
    email: string,
    otp: string,
    type: 'signup' | 'reset' = 'signup',
  ): Promise<void> {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    const smtpFrom = this.configService.get<string>(
      'SMTP_FROM',
      'abiramk@annam.ai',
    );

    // In development mode, log the OTP to console instead of sending email
    if (nodeEnv === 'development') {
      this.logger.log(`[DEV EMAIL] To: ${email} | OTP: ${otp} | Type: ${type}`);
      console.log(`\n📧 ===== DEV EMAIL (OTP) =====`);
      console.log(`To: ${email}`);
      console.log(`Subject: Your verification code`);
      console.log(`Type: ${type === 'signup' ? 'Signup' : 'Password Reset'}`);
      console.log(`Message: Your OTP is ${otp}. It expires in 10 minutes.`);
      console.log(`=========================\n`);
      return;
    }

    // In production, send actual email
    const subject =
      type === 'signup'
        ? 'Your Ajrasakha Dataset verification code'
        : 'Your Ajrasakha Dataset password reset code';

    const message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2e7d32;">Ajrasakha Dataset</h2>
        <p>Your verification code is: <strong style="font-size: 24px; color: #1565c0;">${otp}</strong></p>
        <p>This code will expire in 10 minutes.</p>
        <p style="color: #666; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
      </div>
    `;

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await this.transporter.sendMail({
        from: smtpFrom,
        to: email,
        subject,
        html: message,
      });
      this.logger.log(`Email sent successfully to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${email}`, error);
      throw error;
    }
  }

  async sendPasswordResetOtp(email: string, otp: string): Promise<void> {
    return this.sendOtp(email, otp, 'reset');
  }
}
