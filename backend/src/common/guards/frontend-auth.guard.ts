import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class FrontendAuthGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const headerApiKey = request.headers['x-api-key'];
    const bodyApiKey = request.body?.apiKey;
    const validApiKey = this.configService.get<string>('FRONTEND_API_KEY');

    if (!validApiKey) {
        throw new UnauthorizedException('Invalid API Key');
    }

    const apiKey =
        typeof headerApiKey === 'string'
            ? headerApiKey
            : typeof bodyApiKey === 'string'
                ? bodyApiKey
                : undefined;

    if (!apiKey) {
        throw new UnauthorizedException('Invalid API Key');
    }

    const apiKeyBuffer = Buffer.from(apiKey, 'utf8');
    const validApiKeyBuffer = Buffer.from(validApiKey, 'utf8');

    if (apiKeyBuffer.length !== validApiKeyBuffer.length) {
        throw new UnauthorizedException('Invalid API Key');
    }

    if (!crypto.timingSafeEqual(apiKeyBuffer, validApiKeyBuffer)) {
      throw new UnauthorizedException('Invalid API Key');
    }

    return true;
  }
}
