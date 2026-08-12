import {
  Injectable,
  Inject,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import type { User } from '../../domain/entities/user.entity';
import { OtpService } from '../../infrastructure/services/otp.service';
import { EmailService } from '../../infrastructure/services/email.service';
import { JwtService } from '../../infrastructure/auth/jwt.service';
import { USER_REPOSITORY } from '../../domain/repositories/repository.tokens';
import { isDevAuthBypassAllowed } from '../../infrastructure/auth/dev-auth.config';
import type { UpdateProfileDto } from '../dtos/update-profile.dto';

// Fixed, idempotent dev user: POST /auth/dev-login always finds-or-creates
// this single row rather than minting a new one per call. Only ever reached
// when GOOGLE_AUTH_ENABLED=false and NODE_ENV!=='production' (see
// isDevAuthBypassAllowed), so it can't appear in staging/production data.
const DEV_USER_EMAIL = 'dev@localhost';

@Injectable()
export class AuthUseCases {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    private readonly otpService: OtpService,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signup(
    email: string,
    password: string,
  ): Promise<{ message: string; email: string }> {
    const normalizedEmail = email.toLowerCase();

    const existingUser = await this.userRepository.findByEmail(normalizedEmail);
    if (existingUser && existingUser.isVerified) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = this.hashPassword(password);
    const otp = this.otpService.generateOtp();
    const otpExpiresAt = this.otpService.getExpiry();

    if (existingUser && !existingUser.isVerified) {
      // Update existing unverified account with new OTP
      await this.userRepository.update(existingUser.id, {
        passwordHash,
        otp,
        otpExpiresAt,
      });
    } else {
      await this.userRepository.create({
        email: normalizedEmail,
        passwordHash,
      });
      // Re-fetch to get the created user (with id) so we can store OTP
      const created = await this.userRepository.findByEmail(normalizedEmail);
      if (created) {
        await this.userRepository.update(created.id, {
          otp,
          otpExpiresAt,
        });
      }
    }

    await this.emailService.sendOtp(normalizedEmail, otp, 'signup');

    return {
      message: 'Account created. Please verify your email with the OTP sent.',
      email: normalizedEmail,
    };
  }

  async verifyOtp(
    email: string,
    otp: string,
  ): Promise<{ message: string; user: Partial<User>; token?: string }> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new BadRequestException('Invalid email or OTP');
    }

    if (user.isVerified) {
      return {
        message: 'Email already verified',
        user: this.sanitizeUser(user),
      };
    }

    if (!user.otp || !user.otpExpiresAt) {
      throw new BadRequestException('No OTP found. Please request a new one.');
    }

    if (this.otpService.isExpired(user.otpExpiresAt)) {
      throw new BadRequestException(
        'OTP has expired. Please request a new one.',
      );
    }

    if (user.otp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    const updated = await this.userRepository.update(user.id, {
      isVerified: true,
      otp: undefined,
      otpExpiresAt: undefined,
    });

    // Generate JWT token for newly verified users
    const token = this.jwtService.generateToken(updated!.id, updated!.email);

    return {
      message: 'Email verified successfully',
      user: this.sanitizeUser(updated!),
      token,
    };
  }

  async resendOtp(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isVerified) {
      throw new BadRequestException('Email already verified');
    }

    const otp = this.otpService.generateOtp();
    const otpExpiresAt = this.otpService.getExpiry();

    await this.userRepository.update(user.id, {
      otp,
      otpExpiresAt,
    });

    await this.emailService.sendOtp(user.email, otp, 'signup');

    return { message: 'OTP has been resent to your email' };
  }

  async signin(
    email: string,
    password: string,
  ): Promise<{
    message: string;
    user: Partial<User>;
    token: string;
    requiresVerification?: boolean;
  }> {
    const normalizedEmail = email.toLowerCase();

    const user = await this.userRepository.findByEmail(normalizedEmail);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if user signed up with Google only (no password)
    if (user.authProvider === 'google') {
      throw new UnauthorizedException(
        'This account was created using Google Sign-In. Please use the "Continue with Google" button to sign in.',
      );
    }

    if (user.isVerified === false) {
      // Check if OTP is still valid
      if (
        user.otp &&
        user.otpExpiresAt &&
        !this.otpService.isExpired(user.otpExpiresAt)
      ) {
        throw new UnauthorizedException({
          message: 'Please verify your email before signing in',
          email: user.email,
        });
      }
      // OTP expired or doesn't exist, resend it
      const otp = this.otpService.generateOtp();
      const otpExpiresAt = this.otpService.getExpiry();
      await this.userRepository.update(user.id, { otp, otpExpiresAt });
      await this.emailService.sendOtp(user.email, otp, 'signup');
      throw new UnauthorizedException({
        message:
          'Your verification code has expired. A new OTP has been sent to your email. Please verify your email before signing in.',
        email: user.email,
      });
    }

    const passwordHash = this.hashPassword(password);
    if (user.passwordHash !== passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.jwtService.generateToken(user.id, user.email);

    return {
      message: 'Signed in successfully',
      user: this.sanitizeUser(user),
      token,
    };
  }

  private hashPassword(password: string): string {
    // NOTE: This is a basic hashing approach for the demo.
    // In production, use bcrypt or argon2.
    return createHash('sha256').update(password).digest('hex');
  }

  async getProfile(userId: string): Promise<Partial<User>> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.sanitizeUser(user);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<Partial<User>> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.userRepository.update(userId, {
      firstName: dto.firstName,
      lastName: dto.lastName,
      state: dto.state,
    });

    return this.sanitizeUser(updated!);
  }

  async changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    // This method requires userId which should come from auth context
    // For simplicity, we'll handle this via OTP-based flow
    throw new BadRequestException(
      'Use request-password-reset to change your password',
    );
  }

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findByEmail(email.toLowerCase());
    if (!user) {
      // Don't reveal that user doesn't exist
      return {
        message: 'If the email exists, a password reset OTP has been sent',
      };
    }

    if (user.authProvider === 'google') {
      throw new BadRequestException(
        'Google Sign-In accounts do not have a password. Please use "Continue with Google" to sign in.',
      );
    }

    const otp = this.otpService.generateOtp();
    const otpExpiresAt = this.otpService.getExpiry();

    await this.userRepository.update(user.id, {
      otp,
      otpExpiresAt,
    });

    await this.emailService.sendOtp(user.email, otp, 'reset');

    return {
      message: 'If the email exists, a password reset OTP has been sent',
    };
  }

  async verifyPasswordReset(
    email: string,
    otp: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findByEmail(email.toLowerCase());
    if (!user) {
      throw new BadRequestException('Invalid email or OTP');
    }

    if (user.authProvider === 'google') {
      throw new BadRequestException(
        'Google Sign-In accounts do not have a password. Please use "Continue with Google" to sign in.',
      );
    }

    if (!user.otp || !user.otpExpiresAt) {
      throw new BadRequestException('No OTP found. Please request a new one.');
    }

    if (this.otpService.isExpired(user.otpExpiresAt)) {
      throw new BadRequestException(
        'OTP has expired. Please request a new one.',
      );
    }

    if (user.otp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    const passwordHash = this.hashPassword(newPassword);

    await this.userRepository.update(user.id, {
      passwordHash,
      otp: undefined,
      otpExpiresAt: undefined,
    });

    return { message: 'Password reset successfully' };
  }

  private sanitizeUser(user: User): Partial<User> {
    const { passwordHash, otp, otpExpiresAt, ...sanitized } = user;
    return sanitized;
  }

  async generateTokenForUser(
    userId: string,
  ): Promise<{ token: string; user: Partial<User> }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const token = this.jwtService.generateToken(user.id, user.email);
    return {
      token,
      user: this.sanitizeUser(user),
    };
  }


  async devLogin(): Promise<{ token: string; user: Partial<User> }> {
    if (!isDevAuthBypassAllowed(this.configService)) {
      throw new NotFoundException();
    }

    let user = await this.userRepository.findByEmail(DEV_USER_EMAIL);
    if (!user) {
      user = await this.userRepository.create({
        email: DEV_USER_EMAIL,
        firstName: 'Dev',
        lastName: 'User',
        isVerified: true,
        authProvider: 'dev',
      });
    }

    return this.generateTokenForUser(user.id);
  }
}
