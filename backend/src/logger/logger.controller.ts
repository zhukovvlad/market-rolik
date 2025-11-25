import { Body, Controller, Post, Inject, Logger } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';

@Controller('logger')
export class LoggerController {
    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
    ) { }

    @Post('frontend')
    logFrontend(@Body() body: any) {
        const { level, message, context, timestamp, data } = body;

        // Ensure we don't allow arbitrary levels that might break things
        const validLevels = ['debug', 'info', 'warn', 'error'];
        const safeLevel = validLevels.includes(level) ? level : 'info';

        this.logger.log({
            level: safeLevel,
            message: message,
            context: `Frontend:${context || 'Unknown'}`,
            timestamp: timestamp,
            data: data,
            source: 'frontend',
        });

        return { success: true };
    }
}
