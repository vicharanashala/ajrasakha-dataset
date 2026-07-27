import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from '../../domain/repositories/user.repository.interface';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') || '',
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || '',
      callbackURL:
        configService.get<string>('GOOGLE_CALLBACK_URL') ||
        '/api/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, emails, photos } = profile;

    if (!emails || !emails.length) {
      return done(new UnauthorizedException('No email provided'), null);
    }

    const email = emails[0].value;
    const firstName = profile.name?.givenName || '';
    const lastName = profile.name?.familyName || '';
    const avatar = photos?.[0]?.value || '';

    // Find or create user
    let user = await this.userRepository.findByEmail(email);

    if (!user) {
      // Create new user from Google OAuth
      // Note: passwordHash is required, but for Google users we set it to empty
      // In production, you might want to add a flag to indicate password-less auth
      user = await this.userRepository.create({
        email,
        passwordHash: '', // Google users don't need password
        googleId: id,
        firstName,
        lastName,
        avatar,
        isVerified: true, // Google users are pre-verified
      });
    } else {
      // Update existing user with Google info if needed
      const updates: Partial<typeof user> = {};
      if (!user.googleId) {
        updates.googleId = id;
      }
      if (!user.avatar && avatar) {
        updates.avatar = avatar;
      }
      if (firstName && !user.firstName) {
        updates.firstName = firstName;
      }
      if (lastName && !user.lastName) {
        updates.lastName = lastName;
      }
      if (Object.keys(updates).length > 0) {
        user = (await this.userRepository.update(user.id, updates)) || user;
      }
    }

    const userPayload = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isVerified: user.isVerified,
    };

    done(null, userPayload);
  }
}
