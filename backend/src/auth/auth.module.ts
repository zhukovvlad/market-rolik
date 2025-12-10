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

@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
        PassportModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => {
                const secret = configService.get<string>('JWT_SECRET');
                
                // Additional runtime validation for JWT_SECRET
                if (!secret) {
                    throw new Error('JWT_SECRET is not defined in environment variables');
                }
                
                if (secret.length < 32) {
                    throw new Error('JWT_SECRET must be at least 32 characters long for security');
                }
                
                // Reject common placeholder patterns
                const placeholders = [
                    'your-secret',
                    'change-me',
                    'changeme',
                    'secret-key',
                    'jwt-secret',
                    'CHANGE_ME',
                ];
                
                const isPlaceholder = placeholders.some(placeholder => 
                    secret.toLowerCase().includes(placeholder.toLowerCase())
                );
                
                if (isPlaceholder) {
                    throw new Error(
                        'JWT_SECRET appears to be a placeholder value. ' +
                        'Generate a cryptographically secure secret using: ' +
                        'node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'base64\'))"'
                    );
                }
                
                return {
                    secret,
                    signOptions: { expiresIn: '7d' },
                };
            },
            inject: [ConfigService],
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy, GoogleStrategy],
    exports: [AuthService],
})
export class AuthModule { }
