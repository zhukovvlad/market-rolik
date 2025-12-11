# Rate Limiting Documentation

> IP-based rate limiting implementation for Market Rolik API  
> Last updated: 2025-12-12

## Overview

The application implements IP-based rate limiting to prevent API abuse, DDoS attacks, and ensure fair resource usage. The system tracks requests by client IP address rather than user ID, preventing attackers from bypassing limits by creating multiple accounts.

## Architecture

### Components

1. **IpThrottlerGuard** (`backend/src/common/guards/ip-throttler.guard.ts`)
   - Custom NestJS guard extending `ThrottlerGuard`
   - Tracks requests by IP address instead of user authentication
   - Uses Express's `req.ip` for secure IP extraction

2. **Global Guard Registration** (`backend/src/app.module.ts`)
   - Registered as `APP_GUARD` provider
   - Applied to all endpoints automatically
   - Can be overridden per-endpoint with `@Throttle()` decorator

3. **Trust Proxy Configuration** (`backend/src/main.ts`)
   - Configures Express to trust only specific proxy IPs
   - Prevents IP spoofing attacks
   - Required for correct IP extraction behind reverse proxies

## Configuration

### Environment Variables

Add to your `.env` file:

```bash
# Rate Limiting Configuration
THROTTLE_TTL=60000    # Time window in milliseconds (60000ms = 1 minute)
THROTTLE_LIMIT=10     # Maximum requests per time window per IP
```

### Trust Proxy Settings

**Configuration via Environment Variables:**

The application now supports flexible trust proxy configuration for different deployment scenarios:

```bash
# Option 1: Use presets
TRUST_PROXY=loopback        # Development (default)
TRUST_PROXY=true            # Simple deployments with one proxy
TRUST_PROXY=cloudflare      # When using Cloudflare CDN

# Option 2: Custom proxy IPs (comma-separated)
TRUST_PROXY_IPS=172.17.0.0/16              # Docker
TRUST_PROXY_IPS=10.0.0.1,10.0.0.2          # Multiple nginx servers
TRUST_PROXY_IPS=10.0.0.0/16                # AWS VPC CIDR
```

**Default Configuration** (in `main.ts`):
- Reads `TRUST_PROXY` and `TRUST_PROXY_IPS` from environment
- Falls back to `loopback` (localhost only) if not set
- Supports presets: `loopback`, `true`, `cloudflare`
- Supports custom IPs via `TRUST_PROXY_IPS`

**Examples for Different Environments:**

| Environment | TRUST_PROXY | TRUST_PROXY_IPS | Use Case |
|-------------|-------------|-----------------|----------|
| Development | `loopback` | - | Local machine |
| Docker Compose | `loopback` | `172.17.0.0/16` | Docker bridge network |
| Behind nginx | `true` | - | Single nginx proxy |
| AWS ELB/ALB | `true` | - | AWS load balancer |
| Cloudflare | `cloudflare` | - | Cloudflare CDN |
| Multiple proxies | - | `10.0.0.1,10.0.0.2` | Custom proxy IPs |

**⚠️ Security Warning:**

Incorrect trust proxy configuration can allow IP spoofing! See [DEPLOYMENT_RATE_LIMITING.md](DEPLOYMENT_RATE_LIMITING.md) for:
- Step-by-step deployment guides for different hosting providers
- How to verify your configuration is secure
- Troubleshooting common issues
- Production deployment checklist

### Validation

Environment variables are validated at startup (`backend/src/config/env.validation.ts`):

```typescript
THROTTLE_TTL: Joi.number().integer().min(1000).default(60000),
THROTTLE_LIMIT: Joi.number().integer().min(1).default(10),
```

- **THROTTLE_TTL**: Minimum 1000ms (1 second)
- **THROTTLE_LIMIT**: Minimum 1 request
- Both have safe defaults if not specified

## Rate Limits

### Global Limits

Applied to all endpoints by default:

| Time Window | Max Requests |
|-------------|--------------|
| 60 seconds  | 10 requests  |

### Endpoint-Specific Limits

#### Upload Endpoint

**Endpoint:** `POST /projects/upload`  
**Limit:** 5 uploads per minute per IP

```typescript
@Throttle({ default: { ttl: 60000, limit: 5 } })
@Post('upload')
async uploadFile(...) { ... }
```

This stricter limit prevents:
- Bandwidth exhaustion from rapid file uploads
- Storage abuse
- Resource-intensive file processing overload

## How It Works

### IP Extraction Flow

```
1. Client Request → Reverse Proxy (nginx/Docker)
   ↓
2. Proxy adds X-Forwarded-For header
   ↓
3. Express (with trust proxy configured)
   ↓
4. Validates proxy IP is trusted
   ↓
5. Safely populates req.ip from X-Forwarded-For
   ↓
6. IpThrottlerGuard uses req.ip as tracking key
   ↓
7. Request allowed/blocked based on IP rate limit
```

### Security: Trust Proxy Validation

**Without trust proxy configuration:**
```
❌ Attacker sets: X-Forwarded-For: 1.2.3.4
   → req.ip = 1.2.3.4
   → Can bypass rate limiting by changing header
```

**With trust proxy configuration:**
```
✅ Attacker sets: X-Forwarded-For: 1.2.3.4
   → Express checks: Is request from trusted proxy? NO
   → req.ip = actual socket IP (cannot be spoofed)
   → Rate limiting enforced correctly
```

