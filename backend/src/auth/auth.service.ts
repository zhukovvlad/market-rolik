import { Injectable, UnauthorizedException, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/user.entity';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { OAuthDetails } from './interfaces/oauth-details.interface';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
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
        return this.generateToken(user);
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
        return this.generateToken(user);
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

        return this.generateToken(user);
    }

    generateToken(user: User) {
        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        return {
            access_token: this.jwtService.sign(payload),
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
