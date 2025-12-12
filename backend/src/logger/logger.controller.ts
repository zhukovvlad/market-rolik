/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable no-control-regex */
import {
  Body,
  Controller,
  Post,
  Inject,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';
import { ThrottlerGuard } from '@nestjs/throttler';
import { FrontendAuthGuard } from '../common/guards/frontend-auth.guard';
import { FrontendLogDto } from './dto/frontend-log.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@Controller('logger')
@UseGuards(ThrottlerGuard, FrontendAuthGuard)
export class LoggerController {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
  ) {}

  @Post('frontend')
  async logFrontend(
    @Body() body: FrontendLogDto[] | { logs: FrontendLogDto[] },
  ) {
    let logs: any[] = [];

    if (Array.isArray(body)) {
      logs = body;
    } else if (
      body &&
      typeof body === 'object' &&
      'logs' in body &&
      Array.isArray((body as any).logs)
    ) {
      logs = (body as any).logs;
    } else {
      throw new BadRequestException(
        'Invalid log format: expected an array of logs or an object with a logs[] property',
      );
    }

    for (const logItem of logs) {
      const logDto = plainToInstance(FrontendLogDto, logItem);
      const errors = await validate(logDto, {
        whitelist: true,
        forbidNonWhitelisted: true,
      });

      if (errors.length > 0) {
        this.logger.warn({
          level: 'warn',
          message: 'Dropped invalid frontend log item',
          context: 'Frontend:Validation',
          source: 'frontend',
          validationErrors: errors.map((e) => e.constraints),
        });
        continue;
      }

      const { level, message, context, timestamp, data } = logDto;

      // Sanitize message to remove control characters (keep \t, \n, \r)
      const sanitizedMessage = message.replace(
        /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,
        '',
      );

      this.logger.log({
        level: level,
        message: sanitizedMessage,
        context: `Frontend:${context || 'Unknown'}`,
        timestamp: timestamp,
        data: this.sanitizeData(data),
        source: 'frontend',
      });
    }

    return { success: true };
  }

  private sanitizeData(data: any, depth = 0): any {
    const MAX_DEPTH = 10;
    if (depth > MAX_DEPTH) return '[MAX_DEPTH_EXCEEDED]';
    if (!data) return data;
    if (typeof data !== 'object') return data;

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeData(item, depth + 1));
    }

    const sensitiveKeys = [
      'password',
      'token',
      'secret',
      'apikey',
      'api_key',
      'authorization',
      'auth',
      'bearer',
      'credential',
      'private',
      'session',
      'creditcard',
      'credit_card',
      'ssn',
    ];

    const sanitized = { ...data };

    for (const key in sanitized) {
      if (Object.prototype.hasOwnProperty.call(sanitized, key)) {
        const lowerKey = key.toLowerCase();
        if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
          sanitized[key] = '[REDACTED]';
        } else if (typeof sanitized[key] === 'object') {
          sanitized[key] = this.sanitizeData(sanitized[key], depth + 1);
        }
      }
    }

    return sanitized;
  }
}
