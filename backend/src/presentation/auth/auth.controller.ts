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
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() dto: SignupDto) {
    return this.authUseCases.signup(dto.email, dto.password);
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signin(@Body() dto: SigninDto) {
    return this.authUseCases.signin(dto.email, dto.password);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authUseCases.verifyOtp(dto.email, dto.otp);
  }

  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  async resendOtp(@Body() dto: ResendOtpDto) {
    return this.authUseCases.resendOtp(dto.email);
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
  @HttpCode(HttpStatus.OK)
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authUseCases.requestPasswordReset(dto.email);
  }

  @Post('verify-password-reset')
  @HttpCode(HttpStatus.OK)
  async verifyPasswordReset(@Body() dto: VerifyPasswordResetDto) {
    return this.authUseCases.verifyPasswordReset(
      dto.email,
      dto.otp,
      dto.newPassword,
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
