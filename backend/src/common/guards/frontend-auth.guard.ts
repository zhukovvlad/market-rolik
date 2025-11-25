import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class FrontendAuthGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    let apiKey = request.headers['x-api-key'];
    const validApiKey = this.configService.get<string>('FRONTEND_API_KEY');

    if (!validApiKey) {
        throw new UnauthorizedException('Invalid API Key');
    }

    // Fallback to body for beacon requests
    if (!apiKey && request.body && request.body.apiKey) {
        apiKey = request.body.apiKey;
    }

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
