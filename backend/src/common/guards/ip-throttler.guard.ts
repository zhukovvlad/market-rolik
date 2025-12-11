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
   * Extracts real IP from X-Forwarded-For or X-Real-IP headers when behind proxy.
   */
  protected async getTracker(req: Request): Promise<string> {
    // Try to get real IP from proxy headers first
    const forwardedFor = req.headers['x-forwarded-for'];
    const realIp = req.headers['x-real-ip'];
    
    // X-Forwarded-For can be a comma-separated list, take the first IP
    if (forwardedFor) {
      const ips = Array.isArray(forwardedFor) 
        ? forwardedFor[0] 
        : forwardedFor;
      return ips.split(',')[0].trim();
    }
    
    // Fall back to X-Real-IP header
    if (realIp) {
      return Array.isArray(realIp) ? realIp[0] : realIp;
    }
    
    // Fall back to socket IP
    return req.ip || req.socket.remoteAddress || 'unknown';
  }
}
