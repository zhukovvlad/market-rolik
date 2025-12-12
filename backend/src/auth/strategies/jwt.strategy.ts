import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Try to extract from cookie first
        (request: { cookies?: Record<string, string> }): string | null => {
          const token = request?.cookies?.['access_token'];
          return typeof token === 'string' ? token : null;
        },
        // Fallback to Authorization header for backward compatibility
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
      audience: configService.get<string>('JWT_AUDIENCE') || 'market-rolik-app',
      issuer: configService.get<string>('JWT_ISSUER') || 'market-rolik-api',
    });
  }

  validate(payload: JwtPayload): { id: string; email: string; role?: string } {
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
