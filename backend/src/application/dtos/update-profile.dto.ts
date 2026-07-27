import { IsString, IsOptional, IsEmail } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  state?: string;
}

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  newPassword: string;
}

export class RequestPasswordResetDto {
  @IsEmail()
  email: string;
}

export class VerifyPasswordResetDto {
  @IsEmail()
  email: string;

  @IsString()
  otp: string;

  @IsString()
  newPassword: string;
}
