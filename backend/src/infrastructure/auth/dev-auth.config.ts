import { ConfigService } from '@nestjs/config';
import { isGoogleAuthEnabled } from './google-auth.config';


export function isDevAuthBypassAllowed(configService: ConfigService): boolean {
  return (
    !isGoogleAuthEnabled(configService) &&
    configService.get<string>('NODE_ENV') !== 'production'
  );
}
