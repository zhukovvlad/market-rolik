import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { User } from '../users/user.entity';
import { RefreshToken } from './refresh-token.entity';
import { validateJwtSecret } from '../config/jwt-validation.constants';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');

        // Runtime validation using centralized validation logic
        const validationError = validateJwtSecret(secret || '');
        if (validationError) {
          throw new Error(validationError);
        }

        return {
          secret,
          signOptions: {
            expiresIn: '1h',
            audience:
              configService.get<string>('JWT_AUDIENCE') || 'market-rolik-app',
            issuer:
              configService.get<string>('JWT_ISSUER') || 'market-rolik-api',
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy],
  exports: [AuthService],
})
export class AuthModule {}
