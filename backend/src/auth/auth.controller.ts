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

        const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

        // Set httpOnly cookies instead of passing tokens in URL
        res.cookie('access_token', access_token, {
            httpOnly: true,
            secure: isProduction, // HTTPS only in production
            sameSite: 'lax',
            maxAge: 60 * 60 * 1000, // 1 hour (matches JWT expiration)
            path: '/',
        });

        res.cookie('refresh_token', refresh_token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/',
        });

        // Редиректим на фронтенд БЕЗ токенов в URL
        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/auth/callback`);
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
    async refreshTokens(@Req() req, @Res() res) {
        // Extract refresh token from httpOnly cookie
        const refreshToken = req.cookies?.refresh_token;
        
        if (!refreshToken) {
            throw new UnauthorizedException('Refresh token not found');
        }

        const tokens = await this.authService.refreshTokens(refreshToken);
        
        const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

        // Set new tokens in httpOnly cookies
        res.cookie('access_token', tokens.access_token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            maxAge: 60 * 60 * 1000, // 1 hour
            path: '/',
        });

        res.cookie('refresh_token', tokens.refresh_token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/',
        });

        return res.json({ message: 'Tokens refreshed successfully' });
    }

    // 5. Эндпоинт для выхода (отзыв refresh token)
    @Post('logout')
    @UseGuards(AuthGuard('jwt'))
    async logout(@Req() req, @Res() res) {
        const refreshToken = req.cookies?.refresh_token;
        
        if (refreshToken) {
            // Validate token format (should be tokenId.tokenSecret)
            const parts = refreshToken.split('.');
            if (parts.length === 2 && parts[0] && parts[1]) {
                const [tokenId] = parts;
                try {
                    // Revoke only if token belongs to current user
                    await this.authService.revokeRefreshTokenIfOwned(tokenId, req.user.id);
                } catch (error) {
                    // Continue with logout even if revocation fails
                    console.error('Failed to revoke refresh token:', error);
                }
            }
        } else {
            // If no specific token in cookie, revoke all user's tokens (logout from all devices)
            await this.authService.revokeAllUserTokens(req.user.id);
        }
        
        // Clear cookies
        res.clearCookie('access_token', { path: '/' });
        res.clearCookie('refresh_token', { path: '/' });
        
        return res.json({ message: 'Logged out successfully' });
    }
}
