import { Controller, Get, UseGuards, Req, Res, UseFilters } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { OAuthExceptionFilter } from './filters/oauth-exception.filter';

@Controller('auth')
export class AuthController {
    constructor(
        private configService: ConfigService,
        private authService: AuthService,
    ) { }

    // 1. Сюда стучится фронтенд, чтобы начать вход
    @Get('google')
    @UseGuards(AuthGuard('google'))
    @UseFilters(OAuthExceptionFilter)
    async googleAuth(@Req() req) {
        // Этот метод запускает редирект на Google
    }

    // 2. Сюда Google возвращает юзера
    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    @UseFilters(OAuthExceptionFilter)
    async googleAuthRedirect(@Req() req, @Res() res) {
        // Passport уже сделал всю работу и положил токен в req.user
        const { access_token, user } = req.user;

        // Редиректим на фронтенд, передавая токен в URL
        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/auth/callback?token=${access_token}`);
    }

    // 3. Эндпоинт для получения данных текущего пользователя
    @Get('me')
    @UseGuards(AuthGuard('jwt'))
    async getProfile(@Req() req) {
        // JWT стратегия already положила decoded payload в req.user
        // req.user = { id, email, role } из JwtStrategy.validate()

        // Получаем полную информацию о пользователе из БД
        return this.authService.getUserById(req.user.id);
    }
}
