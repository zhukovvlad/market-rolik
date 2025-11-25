import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { OAuthDetails } from '../interfaces/oauth-details.interface';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(
        private configService: ConfigService,
        private authService: AuthService,
    ) {
        const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
        const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
        const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL');

        if (!clientID || !clientSecret || !callbackURL) {
            throw new Error('Google OAuth configuration is missing. Please check GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL.');
        }

        super({
            clientID,
            clientSecret,
            callbackURL,
            scope: ['email', 'profile'],
        });
    }

    async validate(accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback): Promise<any> {
        const { id, name, emails, photos } = profile;

        if (!emails?.[0]?.value) {
            return done(new Error('Email not provided by Google'), undefined);
        }

        // Формируем данные от Google
        const details: OAuthDetails = {
            googleId: id,
            email: emails[0].value,
            firstName: name?.givenName || undefined,
            lastName: name?.familyName || undefined,
            picture: photos?.[0]?.value,
        };

        // Вызываем сервис - он найдет/создаст юзера И выдаст токен
        const tokenResult = await this.authService.validateOAuthLogin(details);

        done(null, tokenResult);
    }
}
