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
- Composite index on `(userId, expiresAt)` for efficient cleanup and validation queries

**Foreign Key:**
- CASCADE delete on user deletion to clean up orphaned tokens

## Security Features

### 1. Token Hashing
- Refresh tokens are hashed using bcrypt before storage
- Only the hash is stored in the database
- Plain tokens are never stored, similar to password handling

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
  "refreshToken": "a1b2c3d4..."
}

Response:
{
  "message": "Logged out successfully"
}

Note: Currently allows natural token expiration.
To implement logout-all-devices, uncomment:
await this.authService.revokeAllUserTokens(req.user.id);
```

## Frontend Integration

### Storing Tokens

**Current Implementation:**
- Tokens stored in localStorage (P0 task: migrate to httpOnly cookies)

**Recommended Flow:**
```typescript
// On login/register success
const { access_token, refresh_token } = response.data;
localStorage.setItem('token', access_token);
localStorage.setItem('refreshToken', refresh_token);
```

### Using Refresh Tokens

```typescript
// When access token expires (401 response)
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!refreshToken) {
    // Redirect to login
    return;
  }
  
  try {
    const response = await fetch('/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    
    if (!response.ok) {
      // Refresh token invalid/expired - redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
      return;
    }
    
    const data = await response.json();
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('refreshToken', data.refresh_token);
    
    // Retry the original request with new token
  } catch (error) {
    // Handle error - redirect to login
  }
}
```

### Axios Interceptor Example

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL
});

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        window.location.href = '/login';
        return Promise.reject(error);
      }
      
      try {
        const { data } = await axios.post('/auth/refresh', { refreshToken });
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('refreshToken', data.refresh_token);
        
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.clear();
        window.location.href = '/login';
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

// Revoke a specific refresh token
async revokeRefreshToken(tokenId: string): Promise<void>

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
