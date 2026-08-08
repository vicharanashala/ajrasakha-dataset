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
    const statusBgAccent = isAccepted ? '#4caf50' : '#ef5350';
    const subject = isAccepted
      ? 'Your feedback was accepted — Ajrasakha Dataset'
      : 'Update on your feedback — Ajrasakha Dataset';

    const smtpFrom = this.configService.get<string>(
      'SMTP_FROM',
      'abiramk@annam.ai',
    );
    const frontendUrl = this.configService.get(
      'FRONTEND_URL',
      'http://localhost:5173',
    );
    const baseUrl = String(frontendUrl).replace(/\/$/, '');
    const logoUrl = `${baseUrl}/logo.png`;
    const annamLogoUrl = `${baseUrl}/annam-logo.png`;
    const questionLink = `${baseUrl}/questions/${encodeURIComponent(questionId)}`;

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
      ? `Great news — the feedback you submitted has been reviewed and accepted by our team. Thank you for helping us improve the quality of our agricultural questions.`
      : `Thank you for taking the time to submit feedback. After review, our team has decided not to accept this particular submission. We appreciate you flagging it — every piece of feedback helps us improve the dataset.`;

    const noteHtml = safeNote
      ? `
      <tr>
        <td style="padding: 0 32px 24px 32px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
                 style="background-color:#fffdf5;border:1px solid #f0e6c8;border-radius:8px;">
            <tr>
              <td style="padding:16px 20px;font-family:Arial,Helvetica,sans-serif;">
                <p style="margin:0 0 6px 0;font-size:12px;font-weight:bold;letter-spacing:0.5px;text-transform:uppercase;color:#8a7330;">
                  Note from reviewer
                </p>
                <p style="margin:0;font-size:14px;line-height:22px;color:#4a4a4a;">
                  ${safeNote}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
      : '';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f4f5f7;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600"
               style="width:100%;max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">

          <!-- Header -->
          <tr>
            <td style="padding:24px 32px;border-bottom:1px solid #eeeeee;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td width="44" valign="middle">
                    <img src="${logoUrl}" alt="Ajrasakha" width="40" height="40" style="display:block;border:0;border-radius:8px;" />
                  </td>
                  <td valign="middle" style="padding-left:12px;font-family:Arial,Helvetica,sans-serif;">
                    <p style="margin:0;font-size:16px;font-weight:bold;color:#1a1a1a;">Ajrasakha Dataset</p>
                    <p style="margin:2px 0 0 0;font-size:12px;color:#6b7280;">Agricultural Question Collection</p>
                  </td>
                  <td width="90" align="right" valign="middle">
                    <img src="${annamLogoUrl}" alt="Annam.Ai" height="28" style="display:block;border:0;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Status badge -->
          <tr>
            <td style="padding:28px 32px 8px 32px;font-family:Arial,Helvetica,sans-serif;">
              <span style="display:inline-block;padding:6px 14px;border-radius:999px;font-size:13px;font-weight:bold;
                           color:${statusColor};background-color:${statusBg};border:1px solid ${statusBgAccent};">
                Feedback ${statusLabel}
              </span>
            </td>
          </tr>

          <!-- Greeting + message -->
          <tr>
            <td style="padding:12px 32px 20px 32px;font-family:Arial,Helvetica,sans-serif;">
              <p style="margin:0 0 12px 0;font-size:18px;font-weight:bold;color:#1a1a1a;">Hi ${safeUserName},</p>
              <p style="margin:0;font-size:15px;line-height:24px;color:#4a4a4a;">${bodyMessage}</p>
            </td>
          </tr>

          <!-- Question -->
          <tr>
            <td style="padding:0 32px 24px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
                     style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
                <tr>
                  <td style="padding:16px 20px;font-family:Arial,Helvetica,sans-serif;">
                    <p style="margin:0 0 6px 0;font-size:12px;font-weight:bold;letter-spacing:0.5px;text-transform:uppercase;color:#6b7280;">
                      Question
                    </p>
                    <p style="margin:0;font-size:15px;line-height:23px;color:#1a1a1a;">"${safeQuestionText}"</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${noteHtml}

          <!-- CTA -->
          <tr>
            <td style="padding:0 32px 32px 32px;font-family:Arial,Helvetica,sans-serif;">
              <a href="${questionLink}"
                 style="display:inline-block;padding:12px 24px;border-radius:8px;background-color:#2e7d32;color:#ffffff;
                        font-size:14px;font-weight:bold;text-decoration:none;">
                View Question
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;background-color:#fafafa;border-top:1px solid #eeeeee;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="font-family:Arial,Helvetica,sans-serif;">
                    <p style="margin:0 0 4px 0;font-size:12px;line-height:18px;color:#6b7280;">
                      This is an automated message from Ajrasakha Dataset powered by Annam.Ai.
                    </p>
                    <p style="margin:0;font-size:12px;line-height:18px;color:#9ca3af;">
                      Please do not reply directly to this email.
                    </p>
                  </td>
                  <td width="80" align="right" valign="middle">
                    <img src="${annamLogoUrl}" alt="Annam.Ai" height="22" style="display:block;border:0;opacity:0.7;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const textLines = [
      `Hi ${userName},`,
      '',
      isAccepted
        ? 'Great news — the feedback you submitted has been reviewed and accepted by our team. Thank you for helping us improve our agricultural questions.'
        : 'Thank you for your feedback. After review, our team has decided not to accept this particular submission. We appreciate you flagging it.',
      '',
      `Question: "${questionText}"`,
      `Link: ${questionLink}`,
      '',
      '—',
      'Ajrasakha Dataset powered by Annam.Ai',
      'This is an automated message. Please do not reply to this email.',
    ];

    if (note) {
      textLines.splice(6, 0, '', `Note from reviewer: "${note}"`);
    }

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

