import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Observable } from 'rxjs';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }

  handleRequest<TUser = unknown>(
    err: unknown,
    user: TUser,
    info: unknown,
    _context: ExecutionContext,
    status?: number,
  ): TUser {
    // Log the error for debugging
    if (err) {
      console.error('Google Auth Error:', (err as Error).message || err);
      console.error('Error stack:', (err as Error).stack);
    }
    if (info) {
      console.error('Google Auth Info:', (info as Error).message || info);
    }

    // If there's an error or no user, throw a meaningful exception
    if (err || !user) {
      const message =
        (err as Error)?.message ||
        (info as Error)?.message ||
        'Google authentication failed. Please try again.';

      // For unauthorized errors, throw specific message
      if (status === 401 || err instanceof UnauthorizedException) {
        throw new UnauthorizedException(message);
      }

      // For other errors, throw a more user-friendly message
      throw new UnauthorizedException(
        'Google sign-in failed. Please try again or use email/password.',
      );
    }

    return user;
  }
}
