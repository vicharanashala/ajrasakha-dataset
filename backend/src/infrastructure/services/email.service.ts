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

  async sendFeedbackAcknowledgment(params: {
    to: string;
    userName: string;
    action: 'accepted' | 'rejected';
    questionText: string;
    questionId: string;
    note?: string;
  }): Promise<void> {
    const { to, userName, action, questionText, questionId, note } = params;

    const isAccepted = action === 'accepted';
    const statusLabel = isAccepted ? 'Accepted' : 'Not Accepted';
    const statusColor = isAccepted ? '#2e7d32' : '#c62828';
    const statusBg = isAccepted ? '#e8f5e9' : '#fdecea';
    const subject = isAccepted
      ? 'Your feedback was accepted 🎉'
      : 'Update on the feedback you submitted';

    const smtpFrom = this.configService.get<string>(
      'SMTP_FROM',
      'abiramk@annam.ai',
    );
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:5173',
    );
    const questionLink = `${frontendUrl.replace(/\/$/, '')}/questions/${encodeURIComponent(questionId)}`;

    // Basic HTML-escaping so user-supplied text can't break the markup
    const escapeHtml = (value: string): string =>
      value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const safeUserName = escapeHtml(userName);
    const safeQuestionText = escapeHtml(questionText);
    const safeNote = note ? escapeHtml(note) : '';

    const bodyMessage = isAccepted
      ? `Great news — the feedback you submitted has been <strong>reviewed and accepted</strong> by our team. Thank you for helping us improve the quality of our questions.`
      : `Thank you for taking the time to submit feedback. After review, our team has decided <strong>not to accept</strong> this particular submission. We appreciate you flagging it — every piece of feedback helps us improve.`;

    const noteHtml = safeNote
      ? `<tr>
         <td style="padding: 0 24px 24px;">
           <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #fff8e1; border-radius: 8px; border-left: 4px solid #ffb300;">
             <tr>
               <td style="padding: 14px 16px;">
                 <p style="margin: 0 0 6px; color: #8a6d00; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em;">Note from reviewer</p>
                 <p style="margin: 0; color: #6b5300; font-size: 14px; line-height: 1.5;">${safeNote}</p>
               </td>
             </tr>
           </table>
         </td>
       </tr>`
      : '';

    const html = `
    <div style="background: #f4f4f7; padding: 32px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.06);">
        <tr>
          <td style="padding: 28px 24px 8px;">
            <span style="display: inline-block; background: ${statusBg}; color: ${statusColor}; font-size: 12px; font-weight: 700; letter-spacing: 0.03em; text-transform: uppercase; padding: 4px 10px; border-radius: 999px;">
              Feedback ${statusLabel}
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 24px 8px;">
            <p style="margin: 0 0 4px; font-size: 18px; font-weight: 600; color: #1a1a1a;">Hi ${safeUserName},</p>
            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #444;">${bodyMessage}</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 20px 24px 8px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f8f9fa; border-radius: 8px;">
              <tr>
                <td style="padding: 16px;">
                  <p style="margin: 0 0 8px; color: #6b6b6b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em;">Question</p>
                  <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #222; font-style: italic;">"${safeQuestionText}"</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        ${noteHtml}
        <tr>
          <td style="padding: 8px 24px 28px;">
            <a href="${questionLink}" style="display: inline-block; background: #1976d2; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 10px 20px; border-radius: 6px;">
              View Question
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding: 16px 24px; border-top: 1px solid #eee;">
            <p style="margin: 0; color: #999; font-size: 12px; line-height: 1.5;">
              This is an automated message — please don't reply directly to this email.
            </p>
          </td>
        </tr>
      </table>
    </div>
  `;

    const textLines = [
      `Hi ${userName},`,
      '',
      isAccepted
        ? 'Great news — the feedback you submitted has been reviewed and accepted by our team.'
        : 'Thank you for your feedback. After review, our team has decided not to accept this particular submission.',
      '',
      `Question: "${questionText}"`,
      `Link: ${questionLink}`,
    ];

    if (note) {
      textLines.push('', `Note from reviewer: "${note}"`);
    }

    textLines.push(
      '',
      'This is an automated message. Please do not reply to this email.',
    );

    const text = textLines.join('\n');

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await this.transporter.sendMail({
        from: smtpFrom,
        to,
        subject,
        html,
        text,
      });
      this.logger.log(`Feedback acknowledgment email sent to ${to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send feedback acknowledgment to ${to}`,
        error,
      );
    }
  }
}

