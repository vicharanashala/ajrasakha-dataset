import { ConfigService } from '@nestjs/config';


export function isGoogleAuthEnabled(configService: ConfigService): boolean {
  return configService.get<string>('GOOGLE_AUTH_ENABLED') !== 'false';
}
