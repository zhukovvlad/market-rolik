type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
    level: LogLevel;
    message: string;
    context?: string;
    timestamp: string;
    data?: any;
}

class Logger {
    private isProduction: boolean;
    private minLevel: number;
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
    }

    private format(level: LogLevel, message: string, context?: string, data?: any): LogEntry {
        return {
            level,
            message,
            context,
            timestamp: new Date().toISOString(),
            data,
        };
    }

    private log(level: LogLevel, message: string, context?: string, data?: any) {
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
                console[level](JSON.stringify(entry));
            }
        } else {
            // In development, pretty print
            const color = this.getColor(level);
            const contextStr = context ? `[${context}]` : '';
            const dataStr = data ? '\n' + JSON.stringify(data, null, 2) : '';

            console[level](
                `%c${entry.timestamp} ${contextStr} ${level.toUpperCase()}: ${message}`,
                `color: ${color}; font-weight: bold;`,
                dataStr
            );
        }
    }

    private sendToBackend(entry: LogEntry) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

        // Fire and forget - don't await
        fetch(`${apiUrl}/logger/frontend`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(entry),
        }).catch(err => {
            // Prevent infinite loop if logging fails
            console.error('Failed to send log to backend', err);
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

    debug(message: string, context?: string, data?: any) {
        this.log('debug', message, context, data);
    }

    info(message: string, context?: string, data?: any) {
        this.log('info', message, context, data);
    }

    warn(message: string, context?: string, data?: any) {
        this.log('warn', message, context, data);
    }

    error(message: string, context?: string, data?: any) {
        this.log('error', message, context, data);
    }
}

export const logger = new Logger();
