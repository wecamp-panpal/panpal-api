import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        'http://localhost:3000/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any) => void,
  ): any {
    const { id, emails, name, photos } = profile;
    const user = {
      provider: 'google',
      providerId: id,
      email: emails && emails.length > 0 ? emails[0].value : undefined,
      name:
        (name?.givenName || '') +
        (name?.familyName ? ` ${name.familyName}` : ''),
      avatarUrl: photos && photos.length > 0 ? photos[0].value : undefined,
      accessToken,
      refreshToken,
    };
    done(null, user);
  }
}
