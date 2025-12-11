# Migration to HttpOnly Cookies - Testing Guide

## Summary of Changes

### Backend Changes
1. **auth.controller.ts**: Modified to set httpOnly cookies instead of returning tokens in response
   - `/auth/google/callback` - sets cookies, redirects without tokens in URL
   - `/auth/refresh` - reads from cookie, sets new cookies
   - `/auth/logout` - clears cookies
   
2. **jwt.strategy.ts**: Updated to extract JWT from cookies first, then Authorization header (backward compatibility)

3. **main.ts**: Added cookie-parser middleware

### Frontend Changes
1. **AuthProvider.tsx**: 
   - Removed localStorage operations
   - Added `refreshAuth()` method to fetch user from `/auth/me`
   - Updated `login()` to not require token parameter
   - Updated `logout()` to call backend endpoint

2. **All API calls**: Changed from `Authorization` header to `withCredentials: true`
   - create/page.tsx
   - dashboard/page.tsx
   - useProjectStatus.ts
   - ImagePreviewStep.tsx
   - ProductDataStep.tsx
   - logger.ts

3. **OAuth callback**: Updated to fetch user data without URL tokens

## Testing Checklist

### 1. OAuth Login Flow
- [ ] Click "Sign in with Google"
- [ ] Complete Google OAuth flow
- [ ] Verify redirect to `/auth/callback` (without tokens in URL)
- [ ] Verify user is logged in on dashboard
- [ ] Check browser DevTools → Application → Cookies:
  - `access_token` cookie exists (HttpOnly, SameSite=lax)
  - `refresh_token` cookie exists (HttpOnly, SameSite=lax)

### 2. API Requests
- [ ] Navigate to /create
- [ ] Upload an image (tests authenticated request)
- [ ] Use "Magic Fill" button
- [ ] Verify project creation works
- [ ] Check Network tab - verify cookies are sent automatically

### 3. Token Refresh (Manual Test)
- [ ] Get current `access_token` from DevTools Cookies
- [ ] Delete the `access_token` cookie manually
- [ ] Make any API request
- [ ] Should auto-refresh and retry the request
- [ ] Verify new `access_token` cookie is set

### 4. Logout Flow
- [ ] Click logout button
- [ ] Verify cookies are cleared
- [ ] Verify redirect to home page
- [ ] Try accessing protected routes - should redirect to login

### 5. Token Expiration
- [ ] Login normally
- [ ] Wait 1 hour (or modify JWT_EXPIRES_IN for faster testing)
- [ ] Make API request
- [ ] Should auto-refresh using refresh token
- [ ] Should work seamlessly

### 6. Security Verification
- [ ] Open browser console
- [ ] Try `document.cookie` - should NOT see access_token or refresh_token
- [ ] Try `localStorage` - should NOT contain any tokens
- [ ] Verify XSS protection is working

### 7. Cross-Browser Testing
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Verify cookies work in all browsers

## Rollback Plan

If issues are found:

1. **Backend Rollback**:
   ```bash
   git revert <commit-hash>
   cd backend && npm install
   ```

2. **Frontend Rollback**:
   ```bash
   git revert <commit-hash>
   cd frontend && npm install
   ```

3. **Quick Fix**: JWT strategy already supports Authorization header as fallback, so old clients will continue working during migration

## Environment Variables

Ensure these are set:
```env
# Backend
FRONTEND_URL=http://localhost:3000 (or production URL)
NODE_ENV=production (for secure cookies in prod)
JWT_SECRET=<your-secret>
JWT_AUDIENCE=market-rolik-app
JWT_ISSUER=market-rolik-api

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:4000 (or production URL)
```

## Production Deployment Notes

1. **HTTPS Required**: `secure: true` flag requires HTTPS in production
2. **Domain Matching**: Ensure frontend and backend are on same domain or configure CORS properly
3. **SameSite**: Set to 'lax' for cross-subdomain support, 'strict' for maximum security
4. **Cookie Size**: Max 4KB - our tokens fit comfortably

## Success Criteria

- ✅ No tokens in localStorage
- ✅ No tokens in URL parameters
- ✅ All API requests work with cookies
- ✅ Automatic token refresh works
- ✅ Logout clears cookies properly
- ✅ XSS attacks cannot steal tokens
- ✅ No console errors
- ✅ Backward compatible with Authorization header
