import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

@Catch()
export class OAuthExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(OAuthExceptionFilter.name);

  constructor(private configService: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Type guard для проверки структуры exception
    const exceptionObj = exception as {
      message?: string;
      name?: string;
      stack?: string;
    };

    // Проверяем, это ли OAuth ошибка
    const isOAuthError =
      exceptionObj.message?.includes('InternalOAuthError') ||
      exceptionObj.message?.includes('Failed to obtain access token') ||
      exceptionObj.name === 'InternalOAuthError' ||
      exceptionObj.name === 'TokenError' ||
      exceptionObj.name === 'AuthorizationError';

    if (isOAuthError) {
      this.logger.error(
        `OAuth Error: ${exceptionObj.message ?? 'Unknown error'}`,
        exceptionObj.stack,
      );

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
