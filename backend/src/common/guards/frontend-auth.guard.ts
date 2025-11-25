import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class FrontendAuthGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];
    const validApiKey = this.configService.get<string>('FRONTEND_API_KEY');

    if (!validApiKey) {
        throw new UnauthorizedException('Invalid API Key');
    }

    if (!apiKey) {
        throw new UnauthorizedException('Invalid API Key');
    }

    const apiKeyBuffer = Buffer.from(apiKey);
    const validApiKeyBuffer = Buffer.from(validApiKey);

    if (apiKeyBuffer.length !== validApiKeyBuffer.length) {
        throw new UnauthorizedException('Invalid API Key');
    }

    if (!crypto.timingSafeEqual(apiKeyBuffer, validApiKeyBuffer)) {
      throw new UnauthorizedException('Invalid API Key');
    }

    return true;
  }
}
