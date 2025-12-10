# Environment Validation

This directory contains configuration and validation schemas for environment variables.

## env.validation.ts

Joi validation schema that validates all required environment variables at application startup.

### Features

- **Fail-fast validation**: Application will not start if required environment variables are missing or invalid
- **Strong secret validation**: Prevents use of placeholder values (e.g., "your-secret-key")
- **Type validation**: Ensures ports are valid numbers, URLs are properly formatted, etc.
- **Minimum security requirements**: JWT_SECRET must be at least 32 characters
- **Helpful error messages**: Clear feedback on what's wrong with configuration

### Validated Variables

#### Required Variables
- `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME`
- `REDIS_HOST`, `REDIS_PORT`
- `JWT_SECRET` (minimum 32 characters, cannot be placeholder)
- `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_PUBLIC_URL`
- All AI service API keys (OpenAI, Gemini, PiAPI, Kling, Photoroom)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
- `FRONTEND_URL`

#### Optional Variables (with defaults)
- `NODE_ENV` (default: "development")
- `VIDEO_POLL_DELAY_MS` (default: 10000)
- `VIDEO_MAX_POLL_ATTEMPTS` (default: 30)
- `REMOTION_BUNDLE_PATH`, `REMOTION_OUTPUT_DIR`, `REMOTION_COMPOSITION_ID`
- `THROTTLE_TTL`, `THROTTLE_LIMIT`
- Proxy configuration (all optional)

### Error Handling

If validation fails, the application will:
1. Display all validation errors (not just the first one)
2. Show helpful error messages indicating which variables are missing/invalid
3. Exit immediately with a non-zero status code
4. Prevent the application from starting in an unsafe state

### Example Error Output

```
Error: Config validation error: "JWT_SECRET" must be at least 32 characters long. "S3_ACCESS_KEY" cannot be a placeholder value. "OPENAI_API_KEY" is required
```

### Testing Validation

To test that validation works:

1. Rename `.env` temporarily
2. Try to start the application: `npm run start:dev`
3. You should see validation errors
4. Restore `.env` and verify app starts normally

### Adding New Variables

To add a new required environment variable:

1. Add it to `.env.example` with a descriptive placeholder
2. Add validation rule to `env.validation.ts`:
   ```typescript
   MY_NEW_VAR: Joi.string().required()
   ```
3. Update this README with the new variable
