import { Injectable, UnauthorizedException, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { User, UserRole } from '../users/user.entity';
import { RefreshToken } from './refresh-token.entity';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { OAuthDetails } from './interfaces/oauth-details.interface';

@Injectable()
export class AuthService {
    private readonly REFRESH_TOKEN_EXPIRY_DAYS = 7;

    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(RefreshToken)
        private refreshTokenRepository: Repository<RefreshToken>,
        private jwtService: JwtService,
    ) { }

    // --- ЛОГИКА ДЛЯ СОЦСЕТЕЙ (Google/GitHub/Yandex) ---
    async validateOAuthLogin(details: OAuthDetails) {
        const { email, firstName, lastName, picture, googleId } = details;

        if (!email) {
            throw new BadRequestException('Email is required from OAuth provider');
        }

        // 1. Ищем пользователя по email
        let user = await this.usersRepository.findOne({ where: { email } });

        // 2. Если нет - создаем нового (без пароля)
        if (!user) {
            user = this.usersRepository.create({
                email,
                firstName: firstName || '',
                lastName: lastName || '',
                avatarUrl: picture || '',
                googleId: googleId || null,
                role: UserRole.USER,
                creditsBalance: 10, // Бонус за регистрацию
            });
            user = await this.usersRepository.save(user);
        } else {
            // Обновляем данные, если они изменились
            let changed = false;
            if (firstName && user.firstName !== firstName) { user.firstName = firstName; changed = true; }
            if (lastName && user.lastName !== lastName) { user.lastName = lastName; changed = true; }
            if (picture && user.avatarUrl !== picture) { user.avatarUrl = picture; changed = true; }
            if (googleId && !user.googleId) { user.googleId = googleId; changed = true; }

            if (changed) {
                await this.usersRepository.save(user);
            }
        }

        // 3. Выдаем токен (возвращаем user для контроллера)
        return this.generateTokenPair(user);
    }

    // --- ЛОГИКА ДЛЯ EMAIL/PASSWORD ---
    async register(email: string, password: string) {
        const existing = await this.usersRepository.findOne({ where: { email } });
        if (existing) throw new ConflictException('User already exists');

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const user = this.usersRepository.create({
            email,
            passwordHash: hash,
            creditsBalance: 10,
            role: UserRole.USER,
        });
        await this.usersRepository.save(user);
        return this.generateTokenPair(user);
    }

    async login(email: string, password: string) {
        const user = await this.usersRepository.findOne({
            where: { email },
            select: ['id', 'email', 'passwordHash', 'role', 'avatarUrl', 'creditsBalance', 'firstName', 'lastName']
        });

        // Если юзер есть, но у него нет пароля (он регался через Google)
        if (!user || !user.passwordHash) {
            throw new UnauthorizedException('Invalid credentials or use Social Login');
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) throw new UnauthorizedException('Invalid credentials');

        return this.generateTokenPair(user);
    }

    /**
     * Generates both access token and refresh token for a user
     */
    async generateTokenPair(user: User) {
        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        const accessToken = this.jwtService.sign(payload);
        const refreshToken = await this.createRefreshToken(user.id);

        return {
            access_token: accessToken,
            refresh_token: refreshToken,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                avatarUrl: user.avatarUrl,
                credits: user.creditsBalance,
                firstName: user.firstName,
                lastName: user.lastName,
            }
        };
    }

    /**
     * Creates a new refresh token for a user
     * Generates a cryptographically secure random token and stores its hash
     */
    private async createRefreshToken(userId: string): Promise<string> {
        // Generate a secure random token (32 bytes = 64 hex characters)
        const token = crypto.randomBytes(32).toString('hex');
        
        // Hash the token before storing (similar to password hashing)
        const tokenHash = await bcrypt.hash(token, 10);

        // Calculate expiry date (7 days from now)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + this.REFRESH_TOKEN_EXPIRY_DAYS);

        // Store the hashed token in database
        const refreshToken = this.refreshTokenRepository.create({
            tokenHash,
            userId,
            expiresAt,
        });
        await this.refreshTokenRepository.save(refreshToken);

        // Return the plain token to send to the client
        return token;
    }

    /**
     * Validates a refresh token and returns new access + refresh tokens (rotation)
     * Implements token rotation: old token is revoked, new one is issued
     */
    async refreshTokens(refreshToken: string) {
        // Find all non-expired tokens (we need to check all to find matching hash)
        const storedTokens = await this.refreshTokenRepository.find({
            where: {
                expiresAt: LessThan(new Date()) ? undefined : undefined, // Not expired
            },
            relations: ['user'],
        });

        // Check each token hash to find a match
        let matchedToken: RefreshToken | null = null;
        for (const stored of storedTokens) {
            if (stored.isExpired()) continue;
            
            const isValid = await bcrypt.compare(refreshToken, stored.tokenHash);
            if (isValid) {
                matchedToken = stored;
                break;
            }
        }

        if (!matchedToken) {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }

        // Revoke the old token (rotation)
        await this.revokeRefreshToken(matchedToken.id);

        // Generate new token pair
        return this.generateTokenPair(matchedToken.user);
    }

    /**
     * Revokes a refresh token by deleting it from the database
     */
    async revokeRefreshToken(tokenId: string): Promise<void> {
        await this.refreshTokenRepository.delete(tokenId);
    }

    /**
     * Revokes all refresh tokens for a specific user
     * Useful for logout-all-devices functionality
     */
    async revokeAllUserTokens(userId: string): Promise<void> {
        await this.refreshTokenRepository.delete({ userId });
    }

    /**
     * Cleanup expired tokens (should be run periodically via cron job)
     */
    async cleanupExpiredTokens(): Promise<void> {
        await this.refreshTokenRepository.delete({
            expiresAt: LessThan(new Date()),
        });
    }

    // Получить пользователя по ID (для /auth/me endpoint)
    async getUserById(userId: string) {
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        return {
            id: user.id,
            email: user.email,
            role: user.role,
            avatarUrl: user.avatarUrl,
            credits: user.creditsBalance,
            firstName: user.firstName,
            lastName: user.lastName,
        };
    }
}
