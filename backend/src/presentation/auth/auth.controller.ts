import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  HttpCode,
  HttpStatus,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthUseCases } from '../../application/use-cases/auth.use-case';
import { SignupDto } from '../../application/dtos/signup.dto';
import { SigninDto } from '../../application/dtos/signin.dto';
import { VerifyOtpDto } from '../../application/dtos/verify-otp.dto';
import { ResendOtpDto } from '../../application/dtos/resend-otp.dto';
import {
  UpdateProfileDto,
  ChangePasswordDto,
  RequestPasswordResetDto,
  VerifyPasswordResetDto,
} from '../../application/dtos/update-profile.dto';

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
  @HttpCode(HttpStatus.OK)
  async getProfile(@Headers('x-user-id') userId: string) {
    if (!userId) {
      throw new UnauthorizedException('User ID required');
    }
    return this.authUseCases.getProfile(userId);
  }

  @Put('profile')
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @Headers('x-user-id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    if (!userId) {
      throw new UnauthorizedException('User ID required');
    }
    return this.authUseCases.updateProfile(userId, dto);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(@Body() dto: ChangePasswordDto) {
    return this.authUseCases.changePassword(
      dto.currentPassword,
      dto.newPassword,
    );
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
