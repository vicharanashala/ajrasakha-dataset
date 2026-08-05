import { IsIn, IsOptional, IsArray, IsString, ArrayNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class FilterOptionsQueryDto {
  @IsOptional()
  @IsIn(['district', 'crop', 'domain'], {
    message: 'type must be one of: district, crop, domain',
  })
  type?: 'district' | 'crop' | 'domain';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayNotEmpty({ message: 'state array must not be empty if provided' })
  @Transform(({ value }) => normalizeArray(value))
  state?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayNotEmpty({ message: 'district array must not be empty if provided' })
  @Transform(({ value }) => normalizeArray(value))
  district?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayNotEmpty({ message: 'crop array must not be empty if provided' })
  @Transform(({ value }) => normalizeArray(value))
  crop?: string[];
}

/**
 * Normalize a value that may be a single string, comma-separated string,
 * or array of strings into a clean string array with no empty values.
 */
export function normalizeArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((v) => String(v).trim())
      .filter(Boolean);
  }
  return String(value)
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}