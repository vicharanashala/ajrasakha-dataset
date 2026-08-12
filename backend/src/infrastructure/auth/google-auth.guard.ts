import {
  Injectable,
  ExecutionContext,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { isGoogleAuthEnabled } from './google-auth.config';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  canActivate(context: ExecutionContext) {
    if (!isGoogleAuthEnabled(this.configService)) {
      throw new ServiceUnavailableException(
        'Google Sign-In is disabled in this environment',
      );
    }
    return super.canActivate(context);
  }
}
