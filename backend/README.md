# Market-Rolik Backend

NestJS-based backend for AI-powered video generation marketplace.

## Features

- 🎬 **Video Generation Pipeline** - Kling AI integration for product videos
- 🎨 **Background Removal** - Photoroom API for image processing
- 🎥 **Server-Side Rendering** - Remotion for dynamic video composition
- 🔐 **Authentication** - Google OAuth integration
- 📦 **Storage** - S3-compatible cloud storage (Timeweb)
- 🐂 **Queue System** - Bull/Redis for async job processing
- 🗃️ **Database** - PostgreSQL with TypeORM

## System Requirements

### For Development
- Node.js 20+
- PostgreSQL 16+
- Redis 7+

### For Video Rendering
The application uses **Remotion** from the `/video` directory which requires:

- ✅ **Chromium/Chrome** - headless browser for rendering
- ✅ **ffmpeg** - video encoding
- ✅ **2GB+ RAM** - for video rendering processes
- ✅ **Built Remotion bundle** - run `npm run build` in `/video` directory

**Important**: Backend requires access to `/video/remotion-build` directory for rendering.

**See [docs/deployment.md](../docs/deployment.md) for detailed setup instructions.**

## Project Setup

```bash
# 1. Install backend dependencies
npm install

# 2. Build Remotion templates (required!)
cd ../video
npm install
npm run build  # Creates remotion-build directory
cd ../backend

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# 4. Run database migrations
npm run migration:run
```

## Environment Variables

Minimal required variables (see `.env.example` for complete list with all options):

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=admin
DATABASE_PASSWORD=root
DATABASE_NAME=market_rolik

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key

# S3 Storage
S3_ENDPOINT=s3.timeweb.cloud
S3_BUCKET=market-rolik
S3_ACCESS_KEY=your-key
S3_SECRET_KEY=your-secret

# AI Services
OPENAI_API_KEY=your-key
KLING_API_KEY=your-key
PHOTOROOM_API_KEY=your-key

# Google OAuth
GOOGLE_CLIENT_ID=your-id
GOOGLE_CLIENT_SECRET=your-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback

# Remotion (optional, defaults provided)
REMOTION_BUNDLE_PATH=./remotion-build
REMOTION_OUTPUT_DIR=./output
REMOTION_COMPOSITION_ID=WbClassic
```

## Run the Application

```bash
# Development with hot-reload
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## Docker Deployment

**For Development** - runs only infrastructure:

```bash
# Start Postgres and Redis
docker-compose up -d

# Run backend locally (for hot-reload)
npm run start:dev
```

**For Production** - see [docs/deployment.md](../docs/deployment.md) for:
- Single server setup with PM2
- Custom Docker image with Remotion
- Kubernetes deployment options

## API Endpoints

### Authentication
- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/google/callback` - OAuth callback
- `GET /auth/me` - Get current user

### Projects
- `GET /projects` - List user projects
- `POST /projects` - Create new project
- `GET /projects/:id` - Get project details
- `DELETE /projects/:id` - Delete project

### Video Generation
- `POST /test-video` - Test video generation (authenticated)
- `POST /test-render` - Test Remotion rendering (authenticated)

### Health
- `GET /health` - Health check endpoint

## Development

```bash
# Run tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Lint
npm run lint

# Format code
npm run format
```

## Video Rendering Stack

- **@remotion/renderer** - Server-side video composition
- **puppeteer-core** - Headless browser control
- **ffmpeg** - Video encoding (via Remotion)

## Queue Processing

Bull queues are used for async operations:

- `video-generation` - Kling AI video generation
- `image-processing` - Photoroom background removal

## Troubleshooting

### "Cannot find module remotion-build"

Ensure you've built the Remotion bundle:

```bash
cd ../video
npm run build
```

The backend looks for `/video/remotion-build` directory relative to project root.

### Video rendering fails

Ensure:
1. Chromium/Chrome is installed on your system
2. ffmpeg is available in PATH
3. `/video` directory is built (`npm run build` in video folder)
4. Sufficient memory allocated (4GB recommended)

See [docs/deployment.md](../docs/deployment.md) for detailed troubleshooting.

## License

UNLICENSED - Private project
