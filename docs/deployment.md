# Deployment Guide for Market-Rolik

## Architecture Overview

Market-Rolik uses a monorepo structure:
- `/backend` - NestJS API server
- `/frontend` - Next.js web application  
- `/video` - Remotion video templates

**Important**: The backend renders videos using Remotion templates from `/video` directory. Both need to be available at runtime.

## Infrastructure Requirements for Video Rendering

This application uses **Remotion** for server-side video rendering, which requires:

### System Dependencies

1. **Chromium/Chrome** - for headless browser rendering
2. **ffmpeg** - for video encoding
3. **Sufficient RAM** - minimum 2GB, recommended 4GB+ for video rendering
4. **Node.js 20+** - with all dependencies from both `/backend` and `/video`

### Development Setup

#### Local Development (Recommended)

```bash
# 1. Install dependencies for all parts
cd backend && npm install
cd ../video && npm install
cd ../frontend && npm install

# 2. Build Remotion bundle (required for rendering)
cd video
npm run build

# 3. Start infrastructure with Docker Compose
docker-compose up -d postgres redis

# 4. Run backend in development
cd backend
npm run start:dev
```

The backend will access Remotion templates from `../video/remotion-build` directory.

#### Full Docker Setup (Development)

For local development with Docker:

```bash
docker-compose up -d
```

This starts only Postgres and Redis. Run backend locally for hot-reload.

### Production Deployment

#### Option 1: Single Server Deployment

On a VPS or dedicated server:

**1. Install system dependencies:**

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y \
    chromium-browser \
    ffmpeg \
    postgresql-client \
    redis-tools

# Set Chromium path for Puppeteer
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

**2. Install Node.js and dependencies:**

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
git clone https://github.com/zhukovvlad/market-rolik.git
cd market-rolik

# Install all dependencies
cd backend && npm ci
cd ../video && npm ci
cd ../frontend && npm ci
```

**3. Build Remotion templates:**

```bash
cd video
npm run build  # Creates remotion-build directory
```

**4. Configure environment:**

```bash
cd backend
cp .env.example .env
# Edit .env with production values
```

**5. Run with PM2:**

```bash
# Install PM2
npm install -g pm2

# Build backend
cd backend
npm run build

# Start backend
pm2 start dist/main.js --name "market-rolik-api"

# Start frontend (optional, if serving frontend from same server)
cd ../frontend
npm run build
pm2 start npm --name "market-rolik-web" -- start

# Save PM2 config and enable startup
pm2 save
pm2 startup
```

**6. Setup Nginx (optional, for reverse proxy):**

```nginx
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeouts for video rendering
        proxy_read_timeout 600s;
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
    }
}
```

#### Option 2: Docker Deployment with Custom Image

If you need to containerize everything, create a Dockerfile:

```dockerfile
FROM node:20-bullseye

# Install system dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    ffmpeg \
    fonts-liberation \
    fonts-noto-color-emoji \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Copy all project files
COPY backend ./backend
COPY video ./video

# Install dependencies
RUN cd backend && npm ci
RUN cd video && npm ci && npm run build

WORKDIR /app/backend

EXPOSE 3001
CMD ["npm", "run", "start:prod"]
```

**Build and run:**

```bash
docker build -t market-rolik-backend .
docker run -d \
  --name market-rolik-api \
  -p 3001:3001 \
  --env-file backend/.env \
  -v $(pwd)/backend/output:/app/backend/output \
  -v $(pwd)/backend/logs:/app/backend/logs \
  --shm-size=2g \
  market-rolik-backend
```

### Environment Variables

Create a `.env` file in the backend directory (see `backend/.env.example` for full list):

```env
NODE_ENV=production

# Database
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USER=admin
DATABASE_PASSWORD=root
DATABASE_NAME=market_rolik

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key-here

# S3 Storage (Timeweb)
S3_ENDPOINT=s3.timeweb.cloud
S3_REGION=ru-1
S3_BUCKET=market-rolik
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_PUBLIC_URL=https://your-bucket.timeweb.cloud

# AI Services
OPENAI_API_KEY=your-openai-key
GEMINI_API_KEY=your-gemini-key
PIAPI_API_KEY=your-piapi-key
KLING_API_KEY=your-kling-key
PHOTOROOM_API_KEY=your-photoroom-key

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=https://your-domain.com/auth/google/callback
FRONTEND_URL=https://your-domain.com

# Video Generation
VIDEO_POLL_DELAY_MS=10000
VIDEO_MAX_POLL_ATTEMPTS=30

# Remotion Configuration (optional, defaults provided)
REMOTION_BUNDLE_PATH=../video/remotion-build
REMOTION_OUTPUT_DIR=./output
REMOTION_COMPOSITION_ID=WbClassic
```

## CI/CD Considerations

### GitHub Actions / GitLab CI

If using CI/CD, ensure your pipeline image includes:

```dockerfile
# Example CI image with Chromium support
FROM node:20-bullseye

RUN apt-get update && apt-get install -y \
    chromium \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
```

### Resource Limits

Video rendering is CPU/Memory intensive. Recommended container limits:

```yaml
# docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4G
        reservations:
          cpus: '1.0'
          memory: 2G
