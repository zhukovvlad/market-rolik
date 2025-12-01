import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { VideoCompositionInput } from './interfaces/video-composition.interface';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class RenderService {
  private readonly logger = new Logger(RenderService.name);

  constructor(private readonly configService: ConfigService) {}

  async renderVideo(data: VideoCompositionInput): Promise<string> {
    this.logger.log('🎬 Starting Render process...');

    // Configuration from environment
    const bundleLocation = this.configService.get<string>(
      'REMOTION_BUNDLE_PATH',
      path.join(process.cwd(), '..', 'video', 'remotion-build'),
    );
    const outputDir = this.configService.get<string>(
      'REMOTION_OUTPUT_DIR',
      path.join(process.cwd(), 'output'),
    );
    const compositionId = this.configService.get<string>(
      'REMOTION_COMPOSITION_ID',
      'WbClassic',
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

    // Render video with properly typed chromiumOptions
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: outputFile,
      inputProps: data,
      chromiumOptions: {
        enableMultiProcessOnLinux: true,
        headless: true,
        gl: 'swiftshader',
      },
      puppeteerInstance: undefined,
      onProgress: ({ progress }) => {
        if (progress % 0.1 < 0.01) {
          // Log every 10%
          this.logger.log(`Rendering progress: ${(progress * 100).toFixed(0)}%`);
        }
      },
    });

    this.logger.log(`✅ Render done: ${outputFile}`);
    return outputFile;
  }
}