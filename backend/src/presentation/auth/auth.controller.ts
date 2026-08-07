import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Res,
  HttpException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthUseCases } from '../../application/use-cases/auth.use-case';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { GoogleAuthGuard } from '../../infrastructure/auth/google-auth.guard';
import { SignupDto } from '../../application/dtos/signup.dto';
import { SigninDto } from '../../application/dtos/signin.dto';
import { VerifyOtpDto } from '../../application/dtos/verify-otp.dto';
import { ResendOtpDto } from '../../application/dtos/resend-otp.dto';
import {
  UpdateProfileDto,
  RequestPasswordResetDto,
  VerifyPasswordResetDto,
} from '../../application/dtos/update-profile.dto';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authUseCases: AuthUseCases) {}

  @Post('signup')
  @HttpCode(HttpStatus.FORBIDDEN)
  async signup(@Body() _dto: SignupDto) {
    throw new HttpException(
      'Manual registration is disabled. Please use Google Sign-In.',
      HttpStatus.FORBIDDEN,
    );
  }

  @Post('signin')
  @HttpCode(HttpStatus.FORBIDDEN)
  async signin(@Body() _dto: SigninDto) {
    throw new HttpException(
      'Manual login is disabled. Please use Google Sign-In.',
      HttpStatus.FORBIDDEN,
    );
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.FORBIDDEN)
  async verifyOtp(@Body() _dto: VerifyOtpDto) {
    throw new HttpException(
      'Manual OTP verification is disabled.',
      HttpStatus.FORBIDDEN,
    );
  }

  @Post('resend-otp')
  @HttpCode(HttpStatus.FORBIDDEN)
  async resendOtp(@Body() _dto: ResendOtpDto) {
    throw new HttpException(
      'Manual OTP resend is disabled.',
      HttpStatus.FORBIDDEN,
    );
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getProfile(@Req() req: AuthenticatedRequest) {
    return this.authUseCases.getProfile(req.user.id);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authUseCases.updateProfile(req.user.id, dto);
  }

  @Post('request-password-reset')
  @HttpCode(HttpStatus.FORBIDDEN)
  async requestPasswordReset(@Body() _dto: RequestPasswordResetDto) {
    throw new HttpException(
      'Manual password reset is disabled.',
      HttpStatus.FORBIDDEN,
    );
  }

  @Post('verify-password-reset')
  @HttpCode(HttpStatus.FORBIDDEN)
  async verifyPasswordReset(@Body() _dto: VerifyPasswordResetDto) {
    throw new HttpException(
      'Manual password reset verification is disabled.',
      HttpStatus.FORBIDDEN,
    );
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // Redirects to Google OAuth
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const user = req.user;
    if (!user) {
      return res.redirect(
        `${process.env.CORS_ORIGINS?.split(',')[0] || 'http://localhost:5173'}/signin?error=google_auth_failed`,
      );
    }
    // Generate JWT token for the user
    const result = await this.authUseCases.generateTokenForUser(user.id);
    // Redirect to frontend with token
    const redirectUrl = `${process.env.CORS_ORIGINS?.split(',')[0] || 'http://localhost:5173'}/auth-success?token=${result.token}&userId=${user.id}&email=${encodeURIComponent(user.email)}`;
    return res.redirect(redirectUrl);
  }
}
