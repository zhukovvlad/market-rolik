# Refresh Token Implementation Guide

## Overview

A secure refresh token flow has been implemented for the market-rolik application. This allows clients to obtain new access tokens without requiring the user to re-authenticate.

## Architecture

### Database Schema

**Table: `refresh_tokens`**
- `id` (UUID, primary key)
- `tokenHash` (VARCHAR 255) - Hashed token using bcrypt
- `userId` (UUID, foreign key to users)
- `expiresAt` (TIMESTAMP) - Token expiration date (7 days from creation)
- `createdAt` (TIMESTAMP) - Token creation timestamp

**Indexes:**
- Primary key index on `id` (tokenId) for O(1) token lookup
- Composite index on `(userId, expiresAt)` for efficient cleanup and user queries

**Foreign Key:**
- CASCADE delete on user deletion to clean up orphaned tokens

## Security Features

### 1. Token Format and Hashing
- Refresh tokens use format: `tokenId.tokenSecret`
- `tokenId` (UUID) is used for O(1) database lookup
- `tokenSecret` (64 hex characters) is hashed using bcrypt before storage
- Only the hash is stored in the database, never the plain secret
- This approach combines performance (direct lookup) with security (hashed secret)

### 2. Token Rotation
- When a refresh token is used, it's immediately revoked
- A new refresh token is issued along with the new access token
- This prevents token replay attacks

### 3. Expiration
- Refresh tokens expire after 7 days
- Expired tokens are rejected during validation
- A cleanup method is available to purge expired tokens from the database

### 4. Revocation
- Individual tokens can be revoked
- All tokens for a user can be revoked (logout all devices)
- Deleted users automatically have all tokens revoked (CASCADE)

## API Endpoints

### 1. Login/Register/OAuth
All authentication methods now return both tokens:

```typescript
POST /auth/login
POST /auth/register
GET /auth/google/callback

Response:
{
  "access_token": "eyJhbGc...",
  "refresh_token": "a1b2c3d4...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "USER",
    ...
  }
}
```

### 2. Refresh Token Endpoint

```typescript
POST /auth/refresh

Request Body:
{
  "refreshToken": "a1b2c3d4..."
}

Response:
{
  "access_token": "eyJhbGc...",    // New access token (1h expiry)
  "refresh_token": "x9y8z7w6...",  // New refresh token (7d expiry)
  "user": { ... }
}

Error Responses:
- 401: Invalid or expired refresh token
```

### 3. Logout Endpoint

```typescript
POST /auth/logout
Authorization: Bearer <access_token>

Request Body (optional):
{
  "refreshToken": "tokenId.tokenSecret..."
}

Response:
{
  "message": "Logged out successfully"
}

Behavior:
- If refreshToken is provided: revokes that specific token
- If no refreshToken provided: revokes ALL tokens for the user (logout from all devices)
```

## Known Security Features (Implemented 2025-12-11)

### HttpOnly Cookie Storage
**✅ Implemented:** Tokens are now stored in httpOnly cookies instead of localStorage

**Security Benefits:**
- Protected from XSS attacks (JavaScript cannot access cookies)
- SameSite=lax prevents CSRF attacks
- Automatic transmission with API requests
- No manual token management needed

**Cookie Configuration:**
```typescript
// Access token cookie
{
  httpOnly: true,
  secure: true (production only),
  sameSite: 'lax',
  maxAge: 3600000, // 1 hour
  path: '/'
}

// Refresh token cookie
{
  httpOnly: true,
  secure: true (production only),
  sameSite: 'lax',
  maxAge: 604800000, // 7 days
  path: '/'
}
```

## Frontend Integration

### Authentication Flow

**OAuth Callback (No URL Tokens):**
```typescript
// Backend sets cookies automatically
// Frontend just needs to fetch user data
const response = await fetch(`${API_URL}/auth/me`, {
  credentials: 'include' // Important: send cookies
});
const user = await response.json();
```

### Making Authenticated Requests

**All API calls must include credentials:**
```typescript
// Using axios
await axios.get(`${API_URL}/projects`, {
  withCredentials: true
});

// Using fetch
await fetch(`${API_URL}/projects`, {
  credentials: 'include'
});
```

### Token Refresh (Automatic)

