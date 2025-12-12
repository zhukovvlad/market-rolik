/**
 * JWT Secret validation constants
 * Centralized source of truth for JWT_SECRET validation rules
 * Used by both env.validation.ts and auth.module.ts
 */

/**
 * Minimum required length for JWT_SECRET (in characters)
 */
export const JWT_SECRET_MIN_LENGTH = 32;

/**
 * List of disallowed placeholder values and keywords
 * These strings cannot appear anywhere in the JWT_SECRET
 */
export const JWT_SECRET_PLACEHOLDER_KEYWORDS = [
  'your-secret',
  'your-jwt',
  'jwt-secret',
  'change-me',
  'changeme',
  'placeholder',
  'example',
  'test-secret',
] as const;

/**
 * Exact values that are explicitly forbidden
 */
export const JWT_SECRET_FORBIDDEN_VALUES = [
  'your-secret-key',
  'your-secret-key-change-in-production',
  'CHANGE_ME_GENERATE_WITH_CRYPTO_RANDOM_BYTES_64',
  'secret',
  'jwt-secret',
  'your-jwt-secret',
  'change-me',
  'changeme',
] as const;

/**
 * Command to generate a cryptographically secure JWT secret
 */
export const JWT_SECRET_GENERATION_COMMAND =
  'node backend/scripts/generate-jwt-secret.js';

/**
 * Alternative command (for use in backend directory)
 */
export const JWT_SECRET_GENERATION_COMMAND_ALT =
  'node scripts/generate-jwt-secret.js';

/**
 * Helper function to check if a JWT secret contains placeholder keywords
 * @param secret - The JWT secret to validate
 * @returns true if the secret appears to be a placeholder
 */
export function isPlaceholderSecret(secret: string): boolean {
  const lowerSecret = secret.toLowerCase();
  return JWT_SECRET_PLACEHOLDER_KEYWORDS.some((keyword) =>
    lowerSecret.includes(keyword.toLowerCase()),
  );
}

/**
 * Helper function to validate JWT secret
 * @param secret - The JWT secret to validate
 * @returns Validation error message or null if valid
 */
export function validateJwtSecret(secret: string): string | null {
  if (!secret) {
    return 'JWT_SECRET is not defined in environment variables';
  }

  if (secret.length < JWT_SECRET_MIN_LENGTH) {
    return `JWT_SECRET must be at least ${JWT_SECRET_MIN_LENGTH} characters long for security`;
  }

  // Reject any explicitly forbidden exact values
  if (
    JWT_SECRET_FORBIDDEN_VALUES.includes(
      secret as (typeof JWT_SECRET_FORBIDDEN_VALUES)[number],
    )
  ) {
    return `JWT_SECRET cannot be a placeholder value. Generate a strong secret using: ${JWT_SECRET_GENERATION_COMMAND}`;
  }

  if (isPlaceholderSecret(secret)) {
    return `JWT_SECRET appears to be a placeholder value. Generate a cryptographically secure secret using: ${JWT_SECRET_GENERATION_COMMAND}`;
  }

  return null;
}
