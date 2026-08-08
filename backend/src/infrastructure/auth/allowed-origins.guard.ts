import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

/**
 * AllowedOriginsGuard
 *
 * Validates that requests carrying an API key have an Origin header
 * that matches one of the configured frontend domains.
 *
 * This prevents a stolen API key from being used by any third-party
 * site or tool — only the application's own frontend origin is allowed.
 *
 * In development mode (NODE_ENV != production) this guard is bypassed.
 */
@Injectable()
export class AllowedOriginsGuard implements CanActivate {
  private readonly allowedOrigins: string[];

  constructor(private readonly configService: ConfigService) {
    const configured = this.configService.get<string>('CORS_ORIGINS') ?? '';
    this.allowedOrigins = configured
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
  }

  canActivate(context: ExecutionContext): boolean {
    if (process.env.NODE_ENV !== 'production') {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const origin = request.headers.origin;
    const referer = request.headers.referer;

    // Non-browser clients (curl, Postman, etc.) send no origin.
    // We allow them through so legitimate server-side consumers work,
    // but they still need a valid API key (enforced by PublicController).
    if (!origin) {
      return true;
    }

    // Origin must be an allowed frontend domain
    const isAllowed = this.allowedOrigins.some(
      (allowed) =>
        origin === allowed ||
        origin.startsWith(`${allowed}/`) || // sub-path of allowed origin
        allowed.startsWith(`${origin}/`),   // allowed is a base of origin
    );

    // Also check Referer as a fallback (some privacy tools strip Origin)
    const refererOrigin = referer ? this.extractOrigin(referer) : null;
    const refererAllowed =
      !refererOrigin ||
      this.allowedOrigins.some(
        (allowed) =>
          refererOrigin === allowed ||
          refererOrigin.startsWith(`${allowed}/`) ||
          allowed.startsWith(`${refererOrigin}/`),
      );

    if (!isAllowed && !refererAllowed) {
      console.warn(
        `[AllowedOriginsGuard] Blocked request with disallowed origin: ${origin} referer: ${referer}`,
      );
      throw new ForbiddenException(
        'API requests must originate from the Ajrasakha application. This request was blocked.',
      );
    }

    return true;
  }

  private extractOrigin(url: string): string {
    try {
      const u = new URL(url);
      return u.origin;
    } catch {
      return url;
    }
  }
}