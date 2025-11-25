import { Body, Controller, Post, Inject, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
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
    @UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
    logFrontend(@Body() body: FrontendLogDto) {
        const { level, message, context, timestamp, data } = body;

        // Sanitize message to remove control characters (keep newlines/tabs)
        const sanitizedMessage = message.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

        this.logger.log({
            level: level,
            message: sanitizedMessage,
            context: `Frontend:${context || 'Unknown'}`,
            timestamp: timestamp,
            data: this.sanitizeData(data),
            source: 'frontend',
        });

        return { success: true };
    }

    private sanitizeData(data: any): any {
        if (!data) return data;
        if (typeof data !== 'object') return data;

        if (Array.isArray(data)) {
            return data.map((item) => this.sanitizeData(item));
        }

        const sensitiveKeys = [
            'password',
            'token',
            'secret',
            'apikey',
            'authorization',
            'creditcard',
            'ssn',
        ];

        const sanitized = { ...data };

        for (const key in sanitized) {
            if (Object.prototype.hasOwnProperty.call(sanitized, key)) {
                const lowerKey = key.toLowerCase();
                if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
                    sanitized[key] = '[REDACTED]';
                } else if (typeof sanitized[key] === 'object') {
                    sanitized[key] = this.sanitizeData(sanitized[key]);
                }
            }
        }

        return sanitized;
    }
}
