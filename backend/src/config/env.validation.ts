import * as Joi from 'joi';

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
    .min(32)
    .required()
    .invalid('your-secret-key', 'your-secret-key-change-in-production')
    .messages({
      'string.min': 'JWT_SECRET must be at least 32 characters long',
      'any.invalid': 'JWT_SECRET cannot be a placeholder value. Generate a strong secret for production.',
    }),

  // S3 Storage Configuration
  S3_ENDPOINT: Joi.string().required(),
  S3_REGION: Joi.string().required(),
  S3_BUCKET: Joi.string().required(),
  S3_ACCESS_KEY: Joi.string()
    .required()
    .invalid('your-access-key')
    .messages({
      'any.invalid': 'S3_ACCESS_KEY cannot be a placeholder value',
    }),
  S3_SECRET_KEY: Joi.string()
    .required()
    .invalid('your-secret-key')
    .messages({
      'any.invalid': 'S3_SECRET_KEY cannot be a placeholder value',
    }),
  S3_PUBLIC_URL: Joi.string().uri().required(),

  // AI Services API Keys
  OPENAI_API_KEY: Joi.string()
    .required()
    .invalid('your-openai-key')
    .messages({
      'any.invalid': 'OPENAI_API_KEY cannot be a placeholder value',
    }),
  GEMINI_API_KEY: Joi.string()
    .required()
    .invalid('your-gemini-key')
    .messages({
      'any.invalid': 'GEMINI_API_KEY cannot be a placeholder value',
    }),
  PIAPI_API_KEY: Joi.string()
    .required()
    .invalid('your-piapi-key')
    .messages({
      'any.invalid': 'PIAPI_API_KEY cannot be a placeholder value',
    }),
  KLING_API_KEY: Joi.string()
    .required()
    .invalid('your-kling-key')
    .messages({
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
  REMOTION_BUNDLE_PATH: Joi.string().default('../video/remotion-build'),
  REMOTION_OUTPUT_DIR: Joi.string().default('./output'),
  REMOTION_COMPOSITION_ID: Joi.string().default('WbClassic'),

  // Rate Limiting (optional)
  THROTTLE_TTL: Joi.number().integer().min(1000).default(60000),
  THROTTLE_LIMIT: Joi.number().integer().min(1).default(10),

  // Proxy Configuration (optional)
  PROXY_HOST: Joi.string().optional().allow(''),
  PROXY_PORT: Joi.number().port().optional().allow(''),
  PROXY_USER: Joi.string().optional().allow(''),
  PROXY_PASSWORD: Joi.string().optional().allow(''),
});
