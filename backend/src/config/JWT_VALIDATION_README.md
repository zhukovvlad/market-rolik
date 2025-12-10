# JWT Secret Validation

This directory contains centralized JWT secret validation logic used across the application.

## Files

### `jwt-validation.constants.ts`
Centralized source of truth for JWT_SECRET validation rules. Contains:
- **Minimum length requirement** (32 characters)
- **Forbidden values** and placeholder keywords
- **Generation command** for creating secure secrets
- **Helper functions** for validation

### `env.validation.ts`
Joi schema for environment variable validation at application startup. Uses constants from `jwt-validation.constants.ts`.

## Usage

### Generating a JWT Secret

Use the helper script:
```bash
# From project root
node backend/scripts/generate-jwt-secret.js

# From backend directory
node scripts/generate-jwt-secret.js
```

Or manually:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

### Validation Rules

JWT_SECRET must:
1. Be at least 32 characters long (recommended: 64+ bytes base64-encoded)
2. Not be a placeholder value (e.g., "your-secret-key", "change-me")
3. Not contain common placeholder keywords (e.g., "your-jwt", "test-secret")

### Where Validation Happens

1. **Startup validation** (`env.validation.ts`): 
   - Joi schema validates all environment variables
   - Fails fast if JWT_SECRET is invalid
   - Uses `JWT_SECRET_FORBIDDEN_VALUES` and `JWT_SECRET_MIN_LENGTH`

2. **Runtime validation** (`auth.module.ts`):
   - Additional defense-in-depth check when JwtModule initializes
   - Uses `validateJwtSecret()` helper function
   - Checks for placeholder keywords in addition to exact forbidden values

## Adding New Validation Rules

To add new forbidden values or keywords:

1. Update `jwt-validation.constants.ts`:
   - Add to `JWT_SECRET_FORBIDDEN_VALUES` for exact matches
   - Add to `JWT_SECRET_PLACEHOLDER_KEYWORDS` for substring checks

2. Both `env.validation.ts` and `auth.module.ts` will automatically use the updated rules.

## Example Error Messages

```
JWT_SECRET must be at least 32 characters long for security
```

```
JWT_SECRET cannot be a placeholder value. Generate a strong secret using: node backend/scripts/generate-jwt-secret.js
```

```
JWT_SECRET appears to be a placeholder value. Generate a cryptographically secure secret using: node backend/scripts/generate-jwt-secret.js
```
