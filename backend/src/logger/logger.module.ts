import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import * as fs from 'fs';

const isProduction = process.env.NODE_ENV === 'production';

const logLevel = process.env.LOG_LEVEL || 'info';

// Ensure logs directory exists
const logDir = process.env.LOG_DIR || 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

import { LoggerController } from './logger.controller';

// Custom format to filter only frontend logs
const frontendFilter = winston.format((info) => {
  return info.source === 'frontend' ? info : false;
});

// Custom format to exclude frontend logs from combined log
const backendFilter = winston.format((info) => {
  return info.source === 'frontend' ? false : info;
});

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
                winston.format.printf(
                  ({ timestamp, level, message, context, ms }) => {
                    return `${timestamp} [${context}] ${level}: ${message} ${ms}`;
                  },
                ),
              ),
        }),
        new DailyRotateFile({
          filename: `${logDir}/error-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
        new DailyRotateFile({
          filename: `${logDir}/combined-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          format: winston.format.combine(
            backendFilter(),
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
        new DailyRotateFile({
          filename: `${logDir}/frontend-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          format: winston.format.combine(
            frontendFilter(),
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      ],
    }),
  ],
  exports: [WinstonModule],
})
export class LoggerModule {}
