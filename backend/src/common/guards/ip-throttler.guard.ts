import { ThrottlerGuard } from '@nestjs/throttler';
import { Injectable } from '@nestjs/common';
import { Request } from 'express';

/**
 * IP-based throttler guard that uses the client's IP address for rate limiting.
 * This prevents abuse from different accounts on the same IP.
 */
@Injectable()
export class IpThrottlerGuard extends ThrottlerGuard {
  /**
   * Generate tracking key based on IP address instead of user ID.
   * Uses req.ip which is safely populated by Express when trust proxy is configured.
   * This prevents IP spoofing attacks from untrusted X-Forwarded-For headers.
   */
  protected async getTracker(req: Request): Promise<string> {
    // Use req.ip which Express populates from trusted proxy headers
    // Trust proxy must be configured in main.ts for this to work correctly
    return req.ip || req.socket.remoteAddress || 'unknown';
  }
}
