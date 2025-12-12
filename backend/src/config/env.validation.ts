/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import * as Joi from 'joi';
import {
  JWT_SECRET_MIN_LENGTH,
  JWT_SECRET_FORBIDDEN_VALUES,
  JWT_SECRET_GENERATION_COMMAND,
} from './jwt-validation.constants';

/**
 * Environment variable validation schema
 * Ensures all required environment variables are set at application startup
 * Fails fast if any required variables are missing or invalid
 */
export const envValidationSchema = Joi.object({
  // Environment
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development'),

  // Database Configuration
  DATABASE_HOST: Joi.string().required(),
  DATABASE_PORT: Joi.number().port().default(5432),
  DATABASE_USER: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().required(),
  DATABASE_NAME: Joi.string().required(),

  // Redis Configuration
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().port().default(6379),

  // JWT Authentication
  JWT_SECRET: Joi.string()
    .min(JWT_SECRET_MIN_LENGTH)
    .required()
    .invalid(...JWT_SECRET_FORBIDDEN_VALUES)
    .messages({
      'string.min': `JWT_SECRET must be at least ${JWT_SECRET_MIN_LENGTH} characters long for security`,
      'any.invalid': `JWT_SECRET cannot be a placeholder value. Generate a strong secret using: ${JWT_SECRET_GENERATION_COMMAND}`,
    }),

  // S3 Storage Configuration
  S3_ENDPOINT: Joi.string().required(),
  S3_REGION: Joi.string().required(),
  S3_BUCKET: Joi.string().required(),
  S3_ACCESS_KEY: Joi.string().required().invalid('your-access-key').messages({
    'any.invalid': 'S3_ACCESS_KEY cannot be a placeholder value',
  }),
  S3_SECRET_KEY: Joi.string().required().invalid('your-secret-key').messages({
    'any.invalid': 'S3_SECRET_KEY cannot be a placeholder value',
  }),

  // AI Services API Keys
  GEMINI_API_KEY: Joi.string().required().invalid('your-gemini-key').messages({
    'any.invalid': 'GEMINI_API_KEY cannot be a placeholder value',
  }),
  PIAPI_API_KEY: Joi.string().required().invalid('your-piapi-key').messages({
    'any.invalid': 'PIAPI_API_KEY cannot be a placeholder value',
  }),
  KLING_API_KEY: Joi.string().required().invalid('your-kling-key').messages({
    'any.invalid': 'KLING_API_KEY cannot be a placeholder value',
  }),
  PHOTOROOM_API_KEY: Joi.string()
    .required()
    .invalid('your-photoroom-key')
    .messages({
      'any.invalid': 'PHOTOROOM_API_KEY cannot be a placeholder value',
    }),

  // Google OAuth
  GOOGLE_CLIENT_ID: Joi.string()
    .required()
    .invalid('your-google-client-id')
    .messages({
      'any.invalid': 'GOOGLE_CLIENT_ID cannot be a placeholder value',
    }),
  GOOGLE_CLIENT_SECRET: Joi.string()
    .required()
    .invalid('your-google-client-secret')
    .messages({
      'any.invalid': 'GOOGLE_CLIENT_SECRET cannot be a placeholder value',
    }),
  GOOGLE_CALLBACK_URL: Joi.string().uri().required(),

  // Frontend URL
  FRONTEND_URL: Joi.string().uri().required(),

  // Video Generation Configuration
  VIDEO_POLL_DELAY_MS: Joi.number().integer().min(1000).default(10000),
  VIDEO_MAX_POLL_ATTEMPTS: Joi.number().integer().min(1).default(30),

  // Remotion Configuration
  REMOTION_BUNDLE_PATH: Joi.string().default('./remotion-build'),
  REMOTION_OUTPUT_DIR: Joi.string().default('./output'),
  REMOTION_COMPOSITION_ID: Joi.string().default('WbClassic'),

  // Rate Limiting (optional)
  THROTTLE_TTL: Joi.number().integer().min(1000).default(60000),
  THROTTLE_LIMIT: Joi.number().integer().min(1).default(10),

  // Trust Proxy Configuration (for rate limiting and security)
  // See: https://expressjs.com/en/guide/behind-proxies.html
  TRUST_PROXY: Joi.string()
    .optional()
    .valid('true', 'false', 'loopback', 'cloudflare')
    .default('loopback'),
  // Custom proxy IPs/CIDRs (comma-separated)
  // Examples: "10.0.0.1", "172.17.0.0/16", "10.0.0.1,192.168.1.0/24"
  TRUST_PROXY_IPS: Joi.string()
    .optional()
    .allow('')
    .custom((value, helpers) => {
      if (!value || value === '') return value;

      const entries = value
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const entry of entries) {
        // Validate each entry as IPv4 with optional CIDR
        const validation = Joi.string()
          .ip({ version: ['ipv4'], cidr: 'optional' })
          .validate(entry);

        if (validation.error) {
          return helpers.error('any.invalid', {
            message: `"${entry}" is not a valid IPv4 address or CIDR range. Example: "10.0.0.1" or "172.17.0.0/16"`,
          });
        }
      }

      return value;
    }),

  // Proxy Configuration (optional)
  PROXY_HOST: Joi.string().optional().allow(''),
  PROXY_PORT: Joi.number().port().optional().allow(''),
  PROXY_USER: Joi.string().optional().allow(''),
  PROXY_PASSWORD: Joi.string().optional().allow(''),
});
