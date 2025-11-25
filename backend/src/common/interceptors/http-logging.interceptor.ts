import {
    CallHandler,
    ExecutionContext,
    Injectable,
    Inject,
    NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { Request } from 'express';

interface RequestWithUser extends Request {
    user?: {
        id: string | number;
        [key: string]: any;
    };
}

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    ) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest<RequestWithUser>();
        const { method, url, user } = request;
        const now = Date.now();
        const safeUrl = this.sanitizeUrl(url);

        return next.handle().pipe(
            tap({
                next: () => {
                    const response = context.switchToHttp().getResponse();
                    const statusCode = response.statusCode;
                    const duration = Date.now() - now;
                    const userId = user ? user.id : 'anonymous';

                    this.logger.info(
                        `${method} ${safeUrl} ${statusCode} - ${duration}ms - User: ${userId}`,
                        { context: 'HttpLoggingInterceptor' },
                    );
                },
                error: (error) => {
                    const duration = Date.now() - now;
                    const userId = user ? user.id : 'anonymous';

                    this.logger.error(
                        `${method} ${safeUrl} - ${duration}ms - User: ${userId} - Error: ${error.message}`,
                        { stack: error.stack, context: 'HttpLoggingInterceptor' },
                    );
                },
            }),
        );
    }

    private sanitizeUrl(url: string): string {
        try {
            const urlObj = new URL(url, 'http://dummy-base');
            const sensitiveKeys = [
                'token',
                'api_key',
                'password',
                'secret',
                'authorization',
                'access_token',
                'refresh_token',
            ];

            urlObj.searchParams.forEach((_, key) => {
                if (sensitiveKeys.includes(key.toLowerCase())) {
                    urlObj.searchParams.set(key, '[REDACTED]');
                }
            });

            return urlObj.pathname + urlObj.search;
        } catch {
            return url;
        }
    }
}
