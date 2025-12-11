import { Controller, Get, Post, Body, UseGuards, Req, Res, UseFilters, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { OAuthExceptionFilter } from './filters/oauth-exception.filter';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
    constructor(
        private configService: ConfigService,
        private authService: AuthService,
    ) { }

    private getCookieOptions(type: 'access' | 'refresh') {
        const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
        const baseOptions = {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax' as const,
            path: '/',
        };

        return {
            ...baseOptions,
            maxAge: type === 'access'
                ? 60 * 60 * 1000 // 1 hour
                : 7 * 24 * 60 * 60 * 1000, // 7 days
        };
    }

    // Email/Password Registration
    @Post('register')
    async register(@Body() registerDto: RegisterDto, @Res() res) {
        const result = await this.authService.register(
            registerDto.email,
            registerDto.password,
        );

        // Update user with optional fields
        if (registerDto.firstName || registerDto.lastName) {
            const updatedUser = await this.authService.updateUser({
                id: result.user.id,
                ...(registerDto.firstName && { firstName: registerDto.firstName }),
                ...(registerDto.lastName && { lastName: registerDto.lastName }),
            });
            
            // Update only the changed fields in result.user
            result.user.firstName = updatedUser.firstName;
            result.user.lastName = updatedUser.lastName;
        }

        // Set httpOnly cookies
        res.cookie('access_token', result.access_token, this.getCookieOptions('access'));
        res.cookie('refresh_token', result.refresh_token, this.getCookieOptions('refresh'));

        return res.json({
            message: 'Registration successful',
            user: result.user,
        });
    }

    // Email/Password Login
    @Post('login')
    async login(@Body() loginDto: LoginDto, @Res() res) {
        const result = await this.authService.login(
            loginDto.email,
            loginDto.password,
        );

        // Set httpOnly cookies
        res.cookie('access_token', result.access_token, this.getCookieOptions('access'));
        res.cookie('refresh_token', result.refresh_token, this.getCookieOptions('refresh'));

        return res.json({
            message: 'Login successful',
            user: result.user,
        });
    }

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

        // Set httpOnly cookies instead of passing tokens in URL
        res.cookie('access_token', access_token, this.getCookieOptions('access'));
        res.cookie('refresh_token', refresh_token, this.getCookieOptions('refresh'));

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
        
        // Set new tokens in httpOnly cookies
        res.cookie('access_token', tokens.access_token, this.getCookieOptions('access'));
        res.cookie('refresh_token', tokens.refresh_token, this.getCookieOptions('refresh'));

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
        }
        
        // Clear cookies (remove maxAge from options)
        const { maxAge, ...clearOptions } = this.getCookieOptions('access');
        res.clearCookie('access_token', clearOptions);
        res.clearCookie('refresh_token', clearOptions);
        
        return res.json({ message: 'Logged out successfully' });
    }
}
