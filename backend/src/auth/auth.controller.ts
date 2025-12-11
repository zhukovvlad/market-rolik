import { Controller, Get, Post, Body, UseGuards, Req, Res, UseFilters, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { OAuthExceptionFilter } from './filters/oauth-exception.filter';
import { RefreshTokenDto } from './dto/refresh-token.dto';

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
        // Passport уже сделал всю работу и положил токены в req.user
        const { access_token, refresh_token } = req.user;

        // Редиректим на фронтенд, передавая оба токена в URL
        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/auth/callback?token=${access_token}&refresh_token=${refresh_token}`);
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

    // 4. Эндпоинт для обновления access token с помощью refresh token
    @Post('refresh')
    async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
        return this.authService.refreshTokens(refreshTokenDto.refreshToken);
    }

    // 5. Эндпоинт для выхода (отзыв refresh token)
    @Post('logout')
    @UseGuards(AuthGuard('jwt'))
    async logout(@Req() req, @Body() body: { refreshToken?: string }) {
        if (body.refreshToken) {
            // Validate token format (should be tokenId.tokenSecret)
            const parts = body.refreshToken.split('.');
            if (parts.length !== 2 || !parts[0] || !parts[1]) {
                throw new UnauthorizedException('Invalid refresh token format');
            }
            
            const [tokenId] = parts;
            // Revoke only if token belongs to current user
            await this.authService.revokeRefreshTokenIfOwned(tokenId, req.user.id);
        } else {
            // If no specific token provided, revoke all user's tokens (logout from all devices)
            await this.authService.revokeAllUserTokens(req.user.id);
        }
        
        return { message: 'Logged out successfully' };
    }
}
