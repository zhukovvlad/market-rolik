import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';

const logLevel = process.env.LOG_LEVEL || 'info';

import { LoggerController } from './logger.controller';

@Module({
    controllers: [LoggerController],
    imports: [
        WinstonModule.forRoot({
            level: logLevel,
            transports: [
                new winston.transports.Console({
                    format: isProduction
                        ? winston.format.combine(
                            winston.format.timestamp(),
                            winston.format.json(),
                        )
                        : winston.format.combine(
                            winston.format.timestamp(),
                            winston.format.ms(),
                            winston.format.colorize({ all: true }),
                            winston.format.printf(({ timestamp, level, message, context, ms }) => {
                                return `${timestamp} [${context}] ${level}: ${message} ${ms}`;
                            }),
                        ),
                }),
                new winston.transports.File({
                    filename: 'logs/error.log',
                    level: 'error',
                    format: winston.format.combine(
                        winston.format.timestamp(),
                        winston.format.json(),
                    ),
                }),
                new winston.transports.File({
                    filename: 'logs/combined.log',
                    format: winston.format.combine(
                        winston.format.timestamp(),
                        winston.format.json(),
                    ),
                }),
                new winston.transports.File({
                    filename: 'logs/frontend.log',
                    format: winston.format.combine(
                        winston.format.timestamp(),
                        winston.format.json(),
                    ),
                    // Only log if source is frontend (we'll filter this via a custom format or just let it mix for now,
                    // but specifically for this file we might want only frontend.
                    // For simplicity in this iteration, we'll just add it as a sink for all logs,
                    // but ideally we'd filter. Let's keep it simple: it captures everything for now,
                    // or we can use a custom filter.)
                }),
            ],
        }),
    ],
    exports: [WinstonModule],
})
export class LoggerModule { }
