import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { VideoCompositionInput } from './interfaces/video-composition.interface';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class RenderService {
  private readonly logger = new Logger(RenderService.name);
  private lastLoggedProgress = 0;
  private readonly MAX_DIMENSION = 4096;
  private readonly MIN_DIMENSION = 128;

  constructor(private readonly configService: ConfigService) {}

  async renderVideo(data: VideoCompositionInput): Promise<string> {
    this.lastLoggedProgress = 0;
    this.logger.log('🎬 Starting Render process...');

    // Configuration from environment
    const bundleLocation = this.configService.get<string>(
      'REMOTION_BUNDLE_PATH',
      path.join(process.cwd(), 'remotion-build'),
    );
    const outputDir = this.configService.get<string>(
      'REMOTION_OUTPUT_DIR',
      path.join(process.cwd(), 'output'),
    );
    const compositionId = this.configService.get<string>(
      'REMOTION_COMPOSITION_ID',
      'WbClassic',
    );

    // Sanity check for bundle existence
    if (!fs.existsSync(bundleLocation)) {
      throw new Error(
        `❌ Remotion bundle not found at: ${bundleLocation}. ` +
          `Please run "npm run build:remotion" or check REMOTION_BUNDLE_PATH.`,
      );
    }

    // Log essential input props for debugging (avoid logging full prompt/text)
    this.logger.debug(
      `🎬 Remotion Input Props: ${JSON.stringify({
        title: data.title?.slice(0, 30),
        uspsCount: data.usps?.length || 0,
        hasAudio: !!data.audioUrl,
        hasMusic: !!data.backgroundMusicUrl,
        primaryColor: data.primaryColor,
      })}`,
    );

    // Select composition
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: compositionId,
      inputProps: data,
    });

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `video-${Date.now()}.mp4`;
    const outputFile = path.join(outputDir, fileName);

    // Validate and clamp dimensions to sane bounds, handle NaN/invalid inputs
    const inputWidth =
      typeof data.width === 'number' && isFinite(data.width)
        ? data.width
        : composition.width;
    const inputHeight =
      typeof data.height === 'number' && isFinite(data.height)
        ? data.height
        : composition.height;
    const safeWidth = Math.max(
      this.MIN_DIMENSION,
      Math.min(this.MAX_DIMENSION, inputWidth),
    );
    const safeHeight = Math.max(
      this.MIN_DIMENSION,
      Math.min(this.MAX_DIMENSION, inputHeight),
    );

    // Log when dimensions are adjusted for debugging
    if (inputWidth !== safeWidth || inputHeight !== safeHeight) {
      this.logger.warn(
        `⚠️ Dimensions adjusted: ${inputWidth}x${inputHeight} → ${safeWidth}x${safeHeight}`,
      );
    }

    // Render video with properly typed chromiumOptions
    await renderMedia({
      composition: {
        ...composition,
        width: safeWidth,
        height: safeHeight,
      },
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: outputFile,
      inputProps: data,
      muted: false, // CRITICAL: Enable audio in rendered video
      timeoutInMilliseconds: 120000,
      chromiumOptions: {
        enableMultiProcessOnLinux: true,
        headless: true,
        gl: 'swiftshader',
      },
      puppeteerInstance: undefined,
      onProgress: ({ progress }) => {
        const percent = Math.floor(progress * 10) * 10;
        if (percent > this.lastLoggedProgress) {
          this.lastLoggedProgress = percent;
          this.logger.log(
            `Rendering progress: ${(progress * 100).toFixed(0)}%`,
          );
        }
      },
    });

    this.logger.log(`✅ Render done: ${outputFile}`);
    return outputFile;
  }
}