```

### Kubernetes Deployment

If deploying to Kubernetes, ensure:

1. **Node resources**: Nodes should have sufficient CPU/RAM
2. **Shared memory**: Mount `/dev/shm` with adequate size
3. **Security context**: May need privileged mode or specific capabilities for Chromium

Example pod spec:

```yaml
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: backend
    image: market-rolik-backend:latest
    resources:
      requests:
        memory: "2Gi"
        cpu: "1000m"
      limits:
        memory: "4Gi"
        cpu: "2000m"
    volumeMounts:
    - name: dshm
      mountPath: /dev/shm
  volumes:
  - name: dshm
    emptyDir:
      medium: Memory
      sizeLimit: 2Gi
```

## Monitoring and Observability

The application includes comprehensive logging for video pipeline.

### Key Metrics to Monitor

1. **Pipeline Duration**
   ```log
   🎉 Pipeline COMPLETED for Project abc-123 in 120.8s (Parallel: 80.2s, Render: 35.3s)
   ```

2. **Kling API Performance**
   ```log
   ✅ Kling Task kling-789 completed in 78.5s after 8 attempts
   ```

3. **Memory Usage**
   - Monitor with: `pm2 monit` or `htop`
   - Normal: 500MB-1GB baseline
   - During render: 1.5GB-3GB spike

4. **Queue Depth**
   ```bash
   # Connect to Redis
   redis-cli
   > LLEN bull:video-generation:wait
   ```

5. **Failed Jobs**
   ```log
   ❌ Pipeline FAILED for Project xyz after 45.2s: Kling Timeout
   ```

### Log Levels

- `log` - Important milestones (pipeline start/finish, major steps)
- `debug` - Detailed progress (file cleanup, intermediate steps)  
- `warn` - Recoverable issues (Photoroom fallback, file deletion failed)
- `error` - Failures (timeouts, API errors, pipeline failures)

### Recommended Monitoring Stack

For production:

1. **Logging**: Winston/Pino with ELK Stack or Loki
2. **Metrics**: Prometheus + Grafana for visualization
3. **Alerting**: Alert on failed pipelines, high queue depth, memory > 80%
4. **Tracing**: Use Job IDs to trace requests through pipeline

## Troubleshooting

### "Cannot find remotion-build" error

Ensure the Remotion bundle is built and accessible:

```bash
cd video
npm run build
ls -la remotion-build/  # Should show bundle.js and index.html
```

The backend looks for the bundle at the path specified in `REMOTION_BUNDLE_PATH` env variable (default: `../video/remotion-build`).

### "No usable sandbox" error

If you see sandbox errors from Chromium, the current configuration already handles this with proper `chromiumOptions`. If issues persist, check:

1. Chromium is installed: `which chromium` or `which chromium-browser`
2. Sufficient shared memory available (check `/dev/shm` size)
3. User has permissions to run Chromium

### Out of memory errors

Video rendering is memory-intensive. Solutions:

1. Increase server RAM (recommended: 4GB+)
2. Reduce concurrent video jobs in Bull queue:
   ```typescript
   // In queues.module.ts
   BullModule.registerQueue({
     name: 'video-generation',
     limiter: {
       max: 1,  // Only 1 video at a time
       duration: 1000,
     },
   })
   ```
3. Monitor memory with: `pm2 monit`

### Kling API timeouts

If video generation times out:

1. Check `VIDEO_MAX_POLL_ATTEMPTS` and `VIDEO_POLL_DELAY_MS` in `.env`
2. Review logs for actual task status from Kling
3. Consider increasing timeout: `VIDEO_MAX_POLL_ATTEMPTS=60` (10 minutes)

Logs will show:
```log
⏱️ Kling Task abc123 TIMEOUT after 30 attempts (300.5s). Last status: processing
```

### Remotion rendering fails

Check logs for specific errors:

```bash
pm2 logs market-rolik-api --lines 100
```

Common issues:
- Missing fonts: Install `fonts-liberation fonts-noto-color-emoji`
- Invalid URL in `mainImage`: Must be valid URL (validated by zod)
- Invalid color format: Must be hex color like `#4f46e5`

### Missing fonts

If text doesn't render correctly, ensure font packages are installed:

```dockerfile
RUN apt-get install -y fonts-liberation fonts-noto-color-emoji
```

## Production Checklist

- [ ] System dependencies installed (Chromium, ffmpeg, Node.js 20)
- [ ] `PUPPETEER_EXECUTABLE_PATH` configured correctly
- [ ] Remotion bundle built (`cd video && npm run build`)
- [ ] Environment variables properly configured (`.env` from `.env.example`)
- [ ] S3/Storage configured for video output
- [ ] Server memory sufficient (4GB+ recommended)
- [ ] PM2 configured with proper resource limits
- [ ] Logging and monitoring set up (check logs/, consider ELK/Grafana)
- [ ] Bull queue workers configured for video jobs
- [ ] PostgreSQL backup strategy in place
- [ ] Rate limiting enabled on `/test-render` and video endpoints
- [ ] JWT authentication working on protected endpoints
