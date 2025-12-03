// src/common/tts.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { URLSearchParams } from 'url';

@Injectable()
export class TtsService {
  private readonly logger = new Logger(TtsService.name);

  constructor(private readonly configService: ConfigService) {}

  async generateSpeech(text: string, voice: string = 'ermil'): Promise<Buffer> {
    const apiKey = this.configService.get<string>('YANDEX_API_KEY');

    // 1. MOCK MODE (Если ключа нет или он 'mock')
    if (!apiKey || apiKey === 'mock') {
      this.logger.warn(`⚠️ TTS Mock: Returning beep for "${text.slice(0, 10)}..."`);
      // Возвращаем короткий "бип" вместо голоса для тестов
      const mockAudioUrl = 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg'; 
      const response = await axios.get(mockAudioUrl, { responseType: 'arraybuffer' });
      return Buffer.from(response.data);
    }

    // 2. YANDEX SPEECHKIT V1
    this.logger.log(`🗣️ TTS Generating (${voice}): "${text.slice(0, 20)}..."`);
    
    try {
      const params = new URLSearchParams();
      params.append('text', text);
      params.append('lang', 'ru-RU');
      params.append('voice', voice);
      params.append('folderId', this.configService.get<string>('YANDEX_FOLDER_ID') || '');
      params.append('format', 'mp3');
      
      const response = await axios.post(
        'https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize',
        params,
        {
          headers: { 'Authorization': `Api-Key ${apiKey}` },
          responseType: 'arraybuffer',
        }
      );
      return Buffer.from(response.data);
    } catch (error) {
      this.logger.error(`❌ TTS Generation failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  getBackgroundMusicUrl(theme: string = 'energetic'): string {
    // Пока хардкод (Royalte Free треки)
    const tracks: Record<string, string> = {
        energetic: 'https://github.com/remotion-dev/remotion/raw/main/packages/core/src/test/resources/sound.mp3', // Замени на свой S3 URL
        calm: 'https://github.com/remotion-dev/remotion/raw/main/packages/core/src/test/resources/sound.mp3',
        lofi: 'https://github.com/remotion-dev/remotion/raw/main/packages/core/src/test/resources/sound.mp3',
    };
    return tracks[theme] || tracks['energetic'];
  }
}