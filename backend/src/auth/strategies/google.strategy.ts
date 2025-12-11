import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { OAuthDetails } from '../interfaces/oauth-details.interface';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    private readonly logger = new Logger(GoogleStrategy.name);

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
        
        this.logger.log('GoogleStrategy initialized');
    }

    async validate(accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback): Promise<any> {
        try {
            this.logger.log('OAuth validate called for Google profile');
            
            const { id, name, emails, photos } = profile;

            if (!emails?.[0]?.value) {
                this.logger.error('Email not provided by Google');
                return done(new Error('Email not provided by Google'), undefined);
            }

            this.logger.log('Processing OAuth login for verified email');

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
            
            this.logger.log('Successfully generated tokens for authenticated user');

            done(null, tokenResult);
        } catch (error) {
            this.logger.error('Error in validate method:', error);
            done(error, undefined);
        }
    }
}