## Adding Custom Rate Limits

### Per-Endpoint Rate Limiting

```typescript
import { Throttle } from '@nestjs/throttler';

@Controller('api')
export class ApiController {
  
  // Stricter limit for expensive operations
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @Post('generate-video')
  async generateVideo() { ... }
  
  // More lenient for read operations
  @Throttle({ default: { ttl: 60000, limit: 100 } })
  @Get('projects')
  async getProjects() { ... }
  
  // Skip rate limiting for specific endpoint
  @SkipThrottle()
  @Get('health')
  async healthCheck() { ... }
}
```

### Multiple Time Windows

```typescript
@Throttle([
  { ttl: 1000, limit: 3 },   // 3 requests per second
  { ttl: 60000, limit: 20 }  // 20 requests per minute
])
@Post('critical-operation')
async criticalOperation() { ... }
```

## Monitoring & Debugging

### Rate Limit Headers

Responses include rate limit information:

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1702345678
```

### When Rate Limit Exceeded

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json

{
  "statusCode": 429,
  "message": "Too many requests from this IP address. Please try again later."
}
```

### Checking Client IP in Logs

The IP used for rate limiting is available as `req.ip`:

```typescript
console.log('Client IP:', req.ip);
// Development: ::1 or 127.0.0.1
// Production: Real client IP from proxy
```

## Testing

### Local Testing (Development)

```bash
# Test rate limiting locally
for i in {1..12}; do 
  curl -X GET http://localhost:4000/projects \
    -H "Authorization: Bearer $TOKEN" \
    -w "\nStatus: %{http_code}\n"; 
done

# Should see:
# - First 10 requests: 200 OK
# - Requests 11-12: 429 Too Many Requests
```

### Testing Behind Proxy

```bash
# Verify trust proxy is working
curl -X GET http://localhost:4000/projects \
  -H "X-Forwarded-For: 1.2.3.4" \
  -H "Authorization: Bearer $TOKEN"

# Check logs - should show your real IP, not 1.2.3.4
# (unless request came from trusted proxy)
```

### Integration Tests

```typescript
describe('Rate Limiting', () => {
  it('should limit requests per IP', async () => {
    const requests = Array(11).fill(0).map(() => 
      request(app.getHttpServer())
        .get('/projects')
        .set('Authorization', `Bearer ${token}`)
    );
    
    const responses = await Promise.all(requests);
    const blockedRequests = responses.filter(r => r.status === 429);
    
    expect(blockedRequests.length).toBeGreaterThan(0);
  });
});
```

## Common Issues & Solutions

### Issue: Rate limiting not working

**Symptoms:** All requests pass through, no 429 errors

**Solutions:**
1. Verify `IpThrottlerGuard` is registered in `app.module.ts`
2. Check environment variables are loaded correctly
3. Ensure Redis is running (if using Redis storage)

### Issue: All requests blocked immediately

**Symptoms:** First request returns 429

**Solutions:**
1. Check `THROTTLE_LIMIT` is not 0
2. Verify Redis/storage is not corrupted
3. Clear rate limiting storage

### Issue: IP shows as 'unknown'

**Symptoms:** Rate limiting tracks all users as same IP

**Solutions:**
1. Configure `trust proxy` in `main.ts`
2. Verify reverse proxy is setting `X-Forwarded-For` header
3. Check proxy IP is in trusted range

### Issue: Different IPs for same client

**Symptoms:** User experiences inconsistent rate limiting

**Solutions:**
1. User may be on mobile network (IP changes frequently)
2. Load balancer changing source IPs
3. Consider user-based rate limiting for authenticated endpoints

## Production Checklist

- [ ] Set appropriate `THROTTLE_TTL` and `THROTTLE_LIMIT` for production load
- [ ] Configure `trust proxy` to match your infrastructure (nginx, AWS, etc.)
- [ ] Test rate limiting with production-like traffic
- [ ] Set up monitoring for 429 responses
- [ ] Document rate limits in API documentation
- [ ] Consider Redis-backed storage for distributed deployments
- [ ] Plan for handling legitimate burst traffic (e.g., batch operations)

## Future Improvements

### Potential Enhancements

1. **Redis Storage** (for multi-server deployments)
   ```typescript
   ThrottlerModule.forRoot({
     storage: new ThrottlerStorageRedisService(redis),
     throttlers: [{ ttl: 60000, limit: 10 }]
   })
   ```

2. **User-Based Rate Limiting** (for authenticated endpoints)
   ```typescript
   protected async getTracker(req: Request): Promise<string> {
     return req.user?.id || req.ip || 'anonymous';
   }
   ```

3. **Dynamic Rate Limits** (based on user tier/role)
   ```typescript
   const limit = req.user?.role === 'premium' ? 100 : 10;
   ```

4. **Rate Limit Bypass for Internal Services**
   ```typescript
   if (req.ip === 'internal-service-ip') return true;
   ```

## References

- [NestJS Throttler Documentation](https://docs.nestjs.com/security/rate-limiting)
- [Express Trust Proxy Guide](https://expressjs.com/en/guide/behind-proxies.html)
- [OWASP Rate Limiting Guide](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html)

## Support

For issues or questions:
- Check existing issues in GitHub
- Review application logs for rate limiting events
- Test with curl/Postman to isolate client vs server issues
