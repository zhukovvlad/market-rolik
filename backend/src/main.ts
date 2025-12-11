import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';

import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // Configure trust proxy to safely extract real client IP from reverse proxy headers
  // This prevents IP spoofing attacks and enables correct rate limiting
  const trustProxy = process.env.TRUST_PROXY || 'loopback';
  const trustProxyIps = process.env.TRUST_PROXY_IPS;
  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  
  if (trustProxyIps) {
    // Use custom proxy IPs/CIDRs (comma-separated)
    const proxyList = trustProxyIps
      .split(',')
      .map(ip => ip.trim())
      .filter(ip => ip.length > 0);
    
    if (proxyList.length === 0) {
      logger.warn('⚠️  TRUST_PROXY_IPS is set but empty. Falling back to loopback.');
      app.set('trust proxy', 'loopback');
    } else {
      app.set('trust proxy', proxyList);
      logger.log(`Trust proxy configured with custom IPs: ${proxyList.join(', ')}`);
    }
  } else if (trustProxy === 'true') {
    // Trust first proxy (use with caution in production)
    if (process.env.NODE_ENV === 'production') {
      logger.warn(
        '⚠️  TRUST_PROXY=true trusts the first proxy unconditionally. ' +
        'Consider using TRUST_PROXY_IPS for explicit IP configuration in production.'
      );
    }
    app.set('trust proxy', true);
  } else if (trustProxy === 'false') {
    // Explicitly disable trust proxy - app is directly exposed to internet
    app.set('trust proxy', false);
    logger.warn(
      '⚠️  Trust proxy is disabled. Only use this if the app is directly exposed to the internet ' +
      'without any reverse proxy. Rate limiting will use socket IP addresses.'
    );
  } else if (trustProxy === 'cloudflare') {
    // Trust Cloudflare IPs
    app.set('trust proxy', 'loopback, cloudflare');
  } else {
    // Default: trust only loopback (localhost)
    app.set('trust proxy', 'loopback');
  }

  // Enable cookie parser for httpOnly cookies
  app.use(cookieParser());

  // Enable global validation pipe with comprehensive security options
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties exist
      transform: true, // Transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: false, // Require explicit @Type() decorators
      },
    }),
  );

  // Enable CORS for frontend with credentials support
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  });


  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
  if (isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: ${process.env.PORT}`);
  }
  await app.listen(port);
}
bootstrap();
