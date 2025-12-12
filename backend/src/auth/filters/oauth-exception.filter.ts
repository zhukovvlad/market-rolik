/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Catch()
export class OAuthExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(OAuthExceptionFilter.name);

  constructor(private configService: ConfigService) {}

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    // Проверяем, это ли OAuth ошибка
    const isOAuthError =
      exception.message?.includes('InternalOAuthError') ||
      exception.message?.includes('Failed to obtain access token') ||
      exception.name === 'InternalOAuthError' ||
      exception.name === 'TokenError' ||
      exception.name === 'AuthorizationError';

    if (isOAuthError) {
      this.logger.error(`OAuth Error: ${exception.message}`, exception.stack);

      // Редиректим на страницу ошибки вместо показа белого экрана
      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL') ||
        'http://localhost:3000';
      return response.redirect(`${frontendUrl}/auth/error`);
    }

    // Если это не OAuth ошибка, пробрасываем дальше
    throw exception;
  }
}
