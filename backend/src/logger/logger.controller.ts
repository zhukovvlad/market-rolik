import { Body, Controller, Post, Inject, UseGuards, UsePipes, ValidationPipe, ParseArrayPipe } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';
import { ThrottlerGuard } from '@nestjs/throttler';
import { FrontendAuthGuard } from '../common/guards/frontend-auth.guard';
import { FrontendLogDto } from './dto/frontend-log.dto';

@Controller('logger')
@UseGuards(ThrottlerGuard, FrontendAuthGuard)
export class LoggerController {
    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
    ) { }

    @Post('frontend')
    logFrontend(
        @Body(new ParseArrayPipe({ items: FrontendLogDto, whitelist: true, forbidNonWhitelisted: true }))
        body: FrontendLogDto[],
    ) {
        body.forEach((log) => {
            const { level, message, context, timestamp, data } = log;

            // Sanitize message to remove control characters (keep \t, \n, \r)
            const sanitizedMessage = message.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');

            this.logger.log({
                level: level,
                message: sanitizedMessage,
                context: `Frontend:${context || 'Unknown'}`,
                timestamp: timestamp,
                data: this.sanitizeData(data),
                source: 'frontend',
            });
        });

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
