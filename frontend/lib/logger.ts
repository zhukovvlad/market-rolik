type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
    level: LogLevel;
    message: string;
    context?: string;
    timestamp: string;
    data?: unknown;
}

class Logger {
    private isProduction: boolean;
    private minLevel: number;
    private logQueue: LogEntry[] = [];
    private flushTimeout: NodeJS.Timeout | null = null;
    private readonly flushInterval = 2000; // Flush every 2 seconds
    private readonly maxBatchSize = 10; // Or when we have 10 logs

    private levels: Record<LogLevel, number> = {
        debug: 0,
        info: 1,
        warn: 2,
        error: 3,
    };

    constructor() {
        this.isProduction = process.env.NODE_ENV === 'production';
        const envLevel = (process.env.NEXT_PUBLIC_LOG_LEVEL || 'info') as LogLevel;
        this.minLevel = this.levels[envLevel] ?? 1; // Default to info

        // Flush logs before page unload
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', () => this.flush(true));
            window.addEventListener('pagehide', () => this.flush(true));
        }
    }

    private format(level: LogLevel, message: string, context?: string, data?: unknown): LogEntry {
        return {
            level,
            message,
            context,
            timestamp: new Date().toISOString(),
            data,
        };
    }

    private log(level: LogLevel, message: string, context?: string, data?: unknown) {
        if (this.levels[level] < this.minLevel) {
            return;
        }

        const entry = this.format(level, message, context, data);

        // Send to backend if error or warn
        if (level === 'error' || level === 'warn') {
            this.sendToBackend(entry);
        }

        if (this.isProduction) {
            // In production, we might want to send this to a remote logging service
            // For now, we'll just console.log structured JSON if it's an error, or nothing for debug
            if (level === 'error' || level === 'warn') {
                console[level](this.safeStringify(entry));
            }
        } else {
            // In development, pretty print
            const color = this.getColor(level);
            const contextStr = context ? `[${context}]` : '';
            const dataStr = data ? '\n' + this.safeStringify(data, 2) : '';

            console[level](
                `%c${entry.timestamp} ${contextStr} ${level.toUpperCase()}: ${message}`,
                `color: ${color}; font-weight: bold;`,
                dataStr
            );
        }
    }

    private sendToBackend(entry: LogEntry) {
        this.logQueue.push(entry);

        if (this.logQueue.length >= this.maxBatchSize) {
            this.flush();
        } else if (!this.flushTimeout) {
            this.flushTimeout = setTimeout(() => this.flush(), this.flushInterval);
        }
    }

    private flush(useKeepalive = false) {
        if (this.flushTimeout) {
            clearTimeout(this.flushTimeout);
            this.flushTimeout = null;
        }

        if (this.logQueue.length === 0) {
            return;
        }

        const batch = [...this.logQueue];
        this.logQueue = [];

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const apiKey = process.env.NEXT_PUBLIC_FRONTEND_API_KEY;
        const url = `${apiUrl}/logger/frontend`;
        const body = this.safeStringify(batch);

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (apiKey) {
            headers['x-api-key'] = apiKey;
        }

        // Note: JWT is now in httpOnly cookie, sent automatically with credentials
        // No need to manually add Authorization header

        if (useKeepalive) {
            const payload = {
                logs: batch,
                apiKey: apiKey,
            };
            const blob = new Blob([this.safeStringify(payload)], { type: 'application/json' });

            if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
                if (navigator.sendBeacon(url, blob)) {
                    return;
                }
            }
            
            // Fallback to fetch with keepalive if sendBeacon fails or is unavailable
            fetch(url, {
                method: 'POST',
                headers, // Send auth in both headers (backward compat) and payload (consistency with beacon)
                credentials: 'include',
                body: this.safeStringify(payload), // Use the same payload as beacon for consistency
                keepalive: true,
            }).catch(err => {
                console.error('Failed to send log batch to backend', err);
            });
            return;
        }

        // Fire and forget - don't await
        fetch(url, {
            method: 'POST',
            headers,
            credentials: 'include',
            body,
        }).catch(err => {
            // Prevent infinite loop if logging fails
            console.error('Failed to send log batch to backend', err);
        });
    }

    private getColor(level: LogLevel): string {
        switch (level) {
            case 'debug': return '#808080'; // Gray
            case 'info': return '#00bfff'; // Deep Sky Blue
            case 'warn': return '#ffa500'; // Orange
            case 'error': return '#ff0000'; // Red
            default: return '#000000';
        }
    }

    private safeStringify(value: unknown, space?: number): string {
        const seen = new WeakSet();
        try {
            return JSON.stringify(value, (key, val) => {
                const lowerKey = key.toLowerCase();

                // Redact sensitive fields
                if (
                    lowerKey.includes('authorization') ||
                    lowerKey.includes('token') ||
                    lowerKey.includes('password') ||
                    lowerKey.includes('secret') ||
                    lowerKey.includes('api_key') ||
                    lowerKey.includes('apikey') ||
                    lowerKey.includes('session') ||
                    lowerKey.includes('cookie')
                ) {
                    return '[REDACTED]';
                }

                // Serialize Error instances with useful fields
                if (val instanceof Error) {
                    return {
                        name: val.name,
                        message: val.message,
                        ...(this.isProduction ? {} : { stack: val.stack }),
                    };
                }

                if (typeof val === 'object' && val !== null) {
                    if (seen.has(val)) {
                        return '[Circular]';
                    }
                    seen.add(val);
                }
                return val;
            }, space);
        } catch (error) {
            return '<unserializable data>';
        }
    }

    debug(message: string, context?: string, data?: unknown) {
        this.log('debug', message, context, data);
    }

    info(message: string, context?: string, data?: unknown) {
        this.log('info', message, context, data);
    }

    warn(message: string, context?: string, data?: unknown) {
        this.log('warn', message, context, data);
    }

    error(message: string, context?: string, data?: unknown) {
        this.log('error', message, context, data);
    }
}

export const logger = new Logger();
