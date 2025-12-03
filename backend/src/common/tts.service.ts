// src/common/tts.service.ts

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

    constructor(private readonly configService: ConfigService) { }

    async generateSpeech(text: string, voice: string = 'ermil'): Promise<TtsResult> {
        const apiKey = this.configService.get<string>('YANDEX_API_KEY');

        // 1. MOCK MODE (Если ключа нет или он 'mock')
        if (!apiKey || apiKey === 'mock') {
            this.logger.warn(`⚠️ TTS Mock: Generating silent MP3 for "${text.slice(0, 10)}..."`);
            return {
                buffer: this.generateSilentMp3(2),
                mimeType: 'audio/mpeg',
                format: 'mp3'
            };
        }

        // 2. VALIDATION
        const folderId = this.configService.get<string>('YANDEX_FOLDER_ID');
        if (!folderId) {
            throw new Error('❌ TTS Configuration Error: YANDEX_FOLDER_ID is missing. Please check your .env file.');
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
                    headers: { 'Authorization': `Api-Key ${apiKey}` },
                    responseType: 'arraybuffer',
                    timeout: 15000, // 15 seconds timeout
                }
            );
            return {
                buffer: Buffer.from(response.data),
                mimeType: 'audio/mpeg',
                format: 'mp3'
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
            energetic: 'https://github.com/remotion-dev/remotion/raw/main/packages/core/src/test/resources/sound.mp3',
            calm: 'https://github.com/remotion-dev/remotion/raw/main/packages/core/src/test/resources/sound.mp3',
            lofi: 'https://github.com/remotion-dev/remotion/raw/main/packages/core/src/test/resources/sound.mp3',
        };
        return defaults[theme] || defaults['energetic'];
    }

    /**
     * Generates a minimal silent MP3 file for mock mode
     * Returns a valid MP3 file structure with silence
     */
    private generateSilentMp3(durationSeconds: number): Buffer {
        // Minimal valid MP3 file with ID3v2 header + one silent frame
        // This is a simplified MP3 with minimal overhead for testing
        const id3Header = Buffer.from([
            0x49, 0x44, 0x33, 0x04, 0x00, 0x00, // ID3v2.4 header
            0x00, 0x00, 0x00, 0x00              // Size = 0 (no tags)
        ]);
        
        // MP3 frame header for silence (Layer III, 44.1kHz, mono, 32kbps)
        const mp3Frame = Buffer.from([
            0xFF, 0xFB, 0x90, 0x00, // MP3 sync word + header
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
        ]);
        
        // Calculate how many frames needed for duration (rough estimate)
        // At 44.1kHz, each frame is ~26ms, so ~38 frames per second
        const framesNeeded = Math.ceil(durationSeconds * 38);
        
        const frames = Buffer.alloc(mp3Frame.length * framesNeeded);
        for (let i = 0; i < framesNeeded; i++) {
            mp3Frame.copy(frames, i * mp3Frame.length);
        }
        
        return Buffer.concat([id3Header, frames]);
    }
}