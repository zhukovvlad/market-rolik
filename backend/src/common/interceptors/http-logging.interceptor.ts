import {
    CallHandler,
    ExecutionContext,
    Injectable,
    Logger,
    NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger(HttpLoggingInterceptor.name);

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const { method, url, user } = request;
        const now = Date.now();

        return next.handle().pipe(
            tap({
                next: () => {
                    const response = context.switchToHttp().getResponse();
                    const statusCode = response.statusCode;
                    const duration = Date.now() - now;
                    const userId = user ? user.id : 'anonymous';

                    this.logger.log(
                        `${method} ${url} ${statusCode} - ${duration}ms - User: ${userId}`,
                    );
                },
                error: (error) => {
                    const duration = Date.now() - now;
                    const userId = user ? user.id : 'anonymous';

                    this.logger.error(
                        `${method} ${url} - ${duration}ms - User: ${userId} - Error: ${error.message}`,
                        error.stack,
                    );
                },
            }),
        );
    }
}
