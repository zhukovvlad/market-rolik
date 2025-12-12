// src/common/tts.service.ts

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { URLSearchParams } from 'url';

export interface TtsResult {
  buffer: Buffer;
  mimeType: string;
  format: 'mp3' | 'wav';
}

@Injectable()
export class TtsService {
  private readonly logger = new Logger(TtsService.name);

  constructor(private readonly configService: ConfigService) {}

  async generateSpeech(
    text: string,
    voice: string = 'ermil',
  ): Promise<TtsResult | null> {
    const apiKey = this.configService.get<string>('YANDEX_API_KEY');

    // 1. MOCK MODE (Если ключа нет или он 'mock')
    if (!apiKey || apiKey === 'mock') {
      this.logger.warn(
        `⚠️ TTS Mock: Downloading test audio for "${text.slice(0, 10)}..."`,
      );

      // Use configurable test audio URL or fallback to default
      const testAudioUrl = this.configService.get<string>(
        'TTS_MOCK_AUDIO_URL',
        'https://www.computerhope.com/jargon/m/example.mp3',
      );

      try {
        const response = await axios.get(testAudioUrl, {
          responseType: 'arraybuffer',
          timeout: 10000,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'audio/mpeg,audio/*,*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            Referer: 'https://www.computerhope.com/',
          },
        });

        // Validate HTTP response
        if (response.status !== 200) {
          this.logger.error(
            `Mock audio request returned status ${response.status}`,
          );
          return null;
        }

        const contentType = response.headers['content-type'] || '';
        if (!contentType.startsWith('audio/')) {
          this.logger.error(
            `Mock audio returned invalid content-type: ${contentType}`,
          );
          return null;
        }

        this.logger.log(
          `✅ Downloaded test audio (${Buffer.from(response.data).length} bytes)`,
        );
        return {
          buffer: Buffer.from(response.data),
          mimeType: 'audio/mpeg',
          format: 'mp3',
        };
      } catch (err) {
        this.logger.error(
          `Failed to download test audio from ${testAudioUrl}: ${err instanceof Error ? err.message : String(err)}`,
        );
        this.logger.warn(
          'Falling back to null - video will have background music only',
        );
        return null;
      }
    }

    // 2. VALIDATION
    const folderId = this.configService.get<string>('YANDEX_FOLDER_ID');
    if (!folderId) {
      throw new Error(
        '❌ TTS Configuration Error: YANDEX_FOLDER_ID is missing. Please check your .env file.',
      );
    }

    // 3. YANDEX SPEECHKIT V1
    this.logger.log(`🗣️ TTS Generating (${voice}): "${text.slice(0, 20)}..."`);

    try {
      const params = new URLSearchParams();
      params.append('text', text);
      params.append('lang', 'ru-RU');
      params.append('voice', voice);
      params.append('folderId', folderId);
      params.append('format', 'mp3');

      const response = await axios.post(
        'https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize',
        params,
        {
          headers: { Authorization: `Api-Key ${apiKey}` },
          responseType: 'arraybuffer',
          timeout: 15000, // 15 seconds timeout
        },
      );
      return {
        buffer: Buffer.from(response.data),
        mimeType: 'audio/mpeg',
        format: 'mp3',
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ TTS Generation failed: ${msg}`);
      throw error;
    }
  }

  getBackgroundMusicUrl(theme: string = 'energetic'): string {
    // 1. Try to get from config
    const configKey = `MUSIC_URL_${theme.toUpperCase()}`;
    const configUrl = this.configService.get<string>(configKey);
    if (configUrl) {
      return configUrl;
    }

    // 2. Fallback to defaults
    const defaults: Record<string, string> = {
      energetic:
        'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3', //Placeholder URL
      calm: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3', //Placeholder URL
      lofi: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3', //Placeholder URL
    };
    return defaults[theme] || defaults['energetic'];
  }
}
