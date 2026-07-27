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
} from '@nestjs/common';
import { Request } from 'express';
import { AuthUseCases } from '../../application/use-cases/auth.use-case';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
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
}
