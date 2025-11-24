import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Catch()
export class OAuthExceptionFilter implements ExceptionFilter {
    constructor(private configService: ConfigService) { }

    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();

        // Проверяем, это ли OAuth ошибка
        const isOAuthError =
            exception.message?.includes('InternalOAuthError') ||
            exception.message?.includes('Failed to obtain access token') ||
            exception.name === 'InternalOAuthError';

        if (isOAuthError) {
            console.error('OAuth Error:', exception.message);

            // Редиректим на страницу ошибки вместо показа белого экрана
            const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
            return response.redirect(`${frontendUrl}/auth/error`);
        }

        // Если это не OAuth ошибка, пробрасываем дальше
        throw exception;
    }
}