**Backend handles refresh via cookies:**
```typescript
// POST /auth/refresh
// - Reads refresh_token from cookie
// - Validates and rotates token
// - Sets new cookies automatically
// - Returns success message
```

### Automatic Token Refresh with Axios Interceptor

**Recommended implementation:**
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Always send cookies
});

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token (cookies updated automatically)
        await axios.post(`${API_URL}/auth/refresh`, {}, {
          withCredentials: true
        });

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

## Token Lifetimes

- **Access Token:** 1 hour
- **Refresh Token:** 7 days

## Code Structure

### New Files
1. `backend/src/auth/refresh-token.entity.ts` - TypeORM entity
2. `backend/src/auth/dto/refresh-token.dto.ts` - DTO for refresh endpoint
3. `backend/src/migrations/1734028800001-AddRefreshTokens.ts` - Database migration

### Modified Files
1. `backend/src/auth/auth.service.ts` - Added refresh token methods
2. `backend/src/auth/auth.controller.ts` - Added refresh endpoint
3. `backend/src/auth/auth.module.ts` - Registered RefreshToken entity

## Service Methods

### AuthService Methods

```typescript
// Generate both access and refresh tokens
async generateTokenPair(user: User): Promise<TokenPair>

// Create a new refresh token (private)
private async createRefreshToken(userId: string): Promise<string>

// Validate refresh token and return new token pair
async refreshTokens(refreshToken: string): Promise<TokenPair>

// Revoke a specific refresh token (internal use)
async revokeRefreshToken(tokenId: string): Promise<void>

// Revoke a refresh token only if it belongs to the user (used in logout)
async revokeRefreshTokenIfOwned(tokenId: string, userId: string): Promise<void>

// Revoke all tokens for a user (logout all devices)
async revokeAllUserTokens(userId: string): Promise<void>

// Cleanup expired tokens (should be run via cron)
async cleanupExpiredTokens(): Promise<void>
```

## Maintenance

### Token Cleanup Cron Job

It's recommended to periodically clean up expired tokens:

```typescript
// In a dedicated cron service
@Cron('0 0 * * *') // Daily at midnight
async cleanupExpiredTokens() {
  await this.authService.cleanupExpiredTokens();
}
```

## Next Steps (P0 Priority)

1. **Migrate to httpOnly cookies** - See TECH_DEBT_TODO.md
   - Remove tokens from localStorage
   - Use secure httpOnly cookies for both access and refresh tokens
   - Prevents XSS attacks

2. **Add frontend interceptor**
   - Implement automatic token refresh in frontend
   - Handle 401 responses gracefully

3. **Add logout endpoint implementation**
   - Properly revoke refresh tokens on logout
   - Consider implementing "logout all devices" functionality

## Testing

### Manual Testing

1. **Login and get tokens:**
```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

2. **Refresh the access token:**
```bash
curl -X POST http://localhost:4000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"YOUR_REFRESH_TOKEN"}'
```

3. **Verify old refresh token is revoked:**
```bash
# Using the old refresh token should return 401
curl -X POST http://localhost:4000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"OLD_REFRESH_TOKEN"}'
```

### Database Verification

```sql
-- Check refresh tokens for a user
SELECT * FROM refresh_tokens WHERE "userId" = 'USER_UUID';

-- Check token expiry
SELECT id, "userId", "expiresAt", 
       CASE WHEN "expiresAt" > NOW() THEN 'Valid' ELSE 'Expired' END as status
FROM refresh_tokens;

-- Count active vs expired tokens
SELECT 
  COUNT(*) FILTER (WHERE "expiresAt" > NOW()) as active,
  COUNT(*) FILTER (WHERE "expiresAt" <= NOW()) as expired
FROM refresh_tokens;
```

## Security Considerations

1. **Token Storage:** Never log or expose plain refresh tokens
2. **HTTPS Only:** Always use HTTPS in production
3. **Rate Limiting:** Consider adding rate limiting to /auth/refresh endpoint
4. **Token Rotation:** Implemented - old tokens are immediately revoked
5. **Expiration:** Both tokens have appropriate expiration times
6. **Hashing:** Refresh tokens are hashed before storage using bcrypt

## References

- [RFC 6749 - OAuth 2.0](https://tools.ietf.org/html/rfc6749)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
